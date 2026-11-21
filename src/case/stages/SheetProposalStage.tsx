import { useState } from 'react'
import { Button, Field, InlineAlert, Select } from '../../components/ui'
import { useCaseAction } from '../../lib/caseQueries'
import { findCompetency, competencyName, useSheets } from '../../lib/model'
import { allows } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import { SheetCriteriaEditor } from './SheetCriteriaEditor'
import { StageError, StageLayout } from './StageLayout'
import layout from './StageLayout.module.css'
import s from './SheetProposalStage.module.css'

/**
 * "Proponowany formularz" (design frame 2): the sheet proposed from the job description (a locked
 * dropdown) and its competency questions, read only. At the end, "Akceptuj formularz" moves the case on
 * to the opening talk; "Wprowadź poprawki" opens the editor of the sheet and the additional criteria.
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
      lead="System zaproponował formularz na podstawie opisu stanowiska. Przejrzyj pytania kompetencyjne i zaakceptuj formularz albo wprowadź poprawki."
    >
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
        <section className={s.questions} aria-labelledby="questions-h">
          <h3 id="questions-h" className={s.questionsLabel}>Pytania kompetencyjne wybrane na podstawie analizy opisu stanowiska</h3>
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
