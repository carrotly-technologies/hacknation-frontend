import type { ReactNode } from 'react'
import type { CaseDetail } from '../api/cases'
import type { CompetencyModel } from '../api/kompas'
import { fmtAvg, fmtDate } from '../lib/format'
import { competencyName, type CaseCriteria } from '../lib/model'
import { officePlace } from '../lib/office'
import { BANDS } from '../lib/scale'

const X = ({ on }: { on: boolean }) => <span className="doc-x">{on ? 'X' : ''}</span>
const Blank = ({ hint }: { hint?: string }) => <span className="doc-blank">{hint ? `(${hint})` : ''}</span>
const Val = ({ v, hint }: { v: ReactNode; hint?: string }) => (v ? <span className="doc-val">{v}</span> : <Blank hint={hint} />)

function Signatures({ cells }: { cells: { value?: ReactNode; caption: string }[] }) {
  return (
    <div className="doc-sigs" style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
      {cells.map((c, i) => (
        <div key={i} className="doc-sig">
          <span className="doc-sig__value">{c.value ?? ''}</span>
          <span className="doc-sig__line">{c.caption}</span>
        </div>
      ))}
    </div>
  )
}

const ESIGN = '/podpisano elektronicznie/'

export function SheetDocument({ detail, model, criteria }: { detail: CaseDetail; model: CompetencyModel; criteria: CaseCriteria }) {
  return detail.path === 'FIRST' ? (
    <FirstSheet detail={detail} model={model} criteria={criteria} />
  ) : (
    <PeriodicSheet detail={detail} model={model} criteria={criteria} />
  )
}

