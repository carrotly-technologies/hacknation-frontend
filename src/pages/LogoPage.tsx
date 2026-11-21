import { CircleCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { errorMessage } from '../api/client'
import type { LogoChoice } from '../api/branding'
import { Svg } from '../branding/BrandLogo'
import { findLogo, LOGOS, type Logo } from '../branding/logos'
import { useAcceptLogo, useLogoChoice } from '../branding/useBrandLogo'
import { ErrorState, LoadingState } from '../components/QueryState'
import { Button, ErrorSummary, Fieldset, InlineAlert, StatusBadge, type FormError } from '../components/ui'
import { cx } from '../components/ui/cx'
import choice from '../components/ui/Choice.module.css'
import s from './LogoPage.module.css'

const FIELD_ID = 'logo'

/**
 * /logo: the 15 logo proposals; the one accepted here is shown by the whole app (top bar, sign-in page,
 * favicon) for every user. Every role may accept. Reachable only by its address, not from the menu.
 */
export function LogoPage() {
  const current = useLogoChoice()
  const accept = useAcceptLogo()
  const acceptedId = findLogo(current.data?.logoId)?.id ?? null
  /** null: nothing picked on this page yet, so the accepted logo is the selected one. */
  const [picked, setPicked] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormError[]>([])
  const value = picked ?? acceptedId ?? ''
  const selected = findLogo(value)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (accept.isPending) return
    if (!selected) {
      setErrors([{ id: FIELD_ID, message: 'Wybierz logo, które chcesz zatwierdzić' }])
      return
    }
    setErrors([])
    accept.mutate(selected.id, { onSuccess: () => setPicked(null) })
  }

  const onPick = (id: string) => {
    setPicked(id)
    setErrors([])
    accept.reset()
  }

  const justAccepted = accept.isSuccess ? findLogo(accept.data.logoId) : null

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="h-page">{errors.length > 0 && <span className="visually-hidden">Błąd: </span>}Logo aplikacji</h1>
          <p className={s.lead}>
            Wybierz jedną z {LOGOS.length} propozycji i zatwierdź ją. Zatwierdzone logo zobaczą wszyscy użytkownicy: w górnym
            pasku, na stronie logowania i na karcie przeglądarki.
          </p>
        </div>
      </header>

      <div className={s.status}>
        {current.isPending ? (
          <LoadingState label="Wczytywanie zatwierdzonego logo…" />
        ) : current.isError ? (
          <ErrorState error={current.error} what="zatwierdzone logo" onRetry={() => void current.refetch()} />
        ) : (
          <AcceptedInfo choice={current.data} />
        )}
      </div>

      <form noValidate onSubmit={onSubmit}>
        <ErrorSummary errors={errors} />
        <Fieldset
          id={`${FIELD_ID}-group`}
          className={s.fieldset}
          legend={<h2 className={s.legend}>Propozycje logo</h2>}
          hint="Każda propozycja w wersji na jasne i na ciemne tło oraz sam znak w rozmiarze ikony (32 px)."
          error={errors[0]?.message}
        >
          <div className={s.grid}>
            {LOGOS.map((logo, i) => (
              <LogoCard
                key={logo.id}
                logo={logo}
                inputId={i === 0 ? FIELD_ID : `${FIELD_ID}-${logo.id}`}
                checked={value === logo.id}
                accepted={acceptedId === logo.id}
                invalid={errors.length > 0}
                onPick={onPick}
              />
            ))}
          </div>
        </Fieldset>

        <div className={s.actions}>
          {accept.isError && (
            <InlineAlert tone="error" live title="Nie udało się zatwierdzić logo">
              {errorMessage(accept.error)} Spróbuj ponownie.
            </InlineAlert>
          )}
          {justAccepted && (
            <InlineAlert tone="success" live title={`Zatwierdzono logo „${justAccepted.name}”`}>
              Aplikacja pokazuje je od teraz wszystkim użytkownikom.
            </InlineAlert>
          )}
          <div className={s.actionsRow}>
            <p className={s.picked} aria-live="polite">
              {selected ? (
                <>
                  Wybrane: <strong>{selected.n}. {selected.name}</strong>
                  {selected.id === acceptedId && ' (zatwierdzone)'}
                </>
              ) : (
                'Nie wybrano logo'
              )}
            </p>
            <Button type="submit" loading={accept.isPending} icon={<CircleCheck size={20} aria-hidden="true" />}>
              Zatwierdź logo
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

function AcceptedInfo({ choice: c }: { choice: LogoChoice }) {
  const logo = findLogo(c.logoId)
  if (!logo) {
    return (
      <InlineAlert title="Nie zatwierdzono jeszcze logo">
        Aplikacja pokazuje logo domyślne (ikonę kompasu). Wybierz propozycję poniżej i zatwierdź ją.
      </InlineAlert>
    )
  }
  return (
    <InlineAlert title={`Zatwierdzone logo: ${logo.n}. ${logo.name}`}>
      {c.acceptedBy && c.acceptedAt ? `Zatwierdził(a): ${c.acceptedBy.name}, ${fmtDateTime(c.acceptedAt)}.` : null}
    </InlineAlert>
  )
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString('pl-PL')}, godz. ${d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`
}

type CardProps = {
  logo: Logo
  inputId: string
  checked: boolean
  accepted: boolean
  invalid: boolean
  onPick: (id: string) => void
}

/** One proposal; the whole card selects its radio (the label stretches over the card). */
function LogoCard({ logo, inputId, checked, accepted, invalid, onPick }: CardProps) {
  const ideaId = `${inputId}-idea`
  return (
    <div className={cx(s.card, checked && s.checked, accepted && s.accepted)}>
      <div className={s.head}>
        <input
          id={inputId}
          type="radio"
          name="logo"
          value={logo.id}
          checked={checked}
          onChange={() => onPick(logo.id)}
          aria-describedby={ideaId}
          aria-invalid={invalid || undefined}
          className={cx(choice.input, choice.radio, s.radio)}
        />
        <label htmlFor={inputId} className={s.title}>
          {logo.n}. {logo.name}
          {logo.outOfStyle && <span className={s.outOfStyle}> (poza stylem)</span>}
        </label>
        {accepted && <StatusBadge tone="success">Zatwierdzone</StatusBadge>}
      </div>
      <p id={ideaId} className={s.idea}>
        {logo.idea}
      </p>
      <div className={s.previews} aria-hidden="true">
        <div className={cx('theme-light', s.preview)}>
          <Svg markup={logo.light} className={s.previewSvg} />
          <span className={s.caption}>Jasny motyw</span>
        </div>
        <div className={cx('theme-dark', s.preview)}>
          <Svg markup={logo.dark} className={s.previewSvg} />
          <span className={s.caption}>Ciemny motyw</span>
        </div>
        <div className={cx('theme-light', s.preview, s.previewMark)}>
          <Svg markup={logo.mark} className={s.mark32} />
          <span className={s.caption}>Znak 32 px</span>
        </div>
      </div>
    </div>
  )
}
