/**
 * Every page (the case file too) scrolls in one place: the main area of AppShell (`<main id="main">`), under the
 * fixed topbar. Changing a step or a part of a form starts at the top of that area.
 */
export function scrollPageToTop() {
  document.getElementById('main')?.scrollTo({ top: 0 })
}
