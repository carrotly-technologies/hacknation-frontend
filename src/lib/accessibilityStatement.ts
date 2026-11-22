/**
 * Data of the accessibility statement (/deklaracja-dostepnosci), required by the act of 4 April 2019 on digital
 * accessibility (ustawa o dostępności cyfrowej stron internetowych i aplikacji mobilnych podmiotów publicznych,
 * Dz.U. 2019 poz. 848, art. 10). The layout follows the statement template (wzór deklaracji dostępności).
 *
 * DEMO DATA: the entity, the contact person and the dates are examples, marked as such on the page. An office that
 * deploys the app replaces them here (one place) after its own review; the app address is the current origin.
 * The audit behind the status and the list of inaccessible content: docs/wcag.md.
 */
export const STATEMENT = {
  /** Shown with the "(przykład)" mark while `demo` is true. */
  demo: true,
  entity: 'Urząd Przykładowy w Warszawie',
  appName: 'Kompas Kompetencji',
  /** RRRR-MM-DD */
  publishedOn: '2026-11-21',
  updatedOn: '2026-11-22',
  preparedOn: '2026-11-22',
  reviewedOn: '2026-11-22',
  contact: {
    person: 'Anna Przykładowa',
    email: 'dostepnosc@urzad.example',
    phone: '+48 22 000 00 00',
  },
  /** Legal source of the procedure text below. */
  act: 'ustawa z dnia 4 kwietnia 2019 r. o dostępności cyfrowej stron internetowych i aplikacji mobilnych podmiotów publicznych (Dz.U. 2019 poz. 848)',
  rpoUrl: 'https://www.rpo.gov.pl/',
} as const
