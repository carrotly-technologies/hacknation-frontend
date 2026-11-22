import { useState, type FormEvent } from 'react'
import { DeadlineText } from '../../components/Deadline'
import { Button, Checkbox, ErrorSummary, Field, InlineAlert, TextInput, type FormError } from '../../components/ui'
import { useCaseAction, usePatchCase } from '../../lib/caseQueries'
import { addDaysIso, fmtDate } from '../../lib/format'
import type { StageProps } from '../CasePage'
import { BlockedReason, MutationError, StageHeader } from './common'
import { allows } from '../../lib/stages'
import { StageError, StageLayout } from './StageLayout'
import t from './CompetencyScores.module.css'
import s from './FirstPrepStages.module.css'

/** Topics of the introductory talk, §3 rozp. PRM z 23.07.2015 (first assessment). */
const INTRO_ITEMS = [
  'Zapoznanie z trybem pierwszej oceny i jej elementami (rzetelność, wykorzystywanie wiedzy, organizacja pracy, komunikacja, współpraca)',
  'Omówienie głównych obowiązków wynikających z opisu stanowiska pracy',
  'Oczekiwania co do postawy, zaangażowania, postępów, relacji ze współpracownikami i terminowości',
  'Wyznaczenie terminu na złożenie sprawozdania (po upływie 8 miesięcy od nawiązania stosunku pracy)',
]

const FORM_ID = 'intro-talk-form'
const CONFIRM_ID = 'intro-talk-confirm'
const DUE_ID = 'intro-talk-report-due'

/**
 * Step 1 of the first assessment, "Rozmowa wstępna": the §3 topics as a plain table, one confirmation that all of
 * them were discussed, and the report due date (not earlier than 8 months after hiring, §4 ust. 1 rozp. 2015).
 */
