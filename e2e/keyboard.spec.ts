import { expect, test, type Locator, type Page } from '@playwright/test'
import { expectNoAxeViolations, PASSWORD, prepare, resetDemo, settle, SUPERVISOR } from './helpers.ts'

/**
 * The assessment path with the keyboard only (hacknation-frontend#162): sign-in → "Mój zespół" → employee profile →
 * the case file → every step of the stepper (and every part of "Formularz oceny") → the assessment talk →
 * "Weryfikacja formularza" (IPRZ, the sign dialog: focus trap, Esc, focus return) → "Ocena końcowa" → the link for the
 * assessed person. No mouse: only `keyboard.press` / `keyboard.type`. Every element that gets focus on the way must
 * show a focus ring. The demo case at the assessment talk (Katarzyna Zielińska in the backend seed) is used.
 */

const PERSON = 'Katarzyna Zielińska'
const MAX_TABS = 80

/** True when the focused element (or what draws its ring: ::after, its label or wrapper) shows a visible focus style. */
async function focusIsVisible(page: Page): Promise<{ visible: boolean; what: string }> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    if (!el || el === document.body) return { visible: false, what: 'body' }
    const ring = (cs: CSSStyleDeclaration) =>
      (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && cs.outlineColor !== 'rgba(0, 0, 0, 0)') ||
      (!!cs.boxShadow && cs.boxShadow !== 'none')
    const candidates: Element[] = [el]
    if (el instanceof HTMLInputElement) {
      candidates.push(...Array.from(el.labels ?? []))
      if (el.parentElement) candidates.push(el.parentElement)
    }
    const visible =
      candidates.some((c) => ring(getComputedStyle(c)) || ring(getComputedStyle(c, '::after')) || ring(getComputedStyle(c, '::before'))) ||
      // native date fields draw the ring of their inner parts themselves
      (el instanceof HTMLInputElement && el.type === 'date')
    const name = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60)
    return { visible, what: `<${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}> "${name}"` }
  })
}

const isFocused = (target: Locator) => target.evaluate((el) => el === document.activeElement).catch(() => false)

/** Presses Tab (or Shift+Tab) until `target` has focus; checks the focus ring of every element on the way. */
async function tabTo(page: Page, target: Locator, { back = false, max = MAX_TABS } = {}): Promise<void> {
  await expect(target).toBeVisible()
  for (let i = 0; i < max; i++) {
    if (await isFocused(target)) return
    await page.keyboard.press(back ? 'Shift+Tab' : 'Tab')
    const f = await focusIsVisible(page)
    if (f.what !== 'body') expect(f.visible, `no visible focus on ${f.what}`).toBe(true)
  }
  throw new Error(`${String(target)} not reached with ${max} × Tab`)
}

async function expectFocusInside(page: Page, container: Locator, when: string): Promise<void> {
  const inside = await container.evaluate((c) => c.contains(document.activeElement))
  expect(inside, `focus left ${String(container)} ${when}: ${(await focusIsVisible(page)).what}`).toBe(true)
}

test.beforeAll(resetDemo)
test.afterAll(resetDemo)

