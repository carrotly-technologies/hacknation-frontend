import { Check } from 'lucide-react'
import { useState } from 'react'
import { DeadlineText } from '../../components/Deadline'
import { InlineAlert } from '../../components/ui'
import { useCaseAction, usePatchCase } from '../../lib/caseQueries'
import { addDaysIso, fmtDate } from '../../lib/format'
import type { StageProps } from '../CasePage'
import { BlockedReason, MutationError, StageHeader } from './common'
import { allows } from '../../lib/stages'

const INTRO_ITEMS = [
  'Zapoznanie z trybem pierwszej oceny i jej elementami (rzetelność, wykorzystywanie wiedzy, organizacja pracy, komunikacja, współpraca)',
  'Omówienie głównych obowiązków wynikających z opisu stanowiska pracy',
  'Oczekiwania co do postawy, zaangażowania, postępów, relacji ze współpracownikami i terminowości',
  'Wyznaczenie terminu na złożenie sprawozdania (po upływie 8 miesięcy od nawiązania stosunku pracy)',
]

export function IntroTalkStage({ detail, stage }: StageProps) {
  const info = detail.stages.find((s) => s.id === stage)!
  const done = info.status === 'DONE'
  const act = useCaseAction(detail.id)
  const patch = usePatchCase(detail.id)
  const [checked, setChecked] = useState<boolean[]>(INTRO_ITEMS.map(() => done))
  const minReport = addDaysIso(detail.person.hiredOn, 243)
  const [due, setDue] = useState(detail.firstConditions?.reportDue ?? minReport)
  const missing = checked.filter((c) => !c).length

  const complete = async () => {
    await patch.mutateAsync({ firstConditions: { reportDue: due } })
    act.mutate('COMPLETE_INTRO_TALK')
  }

  return (
    <div className="stage">
      <StageHeader
        title={info.name}
        status={
          done && (
            <InlineAlert tone="success" title="Rozmowa wstępna zakończona">
              Rozmowa wstępna odbyła się {fmtDate(info.completedOn)}. Termin sprawozdania: {fmtDate(detail.firstConditions?.reportDue)}.
            </InlineAlert>
          )
        }
      />
      <div className="stage-pad stage-pad--narrow">
        <ol className="topics">
          {INTRO_ITEMS.map((t, i) => (
            <li key={t} className={`topic ${checked[i] ? 'is-done' : ''}`}>
              <span className="topic__mark" aria-hidden="true">{checked[i] ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
              <label className="topic__check">
                <input type="checkbox" className="checkbox" checked={checked[i]} disabled={done} onChange={(e) => setChecked((s) => s.map((v, j) => (j === i ? e.target.checked : v)))} />
                {t}
              </label>
            </li>
          ))}
        </ol>
        <h3 className="h-section block-h">Termin złożenia sprawozdania</h3>
        <div className="due-row">
          <input type="date" className="input" style={{ width: 180 }} min={minReport} value={due} readOnly={done} onChange={(e) => setDue(e.target.value)} aria-label="Termin sprawozdania" />
          <span className="faint small">Najwcześniej {fmtDate(minReport)} (8 miesięcy od zatrudnienia), tak by ocena zmieściła się w oknie z art. 38 ust. 1 ustawy. §4 ust. 1 rozp. 2015.</span>
        </div>
        {done ? (
          <MutationError error={act.error ?? patch.error} />
        ) : (
          <div className="confirm-box">
            <button type="button" className="btn btn--primary" disabled={missing > 0 || act.isPending || !allows(detail, 'COMPLETE_INTRO_TALK')} onClick={complete}>
              Zatwierdź rozmowę wstępną
            </button>
            {missing > 0 && <BlockedReason>Zaznacz wszystkie zagadnienia ({missing} pozostało) — każde z nich wymaga §3 rozp. 2015.</BlockedReason>}
            <MutationError error={act.error ?? patch.error} />
          </div>
        )}
      </div>
    </div>
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