export function IntroTalkStage({ detail, stage }: StageProps) {
  const info = detail.stages.find((x) => x.id === stage)!
  const done = info.status === 'DONE'
  const act = useCaseAction(detail.id)
  const patch = usePatchCase(detail.id)
  const minReport = addDaysIso(detail.person.hiredOn, 243)
  const [due, setDue] = useState(detail.firstConditions?.reportDue ?? minReport)
  const [confirmed, setConfirmed] = useState(done)
  const [errors, setErrors] = useState<FormError[]>([])
  const errorFor = (id: string) => errors.find((e) => e.id === id)?.message
  const clearError = (id: string) => setErrors((v) => (v.some((e) => e.id === id) ? v.filter((e) => e.id !== id) : v))

  const validate = (): FormError[] => {
    const e: FormError[] = []
    if (!confirmed) e.push({ id: CONFIRM_ID, message: 'Potwierdź, że omówiono z ocenianym wszystkie zagadnienia z §3 rozporządzenia' })
    if (!due) e.push({ id: DUE_ID, message: 'Wpisz termin złożenia sprawozdania' })
    else if (due < minReport) e.push({ id: DUE_ID, message: `Termin złożenia sprawozdania nie może być wcześniejszy niż ${fmtDate(minReport)}` })
    return e
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (e.length) return
    try {
      await patch.mutateAsync({ firstConditions: { reportDue: due } })
      await act.mutateAsync('COMPLETE_INTRO_TALK')
    } catch {
      // shown by StageError
    }
  }

  return (
    <StageLayout
      info={info}
      status={
        done && (
          <InlineAlert tone="success" title="Rozmowa wstępna zakończona">
            Rozmowa wstępna odbyła się {fmtDate(info.completedOn)}. Termin sprawozdania: {fmtDate(detail.firstConditions?.reportDue)}.
          </InlineAlert>
        )
      }
      actions={
        !done && (
          <Button type="submit" form={FORM_ID} loading={patch.isPending || act.isPending} disabled={!allows(detail, 'COMPLETE_INTRO_TALK')}>
            Zatwierdź rozmowę wstępną
          </Button>
        )
      }
    >
      <form id={FORM_ID} noValidate onSubmit={onSubmit} className={s.form}>
        <ErrorSummary errors={errors} />

        <table className={t.table}>
          <caption className={t.caption}>Zagadnienia rozmowy wstępnej (§3 rozp. PRM z 23.07.2015)</caption>
          <thead>
            <tr>
              <th scope="col" className={s.lp}>
                Lp.
              </th>
              <th scope="col">Zagadnienie do omówienia</th>
            </tr>
          </thead>
          <tbody>
            {INTRO_ITEMS.map((item, i) => (
              <tr key={item}>
                <th scope="row" className={s.lp}>
                  {i + 1}.
                </th>
                <td>{item}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Checkbox
          id={CONFIRM_ID}
          label="Omówiłem(-am) z ocenianym wszystkie zagadnienia z §3 rozporządzenia"
          checked={done || confirmed}
          disabled={done}
          required={!done}
          invalid={!!errorFor(CONFIRM_ID)}
          onChange={(e) => {
            setConfirmed(e.target.checked)
            if (e.target.checked) clearError(CONFIRM_ID)
          }}
        />

        <Field
          id={DUE_ID}
          label="Termin złożenia sprawozdania"
          hint={`Najwcześniej ${fmtDate(minReport)} — 8 miesięcy od zatrudnienia (§4 ust. 1 rozp. 2015).`}
          error={errorFor(DUE_ID)}
        >
          {(p) => (
            <TextInput
              {...p}
              type="date"
              width={20}
              min={minReport}
              value={due}
              readOnly={done}
              onChange={(e) => {
                setDue(e.target.value)
                clearError(DUE_ID)
              }}
            />
          )}
        </Field>

        <StageError error={patch.error ?? act.error} />
      </form>
    </StageLayout>
  )
}

export function ReportStage({ detail, stage }: StageProps) {
  const info = detail.stages.find((s) => s.id === stage)!
  const done = info.status === 'DONE'
  const act = useCaseAction(detail.id)
  const fc = detail.firstConditions
  return (
    <div className="stage">
      <StageHeader
        title={info.name}
        status={
          done && (
            <InlineAlert tone="success" title="Sprawozdanie złożone">
              Pracownik złożył sprawozdanie {fmtDate(fc?.reportSubmittedOn)}.
            </InlineAlert>
          )
        }
      />
      <div className="stage-pad stage-pad--narrow">
        <dl className="dl dl--lg">
          <dt>Zatrudnienie</dt>
          <dd className="num">{fmtDate(detail.person.hiredOn)}</dd>
          <dt>Rozmowa wstępna</dt>
          <dd className="num">{fmtDate(detail.stages.find((s) => s.id === 'INTRO_TALK')?.completedOn)}</dd>
          <dt>Termin sprawozdania</dt>
          <dd>{info.deadline && !done ? <DeadlineText deadline={info.deadline} /> : <span className="num">{fmtDate(fc?.reportDue)}</span>}</dd>
          <dt>Złożono</dt>
          <dd className="num">{fmtDate(fc?.reportSubmittedOn)}</dd>
        </dl>

        <h3 className="h-section block-h">Co zawiera sprawozdanie <span className="legal">§6 rozp. PRM z 23.07.2015</span></h3>
        <ul className="bullets">
          <li>zadania wynikające z opisu stanowiska i inne istotne zadania wykonywane w przepracowanym okresie,</li>
          <li>problemy, które wystąpiły, i sposób ich rozwiązania,</li>
          <li>zdobyte umiejętności i wiedza,</li>
          <li>wnioski usprawniające pracę.</li>
        </ul>

        <div className="notice notice--info" style={{ marginTop: 16 }}>
          <div>
            Rozmowę oceniającą przeprowadza się <strong>niezwłocznie</strong> po złożeniu sprawozdania albo po upływie terminu na jego złożenie (§7 pkt 1 rozp. 2015). Przy usprawiedliwionej nieobecności możesz przedłużyć termin — pisemnie, z kopią do arkusza (§5).
          </div>
        </div>

        {done ? (
          <MutationError error={act.error} />
        ) : (
          <div className="confirm-box">
            <div className="btn-row">
              <button type="button" className="btn btn--primary" disabled={act.isPending || !allows(detail, 'REPORT_SUBMITTED')} onClick={() => act.mutate('REPORT_SUBMITTED')}>
                Pracownik złożył sprawozdanie
              </button>
              <button type="button" className="btn" disabled={act.isPending || !allows(detail, 'START_ASSESSMENT')} onClick={() => act.mutate('START_ASSESSMENT')}>
                Termin minął — przejdź do oceny
              </button>
            </div>
            <BlockedReason>
              W wersji demonstracyjnej datą złożenia będzie dzisiejsza data (docelowo sprawozdanie wpłynie przez EZD).
              {!allows(detail, 'START_ASSESSMENT') && ' Ocenę bez sprawozdania można rozpocząć dopiero po upływie wyznaczonego terminu.'}
            </BlockedReason>
            <MutationError error={act.error} />
          </div>
        )}
      </div>
    </div>
  )
}
