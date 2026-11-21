import { useState } from 'react'
import { Button, Card, InlineAlert, RadioGroup } from '../../components/ui'
import { useCaseAction } from '../../lib/caseQueries'
import { competencyName, useSheets } from '../../lib/model'
import { allows } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import { SheetCriteriaEditor } from './SheetCriteriaEditor'
import { StageError, StageLayout } from './StageLayout'
import layout from './StageLayout.module.css'
import s from './SheetProposalStage.module.css'

/**
 * "Proponowany formularz" (design frame 2): the sheet proposed from the job description (all periodic
 * sheets as locked radios, the proposed one checked) and the competencies chosen for assessment as plain,
 * non-clickable tiles. At the end, "Akceptuj formularz" moves the case on to the opening talk;
 * "Wprowadź poprawki" opens the editor of the sheet and the additional criteria.
 */
export function SheetProposalStage({ detail, model, criteria, stage }: StageProps) {
  const info = detail.stages.find((x) => x.id === stage)!
  const act = useCaseAction(detail.id)
  const [editing, setEditing] = useState(false)
  const done = info.status === 'DONE'
  const canEdit = !done && allows(detail, 'ACCEPT_SHEET')

  const sheets = useSheets()
  const periodic = (sheets.data ?? []).filter((x) => x.kind === 'PERIODIC')

  return (
    <StageLayout
      info={info}
      status={
        done && (
          <InlineAlert tone="success" title="Formularz zaakceptowany">
            Arkusz {detail.sheetId}, kryteria dodatkowe: {criteria.additional.map((c) => competencyName(model, c)).join(', ') || 'brak'}.
          </InlineAlert>
        )
      }
    >
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
          <h3 id="questions-h" className={s.questionsLabel}>Pytania kompetencyjne wybrane na podstawie analizy opisu stanowiska</h3>
          {criteria.all.length === 0 ? (
            <p className={layout.muted}>Wybierz arkusz, aby zobaczyć pytania.</p>
          ) : (
            <ul className={s.tiles}>
              {criteria.all.map((id) => {
                const name = competencyName(model, id)
                return (
                  <li key={id} className={s.tileItem}>
                    <Card className={s.tile}>
                      <span className="one-line" title={name}>{name}</span>
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
    </StageLayout>
  )
}
