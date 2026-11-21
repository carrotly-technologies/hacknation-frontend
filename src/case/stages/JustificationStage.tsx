import { Link } from 'react-router'
import { Field, InlineAlert, TextArea } from '../../components/ui'
import { usePatchCase } from '../../lib/caseQueries'
import { fmtDate } from '../../lib/format'
import { competencyName } from '../../lib/model'
import { liveResult } from '../../lib/result'
import { caseUrl } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import s from './AssessmentTalkStage.module.css'
import { CompetencyScoresTable, ResultSummary } from './CompetencyScores'
import { FormalCheck } from './FormalCheck'
import { SignAssessment } from './SignAssessment'
import { StageError, StageLayout } from './StageLayout'
import layout from './StageLayout.module.css'
import { useDraft } from './useDraft'

const ATTACHED_LABEL = { YES: 'TAK', NO: 'NIE', NOT_APPLICABLE: 'NIE DOTYCZY' } as const

/**
 * Step 6, "Weryfikacja formularza" (Poradnik „Oceny okresowe w służbie cywilnej”, Tabela nr 1, etap IV: sporządzenie
 * oceny na piśmie; §11 rozp. PRM z 4.04.2016, ust. 2: „bierze pod uwagę wnioski z rozmowy oceniającej”). After the
 * talk the evaluator reviews the sheet (read only here, "Popraw" leads to the form), completes the justification and
 * IPRZ (the same fields as part II), checks the formal list and signs.
 */
