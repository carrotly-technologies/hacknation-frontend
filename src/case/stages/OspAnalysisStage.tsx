import { useEffect, useId, useRef, useState } from 'react'
import type { SheetId } from '../../api/kompas'
import { Button, Card, Field, InlineAlert, Select } from '../../components/ui'
import { useCaseAction, usePatchCase } from '../../lib/caseQueries'
import { competencyName, useSheets } from '../../lib/model'
import { allows } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import { SheetProposalSection } from './SheetProposalSection'
import { StageError, StageLayout } from './StageLayout'
import s from './StageLayout.module.css'

/**
 * Step 1 „Analiza stanowiska” (backend stages OSP_ANALYSIS and SHEET_PROPOSAL, hacknation-frontend#153). The job
 * description sits in three collapsed cards (description, the employee's tasks, competencies) for a look; the main
 * action under them is „Przeprowadź analizę”. It saves the sheet the system picked (or the one chosen in the picker
 * when the job description does not settle it) with its mandatory criteria only, and the „Wynik analizy” section
 * then shows on the same screen (no navigation, `follow: false`). The result is shown only after the click, so the
 * analysis is the evaluator's own step even though the system knows it at once.
 */
export function OspAnalysisStage({ detail, model, criteria, stage }: StageProps) {
  const info = detail.stages.find((x) => x.id === stage)!
  const proposal = detail.stages.find((x) => x.id === 'SHEET_PROPOSAL')
  const sheets = useSheets()
  const patch = usePatchCase(detail.id)
  const act = useCaseAction(detail.id, { follow: false })
  const analysed = info.status === 'DONE'
  const accepted = proposal?.status === 'DONE'
  const osp = detail.osp
  const suggested = detail.ospAnalysis?.suggestedSheet ?? null
  const [chosen, setChosen] = useState<SheetId | ''>(detail.sheetId ?? '')
  const sheetId = detail.sheetId ?? suggested?.sheetId ?? (chosen || null)
  const resultId = useId()

  // The result appears below the cards: bring it into view right after the analysis (not on a later visit).
  const ran = useRef(false)
  useEffect(() => {
    if (analysed && ran.current) document.getElementById(resultId)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [analysed, resultId])

  const analyse = async () => {
    if (!sheetId) return
    ran.current = true
    // The proposal becomes the draft sheet with its mandatory criteria only: no additional criteria are picked
    // for the supervisor, they add them by hand with „Wprowadź poprawki” if they want any.
    if (detail.sheetId !== sheetId) await patch.mutateAsync({ sheetId })
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
        accepted && (
          <InlineAlert tone="success" title="Formularz zaakceptowany">
            Arkusz {detail.sheetId}, kryteria dodatkowe: {criteria.additional.map((c) => competencyName(model, c)).join(', ') || 'brak'}.
          </InlineAlert>
        )
      }
    >
      <Card collapsible as="h3" title="Opis stanowiska">
        <div className={s.cardContent}>
          <p className={s.text}>{osp.purpose}</p>
          <p className={s.text}>Liczba podległych pracowników: {osp.subordinates}</p>
        </div>
      </Card>

      <Card collapsible as="h3" title="Zadania pracownika">
        <ul className={s.bullets}>
          {osp.mainTasks.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </Card>

      <Card collapsible as="h3" title="Kompetencje">
        <ul className={s.bullets}>
          {osp.softCompetencies.map((c) => (
            <li key={c}>{competencyName(model, c)}</li>
          ))}
          {osp.otherRequirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Card>

      {!analysed && (
        <>
          {!suggested && !detail.sheetId && (
            <Field label="Arkusz oceny" hint="Z opisu stanowiska nie da się ustalić arkusza. Wybierz go sam.">
              {(p) => (
                <Select
                  {...p}
                  value={chosen}
                  placeholder="Wybierz arkusz"
                  onChange={(e) => setChosen(e.target.value as SheetId)}
                  options={(sheets.data ?? []).filter((x) => x.kind === 'PERIODIC').map((x) => ({ value: x.id, label: `Arkusz ${x.id}` }))}
                />
              )}
            </Field>
          )}
          <div>
            <Button loading={patch.isPending || act.isPending} disabled={!sheetId || !allows(detail, 'ACCEPT_OSP_ANALYSIS')} onClick={analyse}>
              Przeprowadź analizę
            </Button>
          </div>
          <StageError error={patch.error ?? act.error} />
        </>
      )}

      {analysed && proposal && <SheetProposalSection detail={detail} model={model} criteria={criteria} headingId={resultId} />}
    </StageLayout>
  )
}
