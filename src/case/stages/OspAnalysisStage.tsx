import { useState } from 'react'
import type { SheetId } from '../../api/kompas'
import { Button, Card, Field, InlineAlert, Select } from '../../components/ui'
import { useCaseAction, usePatchCase } from '../../lib/caseQueries'
import { competencyName, useSheets } from '../../lib/model'
import { allows } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import { StageError, StageLayout } from './StageLayout'
import s from './StageLayout.module.css'

/**
 * "Analiza opisu stanowiska" (design frame 1): the job description in three cards (description,
 * the employee's tasks, competencies) and one action. The system's proposal is not shown here: accepting
 * saves the suggested sheet as the draft (mandatory criteria only; additional criteria are the supervisor's
 * own choice), and "Proponowany formularz" shows it for review. When no sheet can be suggested, a sheet
 * picker sits above the action.
 */
export function OspAnalysisStage({ detail, model, stage }: StageProps) {
  const info = detail.stages.find((x) => x.id === stage)!
  const sheets = useSheets()
  const patch = usePatchCase(detail.id)
  const act = useCaseAction(detail.id)
  const done = info.status === 'DONE'
  const osp = detail.osp
  const suggested = detail.ospAnalysis?.suggestedSheet ?? null
  const [chosen, setChosen] = useState<SheetId | ''>(detail.sheetId ?? '')
  const sheetId = detail.sheetId ?? suggested?.sheetId ?? (chosen || null)

  const accept = async () => {
    if (!sheetId) return
    // The proposal becomes the draft sheet with its mandatory criteria only: no additional criteria are
    // picked for the supervisor, they add them by hand in "Proponowany formularz" if they want any.
    await patch.mutateAsync({ sheetId })
    act.mutate('ACCEPT_OSP_ANALYSIS')
  }

  if (!osp) {
    return (
      <StageLayout info={info}>
        <InlineAlert tone="warning" title="Brak opisu stanowiska">Do teczki nie dołączono opisu stanowiska pracy.</InlineAlert>
      </StageLayout>
    )
  }

  return (
    <StageLayout
      info={info}
      status={
        done && (
          <InlineAlert tone="success" title="Analiza zatwierdzona">
            Proponowany formularz: arkusz {detail.sheetId}.
          </InlineAlert>
        )
      }
      actions={
        done ? null : (
          <Button loading={patch.isPending || act.isPending} disabled={!sheetId || !allows(detail, 'ACCEPT_OSP_ANALYSIS')} onClick={accept}>
            Zatwierdź analizę
          </Button>
        )
      }
    >
      <Card as="h3" title="Opis stanowiska">
        <div className={s.cardContent}>
          <p className={s.text}>{osp.purpose}</p>
          <p className={s.text}>Liczba podległych pracowników: {osp.subordinates}</p>
        </div>
      </Card>

      <Card as="h3" title="Zadania pracownika">
        <ul className={s.bullets}>
          {osp.mainTasks.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </Card>

      <Card as="h3" title="Kompetencje">
        <ul className={s.bullets}>
          {osp.softCompetencies.map((c) => (
            <li key={c}>{competencyName(model, c)}</li>
          ))}
          {osp.otherRequirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Card>

      {!suggested && !detail.sheetId && (
        <Field label="Arkusz oceny" hint="Z opisu stanowiska nie da się ustalić arkusza. Wybierz go sam.">
          {(p) => (
            <Select
              {...p}
              value={chosen}
              placeholder="Wybierz arkusz"
              disabled={done}
              onChange={(e) => setChosen(e.target.value as SheetId)}
              options={(sheets.data ?? []).filter((x) => x.kind === 'PERIODIC').map((x) => ({ value: x.id, label: `Arkusz ${x.id}` }))}
            />
          )}
        </Field>
      )}

      <StageError error={patch.error ?? act.error} />
    </StageLayout>
  )
}
