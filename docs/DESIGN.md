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
| type | Open Sans 400/600/700; `--text-xs` 12 … `--text-body` 16 … `--text-3xl` 32 | forms use 16px |
| spacing | `--s-0` 2, `--s-1` 4, `--s-2` 8, `--s-3` 12, `--s-4` 16, `--s-5` 20, `--s-6` 24, `--s-8` 32, `--s-10` 40, `--s-12` 48, `--s-14` 56 | |
| radius | `--radius-xs` 4 (fields, alerts), `--radius` 8, `--radius-lg` 12 (cards), `--radius-xl` 16 (dialogs), `--radius-pill` (buttons, badges) | |
| sizes | `--control-h` 48, `--control-h-sm` 36, `--tap` 44, `--content-max` 1200, `--form-max` 640 | |

**Dark mode** is automatic (`prefers-color-scheme`); there is no toggle. The primitives (`--gray-*`,
`--blue-*`) and status colours are redefined, so anything built on tokens follows. `.theme-light` /
`.theme-dark` force a theme on a subtree (used by `/ui`). Text contrast is ≥ 4.5:1 in both modes.

## Components

| component | use |
|---|---|
| `Button` / `ButtonLink` | `variant` primary / secondary / tertiary / text, `destructive`, `size` large / small, `loading`, `disabled`, `icon`. One primary per screen. |
| `Field` | label + hint + error for one control, wired with `aria-describedby`; `asHeading` makes the label the page h1. |
| `Fieldset` | the same for groups (radios, checkboxes). |
| `TextInput`, `TextArea`, `Select` | native controls; `width={5 \| 10 \| 20}` for short answers. |
| `Checkbox`, `RadioGroup`, `Switch` | 24px native inputs; `RadioGroup` options take `conditional` (shown under the chosen option). Switch only for settings that apply at once. |
| `ErrorSummary` | errors at the top of the form, links to fields, takes focus after a failed submit. |
| `InlineAlert` | info / success / warning / error, icon + text. |
| `StatusBadge` | short status with a dot and text. |
| `Card` | content card; with `to` the whole card is a link (service tile). |
| `InfoList` + `InfoRow` | label/value rows, optional action ("Zmień"). |
| `Accordion` | native `<details>`; for content pages, never inside forms. |
| `Dialog` | native `<dialog>` (focus trap, Esc); bottom sheet on phones. |
| `Snackbar` | short confirmation with optional action, in a polite live region. |
| `EmptyState`, `Spinner`, `Stepper`, `SearchBar` | empty lists, loading, "Krok X z Y" + progress bar, search form. |
| `StageStepper` | horizontal process stepper (chevrons): done = dark + ✓, current = `--accent-subtle`, future = outlined; the step on screen has `aria-current="step"`; every step is a link; < 768px numbered dots + "Krok X z Y: name". |
| `BackLink` | "‹ Powrót" above the page content (`--link`, 44px target). |
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

`AppShell`: skip link "Przejdź do treści"; desktop: top bar ("Kompas kompetencji" + `UserMenu`) + navigation rail; phones (< 768px): compact top
bar + bottom navigation (team / knowledge base / "Więcej"), no horizontal scrolling. Content max width ~1200px.

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
