# Design system

Public-service look: the gov.pl web palette and the token scale of the public e-service app, plus the
patterns of the GOV.UK Design System. We borrow only the style and the patterns: **no official logos,
emblems or product names**.

- Tokens: `src/styles/tokens.css` (CSS variables). Components never use hex values.
- Components: `src/components/ui/` (CSS Modules, native elements, no UI kit), imported from `components/ui`.
- Live catalogue: **`/ui`** (every component in every variant and state, light and dark side by side).
- Form pattern: **`/wniosek-demo`** (step by step, check answers, confirmation).

## Tokens

| group | tokens | notes |
|---|---|---|
| surfaces | `--bg-app`, `--bg-surface`, `--bg-subtle`, `--bg-muted`, `--bg-hover`, `--bg-overlay` | grey canvas, white cards |
| text | `--text` (#1B1F26), `--text-secondary`, `--text-muted`, `--text-faint` (decorative only) | all except faint ≥ 4.5:1 |
| borders | `--border`, `--border-strong`, `--border-input` (≥ 3:1 for fields) | |
| accent | `--accent` (#0052A5), `--accent-hover`, `--accent-subtle`, `--accent-faint`, `--on-accent`, `--link`, `--link-hover` (#006CD7) | the only brand colour |
| status | `--ok*`, `--warn*`, `--danger*` (+ `--danger-strong` #900E1D), `--info*`, each with `-bg`, `-border`, `--on-*` | success bg #EEFAE1 |
| focus | `--focus` (#0452A8), `--focus-shadow` = `0 0 0 2px focus, 0 0 0 4px inner, 0 0 0 6px focus` | gov.pl triple ring |
| type | Open Sans 400/600/700; `--text-xs` 12 … `--text-body` 16 … `--text-3xl` 32 (px at 100%, defined in `rem`) | forms use 16px |
| spacing | `--s-0` 2, `--s-1` 4, `--s-2` 8, `--s-3` 12, `--s-4` 16, `--s-5` 20, `--s-6` 24, `--s-8` 32, `--s-10` 40, `--s-12` 48, `--s-14` 56 | |
| radius | `--radius-xs` 4 (fields, alerts), `--radius` 8, `--radius-lg` 12 (cards), `--radius-xl` 16 (dialogs), `--radius-pill` (buttons, badges) | |
| sizes | `--control-h` 48, `--control-h-sm` 36, `--tap` 44 (these three and `--topbar-h` in `rem`), `--content-max` 1200, `--form-max` 640 | |

**Dark mode** follows the system (`prefers-color-scheme`) by default; in `/ustawienia` the user can force
"Jasny" or "Ciemny", which puts `data-theme="light" | "dark"` on `<html>` (`src/lib/preferences.ts`, stored in
`localStorage` as `kompas.prefs`; an inline script in `index.html` applies it before the first paint). The
primitives (`--gray-*`, `--blue-*`) and status colours are redefined, so anything built on tokens follows.
`.theme-light` / `.theme-dark` force a theme on a subtree (used by `/ui`). Text contrast is ≥ 4.5:1 in both modes.

**High contrast** (`data-contrast="high"` on `<html>`, a switch in `/ustawienia`) overrides only the semantic
roles, for both themes: text and links ≥ 7:1 on every background role, control borders and the focus ring
≥ 3:1, status and score colours ≥ 7:1, links fully underlined.

**Text size** (`/ustawienia`: 100 / 125 / 150%) is `font-size` on `<html>`. Text, control heights and
anything holding text are in `rem`, so they grow with it; spacing, borders, radii and icons stay in `px`.
New text sizes and heights of elements with text go in `rem` (px ÷ 16). At 150% and 375px wide nothing
may scroll sideways (WCAG 1.4.4, 1.4.10); on phones buttons wrap their label.

## Components

| component | use |
|---|---|
| `Button` / `ButtonLink` | `variant` primary / secondary / tertiary / text, `destructive`, `size` large / small, `loading`, `disabled`, `icon`. One primary per screen. |
| `Field` | label + hint + error for one control, wired with `aria-describedby`; `asHeading` makes the label the page h1. |
| `Fieldset` | the same for groups (radios, checkboxes). |
| `TextInput`, `TextArea`, `Select` | native controls; `width={5 \| 10 \| 20}` for short answers. |
| `Checkbox`, `RadioGroup`, `Switch` | 24px native inputs (1.5rem, grow with the text size); `RadioGroup` options take `conditional` (shown under the chosen option). Switch only for settings that apply at once. |
| `RadioMatrix` | several questions on one scale (e.g. partial scores): from 768px a table (rows × columns, the whole cell clickable), below one row per question with the values as segments in one line and the chosen one spelled out; `groups` with headers, `readOnly`, `error` per row (linked from `ErrorSummary` via `${id}-${row.id}`), arrows move within a row. Columns come from the data, never hard-coded scales. |
| `ErrorSummary` | errors at the top of the form, links to fields, takes focus after a failed submit. |
| `InlineAlert` | info / success / warning / error, icon + text. |
| `StatusBadge` | short status with a dot and text. |
| `ResultPanel` | assessment result: positive (green, check) / negative (red, cross) / provisional or none (neutral, info), with summary, missing and reason. Used for the result instead of a badge. |
| `Card` | content card; with `to` the whole card is a link (service tile). `collapsible` (+ `defaultOpen`, `subtitle`): the same card, closed by default, whose heading is a full-width `<button aria-expanded aria-controls>` (min. 48px, hover + focus ring, chevron rotates 180°, no animation with reduced motion); use it for long secondary content in a column of cards ("Opis stanowiska" on the employee profile). |
| `InfoList` + `InfoRow` | label/value rows, optional action ("Zmień"). |
| `Accordion` | native `<details>`; for content pages, never inside forms. |
| `Dialog` | native `<dialog>` (focus trap, Esc); bottom sheet on phones. |
| `Snackbar` | short confirmation with optional action, in a polite live region. |
| `EmptyState`, `Spinner`, `Stepper`, `SearchBar` | empty lists, loading, "Krok X z Y" + progress bar (`unit`, `name`: "Część 2 z 3: Ocena okresowa"), search form. |
| `StageStepper` | horizontal process stepper (chevrons): done = light green + ✓, future = grey outline, the current step while another one is shown = white with an `--accent` border and text; the step on screen (any state, also done, then with an `--accent` ✓) = `--accent-subtle` fill, `--accent-border` border, `--accent` bold label, no extra outline, `aria-current="step"` and hidden "(wyświetlany)"; every step is a link; < 768px numbered dots + "Krok X z Y: name". |
| `FormProgress` | progress of a multi-part form ("Formularz oceny", "Formularz oceny kompetencji"): full-width `Stepper` bar with the "{unit} X z N: name" counter for screen readers only, then the parts always in one row (`repeat(var(--n), minmax(0, 1fr))`, `--n` = number of parts) with numbered circles, ✓ for done, the current one marked (`aria-current="step"`); a step with `to` is a link; names on one line with "…" and `title`; a column < 6rem (container query) shows only the circle, the name stays in `title` and for screen readers. |
| `BackLink` | "‹ Powrót" above the page content (`--link`, 44px target). |
| `PageLayout` | frame of every main page: the `--content-max` (1200px) container centred with `--page-pad-x` side padding (16px below 768px), then `back` (e.g. `BackLink`), the h1 (`title`), one `meta` line ("…" + `title`), `actions` on the right (under the title below 768px), and the content with a fixed `--s-6` gap between the header and each section. `fill`: from 1024px the page is exactly the window height and the content scrolls inside (`/baza-wiedzy`). |
| `UserMenu` | top-bar avatar + name + role + chevron; disclosure menu (Esc / click outside close it). |

```tsx
import { Button, ErrorSummary, Field, TextInput } from '../components/ui'

<form noValidate onSubmit={onSubmit}>
  <ErrorSummary errors={errors} />
  <Field id="pesel" asHeading label="Jaki jest Twój numer PESEL?" hint="Ma 11 cyfr." error={errorFor('pesel')}>
    {(p) => <TextInput {...p} width={20} inputMode="numeric" value={pesel} onChange={(e) => setPesel(e.target.value)} />}
  </Field>
  <Button type="submit">Dalej</Button>
</form>
```

## Layout

`AppShell`: skip link "Przejdź do treści"; top bar with the product name, the main links, the settings gear
(`/ustawienia`) and `UserMenu`; below 1024px the links go under a "Menu" button, and below 768px the gear moves
into that menu as "Ustawienia". No horizontal scrolling.

Every main page ("Mój zespół", "Baza wiedzy", HR, the employee profile, settings, admin…) is a `PageLayout`, so the
left edge of the h1 and of the content stays in the same place when switching tabs (WCAG 3.2.3 / 3.2.4); the case
file header and workspace use the same container. Width follows the content: tables and lists may use the whole
1200px, running text stays at `--measure` (≤ 75 characters, WCAG 1.4.8). A list of people with one or two pieces of
information is a list of rows (name, "Otwórz ›"), not a table. "Baza wiedzy": chat 2fr | sources 1fr from 1024px,
the source list and the messages scroll inside (keyboard-focusable regions), no floating assistant button there.

## UX rules

1. **One question per page** in multi-step forms, the question is the h1, "Krok X z Y" above it.
2. **Check answers** page before sending, each answer with a "Zmień" link back to its step; then a **confirmation** page.
3. **Errors**: summary at the top (focused after submit, links to fields) and a message at the field; prefix the page title with "Błąd:".
4. **Progressive disclosure**: conditional fields under the chosen radio option; no accordions in forms.
5. **Plain language**; label above the field, hint under the label, never a placeholder as the label.
6. **"Wstecz"** always keeps what was typed.
7. **Accessibility** (WCAG 2.1 AA): contrast ≥ 4.5:1, visible focus ring on every interactive element, 44px touch targets, everything works with the keyboard, colour is never the only cue.

## Case screen (design "Kompas kompetencji", frames 1–2)

`src/case/CasePage.tsx`: `BackLink`, the assessed person as h1 with the position under it, then the `StageStepper`
with the six steps of the periodic assessment (`caseSteps` in `src/lib/stages.ts` groups backend stages into them:
"Formularz oceny" = part I + the assessment period; the first-assessment path shows its own stages). Below: a side
column (criteria while rating, "Oceniany", "Historia") and the stage. Redrawn stages use `StageLayout`
(`src/case/stages/StageLayout.tsx`): heading, deadline and legal basis, content, actions bottom right
(text link first, the one primary last).