function PeriodicSheet({ detail, model, criteria }: { detail: CaseDetail; model: CompetencyModel; criteria: CaseCriteria }) {
  const p = detail.person
  const e = detail.evaluator
  const sheet = detail.sheetId ?? 'C'
  // Annex, title and the fixed wording come from the sheet template in the API (GET /api/sheets).
  const t = criteria.sheet?.template
  const ev = detail.evaluation
  const extra = criteria.additional
  const place = officePlace()
  const scaleCols = criteria.scale
  const scaleHead = scaleCols.map((p) => model.scale.find((x) => x.points === p)?.label ?? '')
  const prev = detail.previousAssessment
  const request = detail.promotionRequest
  const partIII = request.attached === 'YES'
  const ptsWord = (n: number) => (n === 1 ? 'punkt' : n === 3 ? 'punkty' : 'punktów')
  const conversationDate = detail.stages.find((s) => s.id === 'ASSESSMENT')?.completedOn ?? null
  const periodTo = detail.signedByEvaluatorOn ?? null
  const urzednik = p.employment === 'URZEDNIK'

  const scoreRow = (c: string) => (
    <tr key={c}>
      <td>{competencyName(model, c)}</td>
      {scaleCols.map((s) => (
        <td key={s} className="doc-c">
          <X on={detail.decisions[c] === s} />
        </td>
      ))}
    </tr>
  )

  return (
    <article className="doc" lang="pl">
      <div className="doc-page">
        <div className="doc-annex">
          <span>{t?.annex}</span>
        </div>
        <h1 className="doc-title">
          <span className="doc-title__sheet">ARKUSZ {sheet}</span>
          <span className="doc-title__main">{t?.title}</span>
        </h1>

        <h2 className="doc-part">C Z Ę Ś Ć&nbsp;&nbsp;&nbsp;I</h2>
        <table className="doc-table">
          <tbody>
            <tr>
              <th className="doc-th-label">NAZWA URZĘDU</th>
              <td>{detail.officeName}</td>
            </tr>
            <tr>
              <th colSpan={2} className="doc-th-group">DANE OCENIANEGO</th>
            </tr>
            <tr><td className="doc-label">Imię</td><td>{p.firstName}</td></tr>
            <tr><td className="doc-label">Nazwisko</td><td>{p.lastName}</td></tr>
            <tr><td className="doc-label">Komórka organizacyjna</td><td>{p.unit}</td></tr>
            <tr><td className="doc-label">Stanowisko pracy</td><td>{p.position}</td></tr>
            <tr>
              <th colSpan={2} className="doc-th-group">DANE OCENIAJĄCEGO</th>
            </tr>
            <tr><td className="doc-label">Imię</td><td>{e.firstName}</td></tr>
            <tr><td className="doc-label">Nazwisko</td><td>{e.lastName}</td></tr>
            <tr><td className="doc-label">Komórka organizacyjna</td><td>{e.unit}</td></tr>
            <tr><td className="doc-label">Stanowisko pracy</td><td>{e.position}</td></tr>
          </tbody>
        </table>

        <table className="doc-table doc-table--crit">
          <thead>
            <tr>
              <th colSpan={3} className="doc-th-group">KRYTERIA OCENY I TERMIN SPORZĄDZENIA OCENY</th>
            </tr>
            <tr>
              <th className="doc-th-center">Kryteria obowiązkowe</th>
              <th colSpan={2} className="doc-th-center">
                Kryteria dodatkowe wybrane przez oceniającego <br />
                <i>(nie więcej niż 3)</i>
              </th>
            </tr>
          </thead>
          <tbody>
            {criteria.mandatory.map((c, i) => (
              <tr key={c}>
                <td>{competencyName(model, c)}</td>
                {i < 3 ? (
                  <td colSpan={2}>{extra[i] ? competencyName(model, extra[i]) : ''}</td>
                ) : i === 3 ? (
                  <>
                    <td rowSpan={criteria.mandatory.length - 3} className="doc-label">Termin sporządzenia oceny</td>
                    <td rowSpan={criteria.mandatory.length - 3} className="doc-c">
                      <Val v={fmtDate(detail.partI.assessmentDue)} hint="dd.mm.rrrr" />
                    </td>
                  </>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="doc-box">
          <p>
            <i>Potwierdzamy:</i>
          </p>
          {t?.partIConfirmation.map((line) => <p key={line}>– {line}</p>)}
          <Signatures
            cells={[
              { value: detail.partI.confirmedByEvaluatorOn ? place : '', caption: 'miejscowość' },
              { value: fmtDate(detail.partI.confirmedByEvaluatorOn).replace('—', ''), caption: 'data (dd.mm.rrrr)' },
              { value: detail.partI.confirmedByEvaluatorOn ? ESIGN : '', caption: 'podpis oceniającego' },
            ]}
          />
          <Signatures
            cells={[
              { value: detail.partI.acknowledgedByEmployeeOn ? place : '', caption: 'miejscowość' },
              { value: fmtDate(detail.partI.acknowledgedByEmployeeOn).replace('—', ''), caption: 'data (dd.mm.rrrr)' },
              { value: detail.partI.acknowledgedByEmployeeOn ? ESIGN : '', caption: 'podpis ocenianego' },
            ]}
          />
        </div>
      </div>

      <div className="doc-page">
        <h2 className="doc-part">C Z Ę Ś Ć&nbsp;&nbsp;&nbsp;I I</h2>
        <table className="doc-table">
          <tbody>
            <tr>
              <th className="doc-th-label">DATA PRZEPROWADZENIA ROZMOWY OCENIAJĄCEJ</th>
              <td colSpan={2}><Val v={conversationDate ? fmtDate(conversationDate) : ''} hint="dd.mm.rrrr" /></td>
            </tr>
            <tr>
              <th className="doc-th-label">OKRES, W KTÓRYM OCENIANY PODLEGAŁ OCENIE</th>
              <td>OD: <Val v={detail.partI.acknowledgedByEmployeeOn ? fmtDate(detail.partI.acknowledgedByEmployeeOn) : ''} hint="dd.mm.rrrr" /></td>
              <td>DO: <Val v={periodTo ? fmtDate(periodTo) : ''} hint="dd.mm.rrrr" /></td>
            </tr>
          </tbody>
        </table>

        <table className="doc-table doc-table--scores">
          <colgroup>
            <col />
            {scaleCols.map((s) => <col key={s} className="doc-col-score" />)}
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={3} className="doc-th-left">KRYTERIA OBOWIĄZKOWE</th>
              <th colSpan={5} className="doc-th-center">OCENA CZĄSTKOWA</th>
            </tr>
            <tr>
              {scaleHead.map((h) => <th key={h} className="doc-th-small">{h}</th>)}
            </tr>
            <tr>
              {scaleCols.map((s) => <th key={s} className="doc-th-small">{s}<br />{ptsWord(s)}</th>)}
            </tr>
          </thead>
          <tbody>
            {criteria.mandatory.map(scoreRow)}
            <tr>
              <th className="doc-th-left">KRYTERIA DODATKOWE WYBRANE PRZEZ OCENIAJĄCEGO</th>
              <th colSpan={5} className="doc-th-center">OCENA CZĄSTKOWA</th>
            </tr>
            {extra.length ? extra.map(scoreRow) : (
              <tr><td className="doc-muted">brak</td>{scaleCols.map((s) => <td key={s} />)}</tr>
            )}
          </tbody>
        </table>
        <p className="doc-line">
          Średnia arytmetyczna z ocen cząstkowych przyznanych za poszczególne kryteria oceny: <strong className="doc-val">{ev ? ev.averageDisplay : ''}</strong>
        </p>

        <table className="doc-table doc-table--award">
          <thead>
            <tr><th colSpan={3} className="doc-th-group">PRZYZNANIE OCENY</th></tr>
            <tr>
              <th className="doc-th-small">Należy wstawić znak „X” w odpowiednie pole</th>
              <th className="doc-th-small">Liczba punktów stanowiąca średnią arytmetyczną ze wszystkich ocen cząstkowych</th>
              <th className="doc-th-small">Ogólny poziom spełniania kryteriów oceny</th>
            </tr>
          </thead>
          <tbody>
            {BANDS.map((b, i) => (
              <tr key={b.label}>
                <td className="doc-c"><X on={!!ev && ev.level?.label === b.label} /></td>
                <td className="doc-c">{i === 0 ? 'od 1 punktu do 2 punktów' : `powyżej ${b.min} punktów do ${b.max} punktów`}</td>
                <td className="doc-c">{b.label.toLowerCase()}</td>
              </tr>
            ))}
            <tr>
              <th className="doc-th-label">OCENA OKRESOWA W SŁUŻBIE CYWILNEJ</th>
              <td>POZYTYWNA <span className="doc-check"><X on={ev?.result === 'POSITIVE'} /></span></td>
              <td>NEGATYWNA <span className="doc-check"><X on={ev?.result === 'NEGATIVE'} /></span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="doc-page">
        <h3 className="doc-h">UZASADNIENIE PRZYZNANEJ OCENY OKRESOWEJ</h3>
        <div className="doc-text">{detail.justification || <Blank />}</div>
        <h3 className="doc-h">WNIOSKI DOTYCZĄCE INDYWIDUALNEGO PROGRAMU ROZWOJU ZAWODOWEGO</h3>
        <div className="doc-text">{detail.iprz || <Blank />}</div>

        <table className="doc-table">
          <tbody>
            <tr><th colSpan={6} className="doc-th-group">DANE DOTYCZĄCE POPRZEDNIEJ OCENY OKRESOWEJ URZĘDNIKA SŁUŻBY CYWILNEJ</th></tr>
            <tr>
              <td className="doc-label">Ocena</td>
              <td>{urzednik ? <Val v={prev?.result === 'POSITIVE' ? 'pozytywna' : prev?.result === 'NEGATIVE' ? 'negatywna' : ''} /> : <span className="doc-muted">nie dotyczy</span>}</td>
              <td className="doc-label">Poziom</td>
              <td>{urzednik ? <Val v={prev?.level ?? ''} /> : ''}</td>
              <td className="doc-label">Data sporządzenia</td>
              <td>{urzednik ? <Val v={prev?.date ? fmtDate(prev.date) : ''} hint="dd.mm.rrrr" /> : ''}</td>
            </tr>
            <tr><th colSpan={6} className="doc-th-group">CZY DO OCENY OKRESOWEJ DOŁĄCZONO WNIOSEK O PRZYZNANIE KOLEJNEGO STOPNIA SŁUŻBOWEGO</th></tr>
            <tr>
              <td colSpan={2}>TAK <span className="doc-check"><X on={request.attached === 'YES'} /></span></td>
              <td colSpan={2}>NIE <span className="doc-check"><X on={request.attached === 'NO'} /></span></td>
              <td colSpan={2}>NIE DOTYCZY (oceniany jest pracownikiem służby cywilnej) <span className="doc-check"><X on={request.attached === 'NOT_APPLICABLE'} /></span></td>
            </tr>
            <tr><th colSpan={6} className="doc-th-group">DANE OCENIAJĄCEGO</th></tr>
            <tr><td className="doc-label">Imię</td><td colSpan={5}>{e.firstName}</td></tr>
            <tr><td className="doc-label">Nazwisko</td><td colSpan={5}>{e.lastName}</td></tr>
            <tr><td className="doc-label">Komórka organizacyjna</td><td colSpan={5}>{e.unit}</td></tr>
            <tr><td className="doc-label">Stanowisko pracy</td><td colSpan={5}>{e.position}</td></tr>
          </tbody>
        </table>
        <Signatures
          cells={[
            { value: detail.signedByEvaluatorOn ? place : '', caption: 'miejscowość' },
            { value: fmtDate(detail.signedByEvaluatorOn).replace('—', ''), caption: 'data (dd.mm.rrrr)' },
            { value: detail.signedByEvaluatorOn ? ESIGN : '', caption: 'podpis oceniającego' },
          ]}
        />
        <div className="doc-box">
          <p>
            <i>{t?.employeeAcknowledgement}</i>
          </p>
          <Signatures
            cells={[
              { value: detail.acknowledgedOn ? place : '', caption: 'miejscowość' },
              { value: fmtDate(detail.acknowledgedOn).replace('—', ''), caption: 'data (dd.mm.rrrr)' },
              { value: detail.acknowledgedOn ? `${p.firstName} ${p.lastName}` : '', caption: 'imię i nazwisko lub pieczątka ocenianego' },
              { value: detail.acknowledgedOn ? ESIGN : '', caption: 'podpis ocenianego' },
            ]}
          />
        </div>
        <div className="doc-box doc-box--note">
          <p><i>Pouczenie</i></p>
          <p>{t?.objectionNotice}</p>
          {t?.objectionNoticeNote && <p className="doc-muted">{t.objectionNoticeNote}</p>}
        </div>
      </div>

      {partIII ? (
        <div className="doc-page doc-page--part3">
          <h2 className="doc-part">C Z Ę Ś Ć&nbsp;&nbsp;&nbsp;I I I</h2>
          <p className="doc-center"><i>{t?.partIIIApplicability}</i></p>
          <table className="doc-table">
            <tbody>
              <tr><th colSpan={2} className="doc-th-group">DANE URZĘDNIKA SŁUŻBY CYWILNEJ</th></tr>
              <tr><td className="doc-label">Imię</td><td>{p.firstName}</td></tr>
              <tr><td className="doc-label">Nazwisko</td><td>{p.lastName}</td></tr>
              <tr><td className="doc-label">Rok mianowania</td><td><Val v={request.appointedYear ?? ''} hint="rrrr" /></td></tr>
              <tr><td className="doc-label">Posiadany stopień służbowy</td><td><Val v={request.currentGrade ?? ''} /></td></tr>
              <tr><td className="doc-label">Data przyznania stopnia służbowego</td><td><Val v={request.gradeGrantedOn ? fmtDate(request.gradeGrantedOn) : ''} hint="dd.mm.rrrr" /></td></tr>
            </tbody>
          </table>
          <h3 className="doc-h">WNIOSEK O PRZYZNANIE URZĘDNIKOWI SŁUŻBY CYWILNEJ KOLEJNEGO STOPNIA SŁUŻBOWEGO</h3>
          {t && (
            <p className="doc-line">
              {t.promotionRequest.beforeName} <strong className="doc-val">{p.firstName} {p.lastName}</strong> {t.promotionRequest.afterName}{' '}
              <strong className="doc-val">{request.requestedGrade ?? '……….'}</strong> {t.promotionRequest.afterGrade}
            </p>
          )}
          <h3 className="doc-h">Umotywowanie wniosku</h3>
          <div className="doc-text">{request.motivation || <Blank />}</div>
          <Signatures
            cells={[
              { value: detail.signedByEvaluatorOn ? place : '', caption: 'miejscowość' },
              { value: fmtDate(detail.signedByEvaluatorOn).replace('—', ''), caption: 'data (dd.mm.rrrr)' },
              { value: detail.signedByEvaluatorOn ? `${e.firstName} ${e.lastName}` : '', caption: 'imię i nazwisko lub pieczątka oceniającego' },
              { value: detail.signedByEvaluatorOn ? ESIGN : '', caption: 'podpis oceniającego' },
            ]}
          />
        </div>
      ) : (
        <div className="doc-page doc-page--part3 doc-screen-only">
          <h2 className="doc-part">C Z Ę Ś Ć&nbsp;&nbsp;&nbsp;I I I</h2>
          <p className="doc-muted doc-center">
            Część III nie jest dołączana —{' '}
            {request.attached === 'NOT_APPLICABLE'
              ? 'oceniany jest pracownikiem służby cywilnej'
              : request.attached === 'NO'
                ? 'oceniający nie dołączył wniosku o przyznanie kolejnego stopnia służbowego'
                : 'nie zaznaczono jeszcze, czy do oceny dołączono wniosek o przyznanie kolejnego stopnia służbowego'}
            .
          </p>
          {t && <p className="doc-muted doc-center">{t.partIIINotAttached}</p>}
        </div>
      )}
      <p className="doc-footnote">Wygenerowano w Kompasie Kompetencji na podstawie wzoru z rozporządzenia PRM z 4.04.2016 (Dz.U. poz. 470). Średnia {ev ? fmtAvg(ev.average) : '—'} liczona bez zaokrągleń.</p>
    </article>
  )
}

function FirstSheet({ detail, model, criteria }: { detail: CaseDetail; model: CompetencyModel; criteria: CaseCriteria }) {
  const p = detail.person
  const e = detail.evaluator
  const fc = detail.firstConditions
  const ev = detail.evaluation
  const intro = detail.stages.find((s) => s.id === 'INTRO_TALK')?.completedOn ?? null
  const talk = detail.stages.find((s) => s.id === 'FIRST_ASSESSMENT')?.completedOn ?? null
  const onTime = fc?.reportSubmittedOn && fc.reportDue ? fc.reportSubmittedOn <= fc.reportDue : null
  const place = officePlace()
  return (
    <article className="doc" lang="pl">
      <div className="doc-page">
        <div className="doc-annex">
          <span>Załącznik nr 2</span>
        </div>
        <h1 className="doc-title">
          <span className="doc-title__main">ARKUSZ PIERWSZEJ OCENY</span>
        </h1>
        <table className="doc-table">
          <tbody>
            <tr><th className="doc-th-label">NAZWA URZĘDU</th><td colSpan={3}>{detail.officeName}</td></tr>
            <tr><th colSpan={4} className="doc-th-group">DANE OCENIANEGO</th></tr>
            <tr><td className="doc-label">Imię i nazwisko</td><td colSpan={3}>{p.firstName} {p.lastName}</td></tr>
            <tr><td className="doc-label">Komórka organizacyjna</td><td colSpan={3}>{p.unit}</td></tr>
            <tr><td className="doc-label">Stanowisko</td><td colSpan={3}>{p.position}</td></tr>
            <tr><td className="doc-label">Data nawiązania stosunku pracy</td><td colSpan={3}>{fmtDate(p.hiredOn)}</td></tr>
            <tr><th colSpan={4} className="doc-th-group">DANE BEZPOŚREDNIEGO PRZEŁOŻONEGO</th></tr>
            <tr><td className="doc-label">Imię i nazwisko</td><td colSpan={3}>{e.firstName} {e.lastName}</td></tr>
            <tr><td className="doc-label">Komórka organizacyjna</td><td colSpan={3}>{e.unit}</td></tr>
            <tr><td className="doc-label">Stanowisko</td><td colSpan={3}>{e.position}</td></tr>
            <tr><th colSpan={4} className="doc-th-group">ROZMOWA WSTĘPNA</th></tr>
            <tr><td className="doc-label">Data przeprowadzenia rozmowy wstępnej</td><td colSpan={3}><Val v={intro ? fmtDate(intro) : ''} hint="dd.mm.rrrr" /></td></tr>
            <tr><td className="doc-label">Termin wyznaczony na złożenie sprawozdania</td><td colSpan={3}>do: <Val v={fc?.reportDue ? fmtDate(fc.reportDue) : ''} hint="dd.mm.rrrr" /></td></tr>
          </tbody>
        </table>
      </div>
      <div className="doc-page">
        <table className="doc-table">
          <tbody>
            <tr><th colSpan={4} className="doc-th-group">ROZMOWA OCENIAJĄCA</th></tr>
            <tr><td className="doc-label">Data przeprowadzenia rozmowy oceniającej</td><td colSpan={3}><Val v={talk ? fmtDate(talk) : ''} hint="dd.mm.rrrr" /></td></tr>
          </tbody>
        </table>
        <table className="doc-table doc-table--scores">
          <thead>
            <tr><th rowSpan={2} className="doc-th-left">OCENA POSTAWY I ELEMENTÓW</th><th colSpan={3} className="doc-th-center">OCENA CZĄSTKOWA</th></tr>
            <tr>
              <th className="doc-th-small">poniżej oczekiwań<br />3 punkty</th>
              <th className="doc-th-small">na poziomie oczekiwań<br />5 punktów</th>
              <th className="doc-th-small">powyżej oczekiwań<br />7 punktów</th>
            </tr>
          </thead>
          <tbody>
            {criteria.all.map((c) => (
              <tr key={c}>
                <td>{competencyName(model, c)}</td>
                {[3, 5, 7].map((s) => <td key={s} className="doc-c"><X on={detail.decisions[c] === s} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="doc-line">Ocena łączna (średnia arytmetyczna ocen cząstkowych): <strong className="doc-val">{ev ? ev.averageDisplay : ''}</strong></p>
        <table className="doc-table">
          <tbody>
            <tr>
              <td className="doc-label">Oceniany zaliczył egzamin ze służby przygotowawczej</td>
              <td>TAK <span className="doc-check"><X on={fc?.examPassed === 'YES'} /></span></td>
              <td>NIE <span className="doc-check"><X on={fc?.examPassed === 'NO'} /></span></td>
              <td>NIE DOTYCZY <span className="doc-check"><X on={fc?.examPassed === 'NOT_APPLICABLE'} /></span></td>
            </tr>
            <tr>
              <td className="doc-label">Sprawozdanie złożone w wyznaczonym terminie</td>
              <td>TAK <span className="doc-check"><X on={onTime === true} /></span></td>
              <td colSpan={2}>NIE <span className="doc-check"><X on={onTime === false} /></span></td>
            </tr>
            <tr>
              <th className="doc-th-label">PIERWSZA OCENA</th>
              <td>POZYTYWNA <span className="doc-check"><X on={ev?.result === 'POSITIVE'} /></span></td>
              <td colSpan={2}>NEGATYWNA <span className="doc-check"><X on={ev?.result === 'NEGATIVE'} /></span></td>
            </tr>
          </tbody>
        </table>
        <h3 className="doc-h">UZASADNIENIE</h3>
        <div className="doc-text">{detail.justification || <Blank />}</div>
        <h3 className="doc-h">WNIOSKI DOTYCZĄCE ROZWOJU ZAWODOWEGO</h3>
        <div className="doc-text">{detail.iprz || <Blank />}</div>
        <Signatures
          cells={[
            { value: detail.signedByEvaluatorOn ? place : '', caption: 'miejscowość' },
            { value: fmtDate(detail.signedByEvaluatorOn).replace('—', ''), caption: 'data' },
            { value: detail.signedByEvaluatorOn ? ESIGN : '', caption: 'podpis bezpośredniego przełożonego' },
            { value: '', caption: 'podpis kierującego komórką organizacyjną' },
          ]}
        />
        <div className="doc-box">
          <p><i>Zapoznałam(-łem) się z pierwszą oceną.</i></p>
          <Signatures
            cells={[
              { value: detail.acknowledgedOn ? place : '', caption: 'miejscowość' },
              { value: fmtDate(detail.acknowledgedOn).replace('—', ''), caption: 'data' },
              { value: detail.acknowledgedOn ? ESIGN : '', caption: 'podpis ocenianego' },
            ]}
          />
        </div>
      </div>
      <p className="doc-footnote">Wygenerowano w Kompasie Kompetencji na podstawie wzoru z rozporządzenia PRM z 23.07.2015 (Dz.U. poz. 1144).</p>
    </article>
  )
}
