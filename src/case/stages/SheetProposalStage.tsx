import { useState } from 'react'
import { Button, Card, Field, InlineAlert, Select } from '../../components/ui'
import { useCaseAction } from '../../lib/caseQueries'
import { competencyName, useSheets } from '../../lib/model'
import { allows } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import { SheetCriteriaEditor } from './SheetCriteriaEditor'
import { StageError, StageLayout } from './StageLayout'
import layout from './StageLayout.module.css'
import s from './SheetProposalStage.module.css'

/**
 * "Proponowany formularz" (design frame 2): the sheet proposed from the job description (a locked
 * dropdown) and the competencies chosen for assessment as plain, non-clickable tiles. At the end,
 * "Akceptuj formularz" moves the case on to the opening talk; "Wprowadź poprawki" opens the editor of
 * the sheet and the additional criteria.
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
    <StageLayout info={info}>
      <Field label="Formularz oceny" className={s.sheetField}>
        {(control) => (
          <>
            <Select
              {...control}
              aria-describedby={criteria.sheet ? `${control.id}-applies` : undefined}
              disabled
              value={detail.sheetId ?? ''}
              placeholder={detail.sheetId ? undefined : 'Nie ustalono'}
              options={periodic.map((x) => ({ value: x.id, label: `Arkusz ${x.id}` }))}
            />
            {criteria.sheet && (
              <p id={`${control.id}-applies`} className={`${layout.muted} ${s.appliesTo}`}>
                {criteria.sheet.appliesTo}
              </p>
            )}
          </>
        )}
      </Field>

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

      {done && (
        <InlineAlert tone="success" title="Formularz zaakceptowany">
          Arkusz {detail.sheetId}, kryteria dodatkowe: {criteria.additional.map((c) => competencyName(model, c)).join(', ') || 'brak'}.
        </InlineAlert>
      )}
      <StageError error={act.error} />
    </StageLayout>
  )
}
