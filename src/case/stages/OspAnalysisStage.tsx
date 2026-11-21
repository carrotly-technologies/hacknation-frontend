import { useState } from 'react'
import type { SheetId } from '../../api/kompas'
import { useCaseAction, usePatchCase } from '../../lib/caseQueries'
import { competencyName, useSheets } from '../../lib/model'
import type { StageProps } from '../CasePage'
import { BlockedReason, MutationError, StageHeader } from './common'
import { allows } from '../../lib/stages'

type Verdict = 'ACCEPTED' | 'REJECTED'

const SUBORDINATE_OPTIONS = [
  'brak podległych pracowników',
  'bezpośrednio kieruje lub koordynuje pracę do 4 pracowników',
  'bezpośrednio kieruje lub koordynuje pracę od 5 do 9 pracowników',
  'bezpośrednio kieruje lub koordynuje pracę powyżej 9 pracowników',
  'bezpośrednio podlegają osoby kierujące pracą innych pracowników',
]

export function OspAnalysisStage({ detail, model, stage }: StageProps) {
  const info = detail.stages.find((s) => s.id === stage)!
  const sheets = useSheets()
  const patch = usePatchCase(detail.id)
  const act = useCaseAction(detail.id)
  const done = info.status === 'DONE'
  const osp = detail.osp
  const analysis = detail.ospAnalysis
  const [sheetId, setSheetId] = useState<SheetId>(detail.sheetId ?? analysis?.suggestedSheet?.sheetId ?? 'C')
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>(() =>
    Object.fromEntries(detail.partI.additionalCriteria.map((c) => [c, 'ACCEPTED' as Verdict])),
  )
  const [extra, setExtra] = useState<string[]>(() =>
    detail.partI.additionalCriteria.filter((c) => !analysis?.additionalCandidates.some((x) => x.criterionId === c)),
  )
  const [hover, setHover] = useState<string | null>(null)

  const mandatory = sheets.data?.find((s) => s.id === sheetId)?.mandatoryCriteria ?? []
  const candidates = (analysis?.additionalCandidates ?? []).filter((c) => !mandatory.includes(c.criterionId))
  const accepted = [...candidates.filter((c) => verdicts[c.criterionId] === 'ACCEPTED').map((c) => c.criterionId), ...extra.filter((c) => !mandatory.includes(c))]
  const pending = candidates.filter((c) => !verdicts[c.criterionId]).length
  const catalog = model.competencies.map((c) => c.id).filter((id) => !mandatory.includes(id) && !accepted.includes(id))
  const full = accepted.length >= 3

  const setVerdict = (id: string, v: Verdict) =>
    setVerdicts((s) => {
      const next = { ...s }
      if (next[id] === v) delete next[id]
      else next[id] = v
      return next
    })

  const submit = async () => {
    await patch.mutateAsync({ sheetId, partI: { additionalCriteria: accepted } })
    act.mutate('ACCEPT_OSP_ANALYSIS')
  }

  if (!osp) {
    return (
      <div className="stage">
        <StageHeader title={info.name} legal={info.legalBasis} />
        <p className="stage-pad muted">Do teczki nie dołączono opisu stanowiska pracy.</p>
      </div>
    )
  }

  const hl = (id: string) => (hover === id ? 'is-hl' : '')

  return (
    <div className="stage">
      <StageHeader
        title={info.name}
        legal={info.legalBasis}
        deadline={done ? null : info.deadline}
        lead="Przygotowanie przed rozmową rozpoczynającą, bez udziału pracownika. System czyta opis stanowiska i proponuje arkusz oraz kryteria dodatkowe — decyzję zatwierdzasz Ty."
      />
      <div className="osp-split">
        <article className="osp-doc" aria-label="Opis stanowiska pracy">
          <p className="osp-doc__kicker">Opis stanowiska pracy · {osp.source}</p>
          <h3 className="osp-doc__title">{osp.title}</h3>

          <h4 className="osp-doc__h">Cel istnienia stanowiska pracy</h4>
          <p>{osp.purpose}</p>

          <h4 className="osp-doc__h">Liczba podległych pracowników</h4>
          <ul className="osp-doc__checks">
            {SUBORDINATE_OPTIONS.map((o) => {
              const on = o === osp.subordinates
              return (
                <li key={o} className={on ? `is-on mark ${hl('sheet')}` : ''}>
                  <span className="osp-doc__box" aria-hidden="true">{on ? '☒' : '☐'}</span> {o}
                  {on && <span className="visually-hidden"> (zaznaczone)</span>}
                </li>
              )
            })}
          </ul>

          <h4 className="osp-doc__h">Główne zadania realizowane na stanowisku pracy</h4>
          <ol className="osp-doc__tasks">
            {osp.mainTasks.map((t, i) => (
              <li key={i} className={i < 3 ? `${hover === 'tasks' ? 'is-hl' : ''}` : ''}>
                <span className="num faint">Zadanie {i + 1}.</span> {t}
              </li>
            ))}
          </ol>

          <h4 className="osp-doc__h">Inne kompetencje, wiedza lub umiejętności</h4>
          <ul className="osp-doc__list">
            {osp.softCompetencies.map((c) => (
              <li key={c} className={candidates.some((x) => x.criterionId === c) ? `mark ${hl(c)}` : ''}>
                {competencyName(model, c).toLowerCase()}
                {mandatory.includes(c) && <span className="faint small"> — obowiązkowe w arkuszu {sheetId}</span>}
              </li>
            ))}
            {osp.otherRequirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </article>

        <section className="conclusions" aria-label="Wnioski dla oceny">
          <h3 className="h-section">Wnioski dla oceny</h3>
          <p className="faint small">Propozycja systemu wyliczona z OSP — do Twojego zatwierdzenia.</p>

          <div className="concl" onMouseEnter={() => setHover('sheet')} onMouseLeave={() => setHover(null)}>
            <div className="concl__head">
              <span className="concl__num">a</span>
              <h4 className="concl__title">Arkusz oceny</h4>
              <select className="select concl__select" value={sheetId} disabled={done} onChange={(e) => setSheetId(e.target.value as SheetId)} aria-label="Arkusz">
                {['A', 'B', 'C'].map((s) => (
                  <option key={s} value={s}>Arkusz {s}</option>
                ))}
              </select>
            </div>
            {analysis?.suggestedSheet && (
              <p className="concl__body">
                <strong>Arkusz {analysis.suggestedSheet.sheetId}</strong>, bo: {analysis.suggestedSheet.reason}{' '}
                <span className="legal">{analysis.suggestedSheet.legalBasis}</span>
              </p>
            )}
            {analysis?.suggestedSheet && sheetId !== analysis.suggestedSheet.sheetId && (
              <p className="notice notice--warn" style={{ marginTop: 8 }}>Wybrano arkusz inny niż wynika z OSP. Upewnij się, że opis stanowiska jest aktualny.</p>
            )}
            <p className="concl__body faint small">Kryteria obowiązkowe: {mandatory.map((c) => competencyName(model, c)).join(', ') || '—'}.</p>
          </div>

          <div className="concl">
            <div className="concl__head">
              <span className="concl__num">b</span>
              <h4 className="concl__title">Kryteria dodatkowe</h4>
              <span className={`tag ${full ? 'tag--accent' : ''} num`}>{accepted.length}/3</span>
            </div>
            <p className="concl__body faint small">Najwyżej 3, najistotniejsze ze względu na obowiązki z OSP. Można nie wybrać żadnego. §2 ust. 2, §5 ust. 2 rozp. 2016.</p>
            {candidates.length === 0 && <p className="concl__body muted">OSP nie wskazuje kompetencji spoza kryteriów obowiązkowych.</p>}
            <ul className="cands">
              {candidates.map((c) => {
                const v = verdicts[c.criterionId]
                return (
                  <li key={c.criterionId} className={`cand cand--${(v ?? 'pending').toLowerCase()}`} onMouseEnter={() => setHover(c.criterionId)} onMouseLeave={() => setHover(null)}>
                    <div className="cand__main">
                      <span className="cand__name" title={competencyName(model, c.criterionId)}>{competencyName(model, c.criterionId)}</span>
                      <span className="cand__reason">{c.reason}</span>
                      <span className="cand__quote">„{c.ospQuote}”</span>
                    </div>
                    <div className="cand__actions" role="group" aria-label={`Decyzja: ${competencyName(model, c.criterionId)}`}>
                      <button type="button" className={`btn btn--sm ${v === 'ACCEPTED' ? 'btn--primary' : ''}`} aria-pressed={v === 'ACCEPTED'} disabled={done || (full && v !== 'ACCEPTED')} onClick={() => setVerdict(c.criterionId, 'ACCEPTED')}>
                        Przyjmij
                      </button>
                      <button type="button" className={`btn btn--sm ${v === 'REJECTED' ? 'btn--pressed' : ''}`} aria-pressed={v === 'REJECTED'} disabled={done} onClick={() => setVerdict(c.criterionId, 'REJECTED')}>
                        Odrzuć
                      </button>
                    </div>
                  </li>
                )
              })}
              {extra.filter((c) => !mandatory.includes(c)).map((c) => (
                <li key={c} className="cand cand--accepted">
                  <div className="cand__main">
                    <span className="cand__name" title={competencyName(model, c)}>{competencyName(model, c)}</span>
                    <span className="cand__reason">Dodane przez oceniającego spoza propozycji.</span>
                  </div>
                  {!done && (
                    <button type="button" className="btn btn--sm btn--ghost" onClick={() => setExtra((s) => s.filter((x) => x !== c))}>
                      Usuń
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {!done && (
              <div className="concl__add">
                <select
                  className="select"
                  value=""
                  disabled={full}
                  aria-label="Dodaj kryterium z katalogu"
                  onChange={(e) => e.target.value && setExtra((s) => [...s, e.target.value])}
                >
                  <option value="">{full ? 'Wybrano już 3 kryteria dodatkowe' : 'Dodaj inne kryterium z katalogu…'}</option>
                  {catalog.map((id) => (
                    <option key={id} value={id}>{competencyName(model, id)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="concl" onMouseEnter={() => setHover('tasks')} onMouseLeave={() => setHover(null)}>
            <div className="concl__head">
              <span className="concl__num">c</span>
              <h4 className="concl__title">Do omówienia na rozmowie rozpoczynającej</h4>
            </div>
            <ul className="concl__tasks">
              {osp.mainTasks.slice(0, 3).map((t, i) => (
                <li key={i}>{t.split(/ w celu /)[0].replace(/\.$/, '')}</li>
              ))}
            </ul>
          </div>

          <div className="concl__submit">
            {done ? (
              <p className="notice notice--ok">Analiza zatwierdzona. Arkusz {detail.sheetId}, kryteria dodatkowe: {detail.partI.additionalCriteria.map((c) => competencyName(model, c)).join(', ') || 'brak'}.</p>
            ) : (
              <>
                <button type="button" className="btn btn--primary" disabled={pending > 0 || patch.isPending || act.isPending || !allows(detail, 'ACCEPT_OSP_ANALYSIS')} onClick={submit}>
                  Zatwierdź analizę i przejdź do rozmowy
                </button>
                {pending > 0 && <BlockedReason>Przyjmij lub odrzuć każdą propozycję kryterium dodatkowego ({pending} bez decyzji).</BlockedReason>}
              </>
            )}
            <MutationError error={patch.error ?? act.error} />
          </div>
        </section>
      </div>
    </div>
  )
}