export function JustificationStage({ detail, model, criteria, stage }: StageProps) {
  const info = detail.stages.find((x) => x.id === stage)!
  const patch = usePatchCase(detail.id)
  const signed = detail.signedByEvaluatorOn
  const r = liveResult(detail, criteria.all, model)
  const negative = r.result === 'NEGATIVE'
  const just = useDraft(detail.justification, (v) => patch.mutate({ justification: v }))
  const iprz = useDraft(detail.iprz, (v) => patch.mutate({ iprz: v }))
  const part = (n: number) => `${caseUrl(detail.id, 'OPENING_TALK')}?czesc=${n}`
  const competency = (c: string) => `${caseUrl(detail.id, 'ASSESSMENT')}?k=${encodeURIComponent(c)}`
  const fix = (to: string, what: string) =>
    signed ? null : (
      <Link to={to} aria-label={`Popraw: ${what}`}>
        Popraw
      </Link>
    )
  const attached = detail.promotionRequest.attached
  const prev = detail.previousAssessment

  // Text still being typed is saved before signing, so the signature covers what is on screen.
  const saveBeforeSign = async () => {
    const changes = {
      ...(just.value !== detail.justification ? { justification: just.value } : {}),
      ...(iprz.value !== detail.iprz ? { iprz: iprz.value } : {}),
    }
    if (Object.keys(changes).length) await patch.mutateAsync(changes)
  }

  return (
    <StageLayout
      info={info}
      status={
        signed ? (
          <InlineAlert tone="success" title="Ocena podpisana">
            Ocena podpisana przez oceniającego {fmtDate(signed)}. Pola są tylko do odczytu.
          </InlineAlert>
        ) : detail.assessmentTalkOn ? (
          <InlineAlert tone="success" title={`Rozmowa oceniająca przeprowadzona ${fmtDate(detail.assessmentTalkOn)}`}>
            Sporządzając ocenę, uwzględnij wnioski z rozmowy (§11 ust. 2 rozp. PRM z 4.04.2016). Formularze możesz poprawiać aż do
            podpisu.
          </InlineAlert>
        ) : undefined
      }
    >
      <section aria-labelledby="summary-h" className={s.summary}>
        <h3 id="summary-h" className={s.heading}>Arkusz oceny</h3>
        <p className={layout.muted}>Podsumowanie wypełnionych części. Zmiany wprowadzisz w formularzu po kliknięciu „Popraw”.</p>

        <h4 className={s.subheading}>Część I · Kryteria oceny i termin</h4>
        <div className={s.summaryRow}>
          <div>
            Arkusz {detail.sheetId}; kryteria dodatkowe:{' '}
            <span className={s.summaryValue}>{criteria.additional.map((c) => competencyName(model, c)).join(', ') || 'brak'}</span>; termin oceny:{' '}
            <span className={s.summaryValue}>{fmtDate(detail.partI.assessmentDue)}</span>
          </div>
          <Link to={part(1)} aria-label="Zobacz część I arkusza">
            Zobacz
          </Link>
        </div>
        <p className={layout.muted}>Część I jest zatwierdzona, więc nie można jej już zmienić.</p>

        <h4 className={s.subheading}>Część II · Ocena okresowa</h4>
        <CompetencyScoresTable
          detail={detail}
          model={model}
          criteria={criteria.all}
          caption="Oceny cząstkowe w części II arkusza"
          extra={
            signed
              ? []
              : [{ header: 'Działanie', hiddenHeader: true, cell: (c) => fix(competency(c), `ocena cząstkowa kryterium ${competencyName(model, c)}`) }]
          }
        />
        <ResultSummary result={r} />
        <div className={s.summaryRow}>
          <div>
            Data przeprowadzenia rozmowy oceniającej: <span className={s.summaryValue}>{fmtDate(detail.assessmentTalkOn) || '—'}</span>
            {detail.person.employment === 'URZEDNIK' && (
              <>
                ; poprzednia ocena:{' '}
                <span className={s.summaryValue}>
                  {prev?.result
                    ? `${prev.result === 'POSITIVE' ? 'pozytywna' : 'negatywna'}${prev.level ? `, ${prev.level}` : ''}${prev.date ? `, ${fmtDate(prev.date)}` : ''}`
                    : 'nie wpisano'}
                </span>
              </>
            )}
          </div>
          {fix(part(2), 'część II arkusza')}
        </div>

        <h4 className={s.subheading}>Część III · Wniosek o kolejny stopień służbowy</h4>
        <div className={s.summaryRow}>
          <div>
            Dołączono wniosek: <span className={s.summaryValue}>{attached ? ATTACHED_LABEL[attached] : 'nie zaznaczono'}</span>
          </div>
          {fix(attached === 'YES' ? part(3) : part(2), 'wniosek o kolejny stopień służbowy')}
        </div>
      </section>

      <section aria-labelledby="writing-h" className={s.section}>
        <h3 id="writing-h" className={s.heading}>Uzasadnienie i plan rozwoju</h3>
        <Field
          id="justification"
          label="Uzasadnienie przyznanej oceny okresowej"
          optional={!negative}
          hint="Obowiązkowe przy ocenie negatywnej. Odnieś się do kryteriów po nazwie i do przyznanego poziomu (§11 ust. 3–4 rozp. PRM z 4.04.2016)."
        >
          {(p) => <TextArea {...p} rows={6} readOnly={!!signed} value={just.value} onChange={(e) => just.change(e.target.value)} onBlur={just.flush} />}
        </Field>
        <Field
          id="iprz"
          label="Wnioski dotyczące indywidualnego programu rozwoju zawodowego"
          hint="Obszar, forma rozwoju, termin lub sposób monitorowania, oczekiwany efekt (art. 108 ustawy o służbie cywilnej)."
        >
          {(p) => <TextArea {...p} rows={5} readOnly={!!signed} value={iprz.value} onChange={(e) => iprz.change(e.target.value)} onBlur={iprz.flush} />}
        </Field>
        <p className="save-state faint small" aria-live="polite">
          {patch.isPending ? 'Zapisywanie…' : patch.isSuccess ? 'Zapisano' : ' '}
        </p>
        <StageError error={patch.error} />
      </section>

      <FormalCheck detail={detail} criteria={criteria} fields={{ justification: 'justification', iprz: 'iprz' }} />

      <section aria-labelledby="sign-h" className={s.section}>
        <h3 id="sign-h" className={s.heading}>Podpis oceniającego</h3>
        <SignAssessment detail={detail} beforeSign={saveBeforeSign} />
      </section>
    </StageLayout>
  )
}
