import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../../components/ui'
import s from './SheetWizard.module.css'

/** Heading of one part of the sheet ("Część I · Kryteria oceny i termin"). */
export function PartHeading({ roman, children }: { roman: string; children: ReactNode }) {
  return (
    <h3 className={s.partHeading}>
      <span className={s.partKicker}>Część {roman}</span>
      {children}
    </h3>
  )
}

/** Bottom row of a part: "Wstecz" as a text button first, the primary "Dalej" last. */
export function WizardActions({ onBack, loading, nextLabel = 'Dalej' }: { onBack?: () => void; loading?: boolean; nextLabel?: string }) {
  return (
    <div className={s.actions}>
      {onBack && (
        <Button variant="text" icon={<ArrowLeft size={18} aria-hidden="true" />} onClick={onBack}>
          Wstecz
        </Button>
      )}
      <Button type="submit" loading={loading}>
        {nextLabel}
      </Button>
    </div>
  )
}

/** A titled group of read-only or editable rows inside a part. */
export function PartSection({ title, hint, children }: { title: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className={s.section}>
      <h4 className={s.sectionTitle}>{title}</h4>
      {hint && <p className={s.sectionHint}>{hint}</p>}
      {children}
    </section>
  )
}
