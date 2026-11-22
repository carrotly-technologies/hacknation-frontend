import { expect, test, type Page } from '@playwright/test'
import { ADMIN, api, apiLogin, expectNoAxeViolations, HR, prepare, resetDemo, settle, SUPERVISOR, THEME_NAMES } from './helpers.ts'

/**
 * axe-core (WCAG 2.0/2.1 A + AA) on every screen named in hacknation-frontend#162, in each theme.
 * Stage URLs come from the demo cases of the backend seed, one case per stage it is in, so every stage view
 * (src/case/stages) is scanned with real data: open, done and not yet open.
 */

type Screen = { name: string; path: string; as?: string; ready?: (page: Page) => Promise<void> }

const STAGE_SLUGS: Record<string, string> = {
  OSP_ANALYSIS: 'analiza-stanowiska',
  OPENING_TALK: 'rozmowa-rozpoczynajaca',
  ASSESSMENT: 'formularz-kompetencji',
  ASSESSMENT_TALK: 'rozmowa-oceniajaca',
  JUSTIFICATION: 'weryfikacja',
  DOCUMENT: 'dokument',
  INTRO_TALK: 'rozmowa-wstepna',
  REPORT: 'sprawozdanie',
  FIRST_ASSESSMENT: 'ocena-pierwsza',
  FIRST_CONDITIONS: 'warunki',
  FIRST_DOCUMENT: 'dokument-pierwsza',
}

type CaseRow = { id: string; path: 'PERIODIC' | 'FIRST'; currentStage: string; person: { id: string } }

let screens: Screen[] = []

test.beforeAll(async () => {
  await resetDemo()
  const sup = await apiLogin(SUPERVISOR)
  const cases = await api<CaseRow[]>(sup, 'GET', '/api/cases')
  const pick = (stage: string) => cases.find((c) => c.currentStage === stage)
  const periodic = (stage: string) => pick(stage) ?? cases.find((c) => c.path === 'PERIODIC')!
  const first = cases.find((c) => c.path === 'FIRST')!

  // a case signed and sent for acknowledgement gives the link for /zapoznanie/:token
  const talk = pick('ASSESSMENT_TALK')!
  await api(sup, 'POST', `/api/cases/${talk.id}/actions`, { action: 'RECORD_ASSESSMENT_TALK' })
  await api(sup, 'PATCH', `/api/cases/${talk.id}`, { iprz: 'Szkolenie z analizy danych.' })
  await api(sup, 'POST', `/api/cases/${talk.id}/actions`, { action: 'SIGN_ASSESSMENT' })
  const sent = await api<{ ackLink: string }>(sup, 'POST', `/api/cases/${talk.id}/actions`, { action: 'SEND_FOR_ACK' })

  const caseScreens: Screen[] = []
  const add = (c: CaseRow, stage: string, suffix = '', label = stage) =>
    caseScreens.push({ name: `teczka ${c.id} · ${label}`, path: `/teczka/${c.id}/${STAGE_SLUGS[stage]}${suffix}` })
  // periodic path: each step on the case that is at it, so the stage is open and editable
  add(periodic('OSP_ANALYSIS'), 'OSP_ANALYSIS')
  for (const n of [1, 2, 3]) add(periodic('OPENING_TALK'), 'OPENING_TALK', `?czesc=${n}`, `Formularz oceny, część ${n}`)
  add(periodic('ASSESSMENT'), 'ASSESSMENT', '', 'Formularz oceny kompetencji')
  add(periodic('ASSESSMENT'), 'ASSESSMENT_TALK')
  add(periodic('ASSESSMENT'), 'JUSTIFICATION', '', 'JUSTIFICATION (jeszcze nieotwarty)')
  add(talk, 'JUSTIFICATION')
  add(talk, 'DOCUMENT')
  add(periodic('DOCUMENT'), 'DOCUMENT', '', 'DOCUMENT (po zapoznaniu)')
  // first assessment
  for (const stage of ['INTRO_TALK', 'REPORT', 'FIRST_ASSESSMENT', 'FIRST_CONDITIONS', 'FIRST_DOCUMENT']) add(first, stage)

  screens = [
    { name: 'logowanie', path: '/logowanie' },
    { name: 'deklaracja dostępności', path: '/deklaracja-dostepnosci' },
    { name: 'zapoznanie', path: sent.ackLink },
    { name: 'zespół', path: '/zespol', as: SUPERVISOR },
    { name: 'profil pracownika', path: `/pracownik/${periodic('ASSESSMENT').person.id}`, as: SUPERVISOR },
    ...caseScreens.map((s) => ({ ...s, as: SUPERVISOR })),
    { name: 'arkusz (podgląd)', path: `/teczka/${talk.id}/arkusz`, as: SUPERVISOR },
    { name: 'baza wiedzy', path: '/baza-wiedzy', as: SUPERVISOR },
    { name: 'ustawienia', path: '/ustawienia', as: SUPERVISOR },
    { name: 'monitoring HR', path: '/hr', as: HR },
    { name: 'teczka tylko do odczytu (HR)', path: `/teczka/${periodic('ASSESSMENT').id}/formularz-kompetencji`, as: HR },
    { name: 'użytkownicy (admin)', path: '/admin/uzytkownicy', as: ADMIN },
    { name: 'dziennik zdarzeń (admin)', path: '/admin/dziennik', as: ADMIN },
  ]
})

for (const theme of THEME_NAMES) {
  test(`axe WCAG 2.1 AA, motyw: ${theme}`, async ({ browser }) => {
    test.setTimeout(10 * 60_000)
    const tokens = new Map<string, string>()
    const failures: string[] = []
    for (const screen of screens) {
      const token = screen.as ? (tokens.get(screen.as) ?? (await apiLogin(screen.as))) : undefined
      if (screen.as && token) tokens.set(screen.as, token)
      const context = await browser.newContext()
      const page = await context.newPage()
      try {
        await prepare(page, theme, token)
        await page.goto(screen.path)
        await settle(page)
        // the screen itself, not a redirect (to sign-in, another role's start page or another stage)
        expect(new URL(page.url()).pathname).toBe(screen.path.split('?')[0])
        await expect(page.locator('h1').first()).toBeVisible()
        await screen.ready?.(page)
        await expectNoAxeViolations(page, `${screen.name} (${screen.path})`)
      } catch (err) {
        failures.push(`■ ${screen.name} [${theme}] ${screen.path}\n${String(err instanceof Error ? err.message : err)}`)
      } finally {
        await context.close()
      }
    }
    expect(failures, failures.join('\n\n')).toEqual([])
  })
}
