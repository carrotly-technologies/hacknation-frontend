// Exports the presentation (/prezentacja) to docs/prezentacja.pdf: 16:9 (1920×1080), one slide per page, light
// theme, without the controls. The page needs no backend and no sign-in.
//   npx playwright install chromium   (once)
//   npm run presentation:pdf
// By default the script starts its own Vite dev server on a free port; APP_URL=http://localhost:5173 uses a running
// one instead.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const ROOT = path.join(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'docs', 'prezentacja.pdf')

let server
let appUrl = process.env.APP_URL?.replace(/\/$/, '')
if (!appUrl) {
  server = await createServer({ root: ROOT, logLevel: 'warn', server: { port: 0, strictPort: false } })
  await server.listen()
  appUrl = server.resolvedUrls.local[0].replace(/\/$/, '')
}

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto(`${appUrl}/prezentacja#1`, { waitUntil: 'networkidle' })
  await page.locator('section[aria-roledescription="slajd"]').first().waitFor({ state: 'attached' })
  const slides = await page.locator('section[aria-roledescription="slajd"]').count()
  await page.emulateMedia({ media: 'print' })
  // Every screenshot must be loaded before printing (inactive slides are hidden on screen, so images load lazily).
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      [...document.images].map((img) => (img.complete ? null : new Promise((done) => img.addEventListener('load', done, { once: true })))),
    )
  })
  await page.pdf({ path: OUT, width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true })

  const pages = ((await readFile(OUT, 'latin1')).match(/\/Type\s*\/Page[^s]/g) ?? []).length
  if (pages !== slides) throw new Error(`PDF has ${pages} pages, the deck has ${slides} slides`)
  console.log(`Saved ${path.relative(ROOT, OUT)}: ${pages} pages`)
} finally {
  await browser.close()
  await server?.close()
}