test('pełna ścieżka oceny tylko z klawiatury', async ({ page }) => {
  test.setTimeout(5 * 60_000)
  await prepare(page, 'jasny')

  // --- sign-in: the form, Enter submits
  await page.goto('/logowanie')
  await settle(page)
  await tabTo(page, page.getByLabel('Login'))
  await page.keyboard.type(SUPERVISOR)
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Hasło')).toBeFocused()
  await page.keyboard.type(PASSWORD)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/zespol$/)
  await settle(page)

  // --- skip link: the first Tab stop, Enter moves focus to the main area
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Przejdź do treści' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main')).toBeFocused()

  // --- user menu: opens with Enter, Esc closes it and gives focus back
  const userMenu = page.getByRole('button', { name: /menu użytkownika/ })
  await tabTo(page, userMenu, { back: true })
  await page.keyboard.press('Enter')
  await expect(userMenu).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(userMenu).toHaveAttribute('aria-expanded', 'false')
  await expect(userMenu).toBeFocused()

  // --- the team → the employee profile → the case file
  await tabTo(page, page.getByRole('link', { name: `Otwórz profil: ${PERSON}` }))
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: PERSON })).toBeVisible()
  await settle(page)
  await tabTo(page, page.getByRole('link', { name: 'Kontynuuj ocenę okresową' }))
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/teczka\/[^/]+\/rozmowa-oceniajaca/)
  await settle(page)
  const caseUrl = page.url().replace(/\/rozmowa-oceniajaca.*$/, '')

  // --- every step of the stepper, in order, opened with Enter
  const stepper = page.getByRole('navigation', { name: 'Etapy oceny okresowej' })
  const steps = stepper.getByRole('link')
  await expect(steps).toHaveCount(6)
  const count = 6
  await tabTo(page, steps.first(), { back: true })
  for (let i = 0; i < count; i++) {
    const step = steps.nth(i)
    await tabTo(page, step, { back: i === 0 })
    await page.keyboard.press('Enter')
    await expect(step).toHaveAttribute('aria-current', 'step')
    await settle(page)
    await expect(page.getByRole('region', { name: /^Etap: / })).toBeVisible()
    if (i === 1) {
      // "Formularz oceny": its parts I–III are links of the form progress
      const parts = page.getByRole('list', { name: /formularza/ }).getByRole('link')
      for (let n = 0; n < (await parts.count()); n++) {
        await tabTo(page, parts.nth(n))
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(new RegExp(`czesc=${n + 1}`))
        await settle(page)
      }
      await tabTo(page, steps.nth(i), { back: true })
    }
  }

  // --- step 4, "Rozmowa oceniająca": record the talk (the date field is filled with today)
  await tabTo(page, steps.nth(3), { back: true })
  await page.keyboard.press('Enter')
  await settle(page)
  await tabTo(page, page.getByRole('button', { name: 'Rozmowa przeprowadzona' }))
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/weryfikacja/)
  await settle(page)

  // --- step 5, "Weryfikacja formularza": IPRZ, then the sign dialog
  const iprz = page.getByLabel('Wnioski dotyczące indywidualnego programu rozwoju zawodowego')
  await tabTo(page, iprz)
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('Szkolenie z analizy danych i prowadzenia projektów.')
  const sign = page.getByRole('button', { name: 'Podpisz ocenę' })
  await tabTo(page, sign)
  // leaving the field saves the IPRZ; signing opens once the saved case passes the formal check
  await settle(page)
  await expect(sign).toBeEnabled()
  await expect(sign).toBeFocused()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Podpisać ocenę?' })
  await expect(dialog).toBeVisible()
  await expectFocusInside(page, dialog, 'on open')
  await expectNoAxeViolations(page, 'okno „Podpisać ocenę?”')
  // focus trap: Tab and Shift+Tab never leave the open dialog
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab')
    await expectFocusInside(page, dialog, `after Tab × ${i + 1}`)
  }
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Shift+Tab')
    await expectFocusInside(page, dialog, `after Shift+Tab × ${i + 1}`)
  }
  // Esc closes it and focus is back on the button that opened it
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(sign).toBeFocused()
  // open again at once and sign
  await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible()
  await tabTo(page, dialog.getByRole('button', { name: 'Podpisz', exact: true }))
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/dokument/)
  await settle(page)
  // the signing button is gone with the page: focus went to the main area, not to the top of the document
  await expect.poll(async () => (await focusIsVisible(page)).what, { timeout: 2_000 }).not.toBe('body')

  // --- step 6, "Ocena końcowa": the link for the assessed person
  const generate = page.getByRole('button', { name: 'Wygeneruj link dla ocenianego' })
  await tabTo(page, generate)
  await page.keyboard.press('Enter')
  const link = page.getByLabel('Link dla ocenianego')
  await expect(link).toHaveValue(/\/zapoznanie\/[\w-]+$/)
  const ackUrl = await link.inputValue()
  expect(page.url().startsWith(caseUrl)).toBe(true)

  // --- the assistant popup: Esc closes it and focus returns to its button
  const fab = page.getByRole('button', { name: 'Asystent AI' })
  await tabTo(page, fab)
  await page.keyboard.press('Enter')
  const popup = page.getByRole('dialog', { name: /Asystent/ })
  await expect(popup).toBeVisible()
  await expectNoAxeViolations(page, 'okno asystenta AI')
  await page.keyboard.press('Escape')
  await expect(popup).toBeHidden()
  await expect(fab).toBeFocused()

  // --- the assessed person opens the link and confirms with the keyboard
  await page.goto(new URL(ackUrl).pathname)
  await settle(page)
  const confirm = page.getByRole('checkbox', { name: /zapozna/i })
  await tabTo(page, confirm)
  await page.keyboard.press('Space')
  await expect(confirm).toBeChecked()
  await tabTo(page, page.getByRole('button', { name: /Potwierdzam/ }))
  await page.keyboard.press('Enter')
  await expect(page.getByText(/Potwierdzono zapoznanie/).first()).toBeVisible()
})
