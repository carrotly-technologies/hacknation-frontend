import type { ExamPassed } from '../../api/cases'
import { Field, InfoList, InfoRow, RadioGroup, TextArea } from '../../components/ui'
import { usePatchCase } from '../../lib/caseQueries'
import { fmtDate } from '../../lib/format'
import { liveResult } from '../../lib/result'
import type { StageProps } from '../CasePage'
import s from './AssessmentTalkStage.module.css'
import { ResultSummary } from './CompetencyScores'
import { FormalCheck, SignedStatus } from './FormalCheck'
import { StageError, StageLayout } from './StageLayout'
import layout from './StageLayout.module.css'
import { useDraft } from './useDraft'

const EXAM: { v: ExamPassed; label: string; hint?: string }[] = [
  { v: 'YES', label: 'Tak' },
  { v: 'NO', label: 'Nie' },
  { v: 'NOT_APPLICABLE', label: 'Nie dotyczy', hint: 'Absolwent KSAP, zatrudnienie na zastępstwo lub na wyższym stanowisku.' },
]

/**
 * Step "Warunki pierwszej oceny": the preparatory-service exam as one radio question, the report as a read-only
 * summary filled in from the dates, the result as in steps 5–6, then the justification and development conclusions.
 */
export function FirstConditionsStage({ detail, model, criteria, stage }: StageProps) {
  const info = detail.stages.find((x) => x.id === stage)!
  const patch = usePatchCase(detail.id)
  const locked = !!detail.signedByEvaluatorOn
  const fc = detail.firstConditions
  const r = liveResult(detail, criteria.all, model)
  const negative = r.result === 'NEGATIVE'
  const just = useDraft(detail.justification, (v) => patch.mutate({ justification: v }))
  const dev = useDraft(detail.iprz, (v) => patch.mutate({ iprz: v }))
  const onTime = fc?.reportSubmittedOn && fc.reportDue ? fc.reportSubmittedOn <= fc.reportDue : null

  return (
    <StageLayout info={info} status={locked && <SignedStatus detail={detail} />}>
      <RadioGroup
        id="exam1"
        name="exam"
        legend="Oceniany zaliczył egzamin ze służby przygotowawczej"
        options={EXAM.map((o) => ({ value: o.v, label: o.label, hint: o.hint, disabled: locked }))}
        value={fc?.examPassed ?? ''}
        onChange={(v) => patch.mutate({ firstConditions: { examPassed: v as ExamPassed } })}
      />

      <section aria-labelledby="report-h" className={s.section}>
        <h3 id="report-h" className={s.heading}>Sprawozdanie złożone w wyznaczonym terminie</h3>
        <InfoList>
          <InfoRow label="Termin złożenia sprawozdania" value={fmtDate(fc?.reportDue)} />
          <InfoRow label="Data złożenia" value={fmtDate(fc?.reportSubmittedOn)} />
          <InfoRow label="Złożone w terminie" value={onTime === null ? '—' : onTime ? 'Tak' : 'Nie'} />
        </InfoList>
        <p className={layout.muted}>Uzupełniane automatycznie z dat.</p>
      </section>

      {/* Not a <section>: the panel is itself the "Wynik oceny" region. */}
      <div className={s.section}>
        <h3 className={s.heading}>Wynik oceny</h3>
        <ResultSummary result={r} averageLabel="Ocena łączna" />
      </div>

      <section aria-labelledby="writing-h" className={s.section}>
        <h3 id="writing-h" className={s.heading}>Uzasadnienie i rozwój</h3>
        <Field id="just1" label="Uzasadnienie" optional={!negative}>
          {(p) => <TextArea {...p} rows={6} readOnly={locked} value={just.value} onChange={(e) => just.change(e.target.value)} onBlur={just.flush} />}
        </Field>
        <Field id="dev1" label="Wnioski dotyczące rozwoju zawodowego" optional={!negative}>
          {(p) => (
            <TextArea
              {...p}
              rows={4}
              readOnly={locked || negative}
              value={dev.value}
              onChange={(e) => dev.change(e.target.value)}
              onBlur={dev.flush}
              placeholder={negative ? 'Przy ocenie negatywnej nie wpisuje się wniosków rozwojowych.' : 'Zakres wiedzy i umiejętności do rozwinięcia, formy rozwoju.'}
            />
          )}
        </Field>
        <StageError error={patch.error} />
      </section>

      <FormalCheck detail={detail} criteria={criteria} fields={{ justification: 'just1', iprz: 'dev1', conditions: 'exam1' }} label="Zatwierdź pierwszą ocenę i podpisz" />
    </StageLayout>
  )
}
