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
 * the employee's tasks, competencies), the system's
 * proposal (marked as a suggestion) and one action. Accepting takes the proposal to "Proponowany formularz",
 * where the evaluator reviews it and may change the sheet and criteria.
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
  const sheet = sheets.data?.find((x) => x.id === sheetId)
  const mandatory = sheet?.mandatoryCriteria ?? []
  const candidates = (detail.ospAnalysis?.additionalCandidates ?? []).filter((c) => !mandatory.includes(c.criterionId))

  const accept = async () => {
    if (!sheetId) return
    // The proposal becomes the draft sheet: suggested sheet + suggested additional criteria (within the sheet's limit).
    const draft = detail.partI.additionalCriteria.length > 0
      ? detail.partI.additionalCriteria
      : candidates.slice(0, sheet?.maxAdditionalCriteria ?? 0).map((c) => c.criterionId)
    await patch.mutateAsync({ sheetId, partI: { additionalCriteria: draft } })
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

      <Card as="h3" title="Propozycja systemu">
        {suggested ? (
          <p>
            Formularz {suggested.sheetId}, bo: {suggested.reason} <span className={s.muted}>({suggested.legalBasis})</span>
          </p>
        ) : (
          !detail.sheetId && (
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
          )
        )}
        {candidates.length > 0 && (
          <p>Proponowane kryteria dodatkowe: {candidates.map((c) => competencyName(model, c.criterionId)).join(', ')}.</p>
        )}
        <p className={s.muted}>To sugestia. W kroku „Proponowany formularz” zaakceptujesz ją albo wprowadzisz zmiany.</p>
      </Card>

      {done && (
        <InlineAlert tone="success" title="Analiza zatwierdzona">
          Proponowany formularz: arkusz {detail.sheetId}.
        </InlineAlert>
      )}
      <StageError error={patch.error ?? act.error} />
    </StageLayout>
  )
}
