import { useState } from 'react'
import { Button, Card, RadioGroup } from '../../components/ui'
import { useCaseAction } from '../../lib/caseQueries'
import { competencyName, findCompetency, useSheets } from '../../lib/model'
import { allows } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import { SheetCriteriaEditor } from './SheetCriteriaEditor'
import { StageError } from './StageLayout'
import layout from './StageLayout.module.css'
import s from './SheetProposalStage.module.css'

/**
 * „Wynik analizy”, the lower part of step 1 „Analiza stanowiska” (backend stage SHEET_PROPOSAL, hacknation-frontend#153):
 * the sheet the system picked from the job description (all periodic sheets as locked radios, the picked one checked)
 * and the mandatory criteria, one below the other, each as a non-clickable full-width card listing its indicators.
 * „Akceptuj formularz” moves the case on to step 2 „Formularz oceny”; „Wprowadź poprawki” opens the editor of the
 * sheet and the additional criteria. Additional criteria are never picked for the evaluator.
 */
export function SheetProposalSection({ detail, model, criteria, headingId }: Pick<StageProps, 'detail' | 'model' | 'criteria'> & { headingId: string }) {
  const info = detail.stages.find((x) => x.id === 'SHEET_PROPOSAL')
  const act = useCaseAction(detail.id)
  const [editing, setEditing] = useState(false)
  const done = info?.status === 'DONE'
  const canEdit = !done && allows(detail, 'ACCEPT_SHEET')

  const sheets = useSheets()
  const periodic = (sheets.data ?? []).filter((x) => x.kind === 'PERIODIC')

  return (
    <section aria-labelledby={headingId} className={s.result}>
      <h3 id={headingId} className={s.resultLabel}>Wynik analizy</h3>

      {!editing && (
        <RadioGroup
          id="proposed-sheet"
          name="proposed-sheet"
          legend="Formularz oceny"
          value={detail.sheetId ?? ''}
          onChange={() => {}}
          options={periodic.map((x) => ({
            value: x.id,
            label: `Arkusz ${x.id}`,
            hint: (
              <span className="one-line" title={x.appliesTo}>
                {x.appliesTo}
              </span>
            ),
            disabled: true,
          }))}
        />
      )}

      {editing ? (
        <SheetCriteriaEditor detail={detail} model={model} onDone={() => setEditing(false)} />
      ) : (
        <section aria-labelledby="questions-h">
          <h4 id="questions-h" className={s.questionsLabel}>Pytania kompetencyjne wybrane na podstawie analizy opisu stanowiska</h4>
          {criteria.all.length === 0 ? (
            <p className={layout.muted}>Wybierz arkusz, aby zobaczyć pytania.</p>
          ) : (
            <ul className={s.list}>
              {criteria.all.map((id) => {
                const indicators = findCompetency(model, id)?.indicators ?? []
                return (
                  <li key={id}>
                    <Card as="h5" title={competencyName(model, id)} className={s.competency}>
                      {indicators.length > 0 && (
                        <ul className={s.indicators}>
                          {indicators.map((ind) => (
                            <li key={ind.id}>{ind.name}</li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {canEdit && !editing && (
        <div className={s.finalActions}>
          <Button loading={act.isPending} disabled={!detail.sheetId} onClick={() => act.mutate('ACCEPT_SHEET')}>
            Akceptuj formularz
          </Button>
          <Button variant="text" onClick={() => setEditing(true)}>
            Wprowadź poprawki
          </Button>
        </div>
      )}

      <StageError error={act.error} />
    </section>
  )
}
