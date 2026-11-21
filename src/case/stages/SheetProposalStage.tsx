import { useState } from 'react'
import { Button, InlineAlert } from '../../components/ui'
import { useCaseAction } from '../../lib/caseQueries'
import { findCompetency, competencyName } from '../../lib/model'
import { allows } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import { SheetCriteriaEditor } from './SheetCriteriaEditor'
import { StageError, StageLayout } from './StageLayout'
import layout from './StageLayout.module.css'
import s from './SheetProposalStage.module.css'

/**
 * "Wstępny formularz" (design frame 2): the sheet proposed from the job description and its competency
 * questions, read only. "Akceptuj formularz" moves the case on to the opening talk; "Wprowadź zmiany"
 * opens the editor of the sheet and the additional criteria.
 */
export function SheetProposalStage({ detail, model, criteria, stage }: StageProps) {
  const info = detail.stages.find((x) => x.id === stage)!
  const act = useCaseAction(detail.id)
  const [editing, setEditing] = useState(false)
  const done = info.status === 'DONE'
  const canEdit = !done && allows(detail, 'ACCEPT_SHEET')

  return (
    <StageLayout
      info={info}
      lead="System zaproponował formularz na podstawie opisu stanowiska. Przejrzyj pytania kompetencyjne i zaakceptuj formularz albo wprowadź zmiany."
      actions={
        canEdit && !editing ? (
          <>
            <Button variant="text" onClick={() => setEditing(true)}>
              Wprowadź zmiany
            </Button>
            <Button loading={act.isPending} disabled={!detail.sheetId} onClick={() => act.mutate('ACCEPT_SHEET')}>
              Akceptuj formularz
            </Button>
          </>
        ) : null
      }
    >
      <div className={s.title}>
        <p className={layout.kicker}>Proponowany formularz oceny okresowej pracownika</p>
        <h3 className={s.sheetName}>{detail.sheetId ? `Formularz ${detail.sheetId}` : 'Formularz nieustalony'}</h3>
        {criteria.sheet && <p className={layout.muted}>{criteria.sheet.appliesTo}</p>}
      </div>

      {editing ? (
        <SheetCriteriaEditor detail={detail} model={model} onDone={() => setEditing(false)} />
      ) : (
        <section className={s.questions} aria-labelledby="questions-h">
          <h4 id="questions-h" className={s.questionsLabel}>Pytania kompetencyjne</h4>
          {criteria.all.length === 0 ? (
            <p className={layout.muted}>Wybierz arkusz, aby zobaczyć pytania.</p>
          ) : (
            <ol className={s.list}>
              {criteria.all.map((id, i) => {
                const indicators = findCompetency(model, id)?.indicators ?? []
                const extra = criteria.additional.includes(id)
                return (
                  <li key={id} className={s.item}>
                    <p className={s.itemHead}>
                      <span className={s.num} aria-hidden="true">{i + 1}</span>
                      <span className={s.itemName}>{competencyName(model, id)}</span>
                      <span className={`${layout.tag} ${extra ? layout.tagAccent : ''}`}>{extra ? 'dodatkowe' : 'obowiązkowe'}</span>
                    </p>
                    {indicators.length > 0 && (
                      <ul className={s.indicators}>
                        {indicators.map((ind) => (
                          <li key={ind.id}>{ind.name}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      )}

      {done && (
        <InlineAlert tone="success" title="Formularz zaakceptowany">
          Arkusz {detail.sheetId}, kryteria dodatkowe: {criteria.additional.map((c) => competencyName(model, c)).join(', ') || 'brak'}.
        </InlineAlert>
      )}
      <StageError error={act.error} />
    </StageLayout>
  )
}
