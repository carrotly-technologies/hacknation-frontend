import { RotateCcw } from 'lucide-react'
import { Button, RadioGroup, Switch } from '../components/ui'
import { DEFAULT_PREFS, type TextSize, type Theme, usePreferences } from '../lib/preferences'
import s from './SettingsPage.module.css'

const THEME_OPTIONS: { value: Theme; label: string; hint?: string }[] = [
  { value: 'system', label: 'Systemowy', hint: 'Jasny lub ciemny, tak jak w ustawieniach urządzenia' },
  { value: 'light', label: 'Jasny' },
  { value: 'dark', label: 'Ciemny' },
]

const TEXT_SIZE_OPTIONS: { value: TextSize; label: string }[] = [
  { value: 100, label: 'Standardowy (100%)' },
  { value: 125, label: 'Duży (125%)' },
  { value: 150, label: 'Bardzo duży (150%)' },
]

/** Appearance settings for every role: theme, text size, high contrast. Saved in this browser only. */
export function SettingsPage() {
  const [prefs, update] = usePreferences()
  const isDefault =
    prefs.theme === DEFAULT_PREFS.theme &&
    prefs.textSize === DEFAULT_PREFS.textSize &&
    prefs.highContrast === DEFAULT_PREFS.highContrast

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="h-page">Ustawienia</h1>
          <p className={s.lead}>Wygląd aplikacji. Zmiany działają od razu na wszystkich ekranach.</p>
        </div>
      </header>

      <div className={s.groups}>
        <section className={s.group}>
          <RadioGroup
            id="pref-theme"
            name="theme"
            legend={<h2 className={s.title}>Motyw</h2>}
            options={THEME_OPTIONS}
            value={prefs.theme}
            onChange={(v) => update({ theme: v as Theme })}
          />
        </section>

        <section className={s.group}>
          <RadioGroup
            id="pref-text-size"
            name="textSize"
            legend={<h2 className={s.title}>Rozmiar tekstu</h2>}
            hint="Powiększa tekst w całej aplikacji. Układ dopasuje się do ekranu."
            options={TEXT_SIZE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
            value={String(prefs.textSize)}
            onChange={(v) => update({ textSize: Number(v) as TextSize })}
          />
        </section>

        <section className={s.group} aria-labelledby="pref-contrast-title">
          <h2 id="pref-contrast-title" className={s.title}>
            Kontrast
          </h2>
          <p id="pref-contrast-hint" className={s.hint}>
            Ciemniejszy tekst, wyraźniejsze obramowania i podkreślone linki. Działa w obu motywach.
          </p>
          <Switch
            label="Wysoki kontrast"
            checked={prefs.highContrast}
            onChange={(e) => update({ highContrast: e.target.checked })}
            aria-describedby="pref-contrast-hint"
          />
        </section>
      </div>

      <div className={s.footer}>
        <p className={s.note}>Ustawienia zapisujemy tylko w tej przeglądarce, na tym urządzeniu.</p>
        {!isDefault && (
          <Button
            variant="secondary"
            size="small"
            icon={<RotateCcw size={16} aria-hidden="true" />}
            onClick={() => update(DEFAULT_PREFS)}
          >
            Przywróć domyślne
          </Button>
        )}
      </div>
    </div>
  )
}
