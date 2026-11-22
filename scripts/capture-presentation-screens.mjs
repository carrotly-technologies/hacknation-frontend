// Screenshots of the app for the presentation (/prezentacja), saved as public/prezentacja/*.png.
// Needs the frontend and the backend running with the demo seed (fictional people only):
//   backend:  npm run start:dev                  (hacknation-backend, port 3000)
//   frontend: npm run dev                        (this repo, port 5173)
//   then:     npx playwright install chromium    (once)
//             npm run presentation:screens       (APP_URL=http://localhost:5173 by default)
// The script resets the demo data (POST /api/demo/reset, as admin) before and after, signs in as the demo supervisor
// k.wisniewska and walks one case to the signature so the link for the assessed person exists.
import { mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const APP_URL = (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')
const API = `${APP_URL}/api`
const OUT = path.join(import.meta.dirname, '..', 'public', 'prezentacja')
const MAX_BYTES = 400_000 // per image, so the deck loads fast
const LOGIN = 'k.wisniewska'
const PASSWORD = 'Kompas2026!' // demo password from the backend README (src/lib/demoAccounts.ts)

async function api(method, route, token, body) {
  const res = await fetch(`${API}${route}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${method} ${route}: ${res.status} ${await res.text()}`)
  return res.status === 204 ? null : res.json()
}

const { accessToken: token } = await api('POST', '/auth/login', null, { login: LOGIN, password: PASSWORD })
// the demo reset is ADMIN/HR only
const { accessToken: adminToken } = await api('POST', '/auth/login', null, { login: 'admin', password: PASSWORD })
await api('POST', '/demo/reset', adminToken)

// Slide 5: indicator answers in the first competency of c-001, so the system shows its suggestion.
await api('PATCH', '/cases/c-001', token, {
  ratings: { wykorzystywanie_wiedzy: { 'wykorzystywanie_wiedzy.1': 7, 'wykorzystywanie_wiedzy.2': 7, 'wykorzystywanie_wiedzy.3': 5 } },
})

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()

/** A signed-in page: the token goes to sessionStorage before the app starts (src/lib/session.ts). */
async function page(viewport, scheme = 'light') {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: scheme, reducedMotion: 'reduce', locale: 'pl-PL' })
  await ctx.addInitScript((t) => sessionStorage.setItem('kompas.token', t), token)
  return ctx.newPage()
}

async function open(p, route, ready) {
  await p.goto(APP_URL + route)
  await p.getByText(ready).first().waitFor()
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(300)
}

/** Scrolls the element under the sticky case header (or to the centre) and lets the page settle. */
async function scrollTo(p, locator, block = 'start') {
  await locator.first().evaluate((el, b) => {
    el.scrollIntoView({ block: b })
    if (b !== 'start') return
    // Leave room for the sticky top bar and case header.
    const covered = [...document.querySelectorAll('body *')]
      .filter((x) => ['sticky', 'fixed'].includes(getComputedStyle(x).position) && x.getBoundingClientRect().top <= 1)
      .reduce((m, x) => Math.max(m, x.getBoundingClientRect().bottom), 0)
    window.scrollBy(0, -covered - 24)
  }, block)
  await p.waitForTimeout(250)
}

async function shot(p, name, opts = {}) {
  const file = path.join(OUT, `${name}.png`)
  await p.screenshot({ path: file, ...opts })
  const { size } = await stat(file)
  if (size > MAX_BYTES) console.warn(`${name}.png is ${Math.round(size / 1024)} kB (limit 400 kB)`)
}

const desktop = { width: 1280, height: 720 }

// Slide 3: "Mój zespół".
let p = await page(desktop)
await open(p, '/zespol', 'Pracownicy')
await shot(p, 'zespol')

// Slide 4: job description analysis (tasks and competencies of the position).
await open(p, '/teczka/c-002/analiza-osp', 'Zadania pracownika')
await shot(p, 'analiza-osp')

// Slide 5: the system's suggestion and the supervisor's decision (a tall window, so the whole section fits).
const tall = await page({ width: 1280, height: 1600 })
await open(tall, '/teczka/c-001/formularz-kompetencji', 'Sugestia systemu')
await tall.getByText('Średnia').first().waitFor()
const decision = tall.locator('section[aria-labelledby="decyzja-h"]')
await scrollTo(tall, decision)
const box = await decision.boundingBox()
await shot(tall, 'sugestia', { clip: { x: box.x - 24, y: box.y + 4, width: box.width + 48, height: box.height + 20 } })
await tall.context().close()

// Slide 6: the assistant answers with sources.
await open(p, '/teczka/c-006/dokument', 'Dokument i zapoznanie')
await p.getByRole('button', { name: 'Asystent AI' }).click()
const dialog = p.getByRole('dialog')
await dialog.getByRole('textbox').fill('W jakim terminie można wnieść sprzeciw od oceny okresowej?')
await dialog.getByRole('textbox').press('Enter')
await dialog.locator('.msg__sources').first().waitFor({ timeout: 30_000 })
await dialog.locator('.msg--user').last().evaluate((el) => el.scrollIntoView({ block: 'start' }))
await p.waitForTimeout(300)
await shot(p, 'asystent', { clip: await dialog.boundingBox() })

// Slide 7: c-007 after the assessment talk, signed and handed over to the assessed person (after the team
// screenshot, so that one shows the seed as it is): the final step with the downloads, and the link on a phone.
await api('POST', '/cases/c-007/actions', token, { action: 'RECORD_ASSESSMENT_TALK' })
await api('PATCH', '/cases/c-007', token, { iprz: 'Szkolenie z zarządzania incydentami w cyberprzestrzeni (II kwartał 2027).' })
await api('POST', '/cases/c-007/actions', token, { action: 'SIGN_ASSESSMENT' })
const { ackLink } = await api('POST', '/cases/c-007/actions', token, { action: 'SEND_FOR_ACK' })
await open(p, '/teczka/c-007/dokument', 'Dokument i zapoznanie')
await scrollTo(p, p.getByRole('heading', { name: 'Arkusz oceny' }))
await shot(p, 'dokument')
await p.context().close()

p = await page({ width: 390, height: 844 })
await p.goto(APP_URL + ackLink)
await p.getByText('Potwierdzenie zapoznania').first().waitFor()
await p.evaluate(() => document.fonts.ready)
await shot(p, 'zapoznanie')
await p.context().close()

await browser.close()
await api('POST', '/demo/reset', adminToken)
console.log(`Screenshots saved in ${OUT}`)
