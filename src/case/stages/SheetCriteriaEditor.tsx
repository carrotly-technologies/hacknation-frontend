import { useState } from 'react'
import type { CaseDetail } from '../../api/cases'
import type { CompetencyModel, SheetId } from '../../api/kompas'
import { Button, Checkbox, Fieldset, InlineAlert, RadioGroup, Select } from '../../components/ui'
import { usePatchCase } from '../../lib/caseQueries'
import { competencyName, useSheets } from '../../lib/model'
import { StageError } from './StageLayout'
import s from './SheetProposalStage.module.css'

/**
 * "Wprowadź zmiany" on the proposed sheet: pick another sheet and choose the additional criteria
 * (the system's candidates from the job description, or any other from the catalogue). The limit
 * of additional criteria comes from the sheet (API), not from the frontend.
 */
export function SheetCriteriaEditor({ detail, model, onDone }: { detail: CaseDetail; model: CompetencyModel; onDone: () => void }) {
  const sheets = useSheets()
  const patch = usePatchCase(detail.id)
  const analysis = detail.ospAnalysis
  const periodic = (sheets.data ?? []).filter((x) => x.kind === 'PERIODIC')
  const [sheetId, setSheetId] = useState<SheetId>(detail.sheetId ?? analysis?.suggestedSheet?.sheetId ?? periodic[0]?.id ?? 'A')
  const [chosen, setChosen] = useState<string[]>(detail.partI.additionalCriteria)
  const sheet = periodic.find((x) => x.id === sheetId)
  const mandatory = sheet?.mandatoryCriteria ?? []
  const max = sheet?.maxAdditionalCriteria ?? 0
  const selected = chosen.filter((c) => !mandatory.includes(c))
  const candidates = (analysis?.additionalCandidates ?? []).filter((c) => !mandatory.includes(c.criterionId))
  const extras = selected.filter((c) => !candidates.some((x) => x.criterionId === c))
  const catalog = model.competencies.map((c) => c.id).filter((id) => !mandatory.includes(id) && !selected.includes(id))
  const full = selected.length >= max

  const toggle = (id: string, on: boolean) => setChosen((list) => (on ? [...list, id] : list.filter((x) => x !== id)))

  const save = async () => {
    await patch.mutateAsync({ sheetId, partI: { additionalCriteria: selected } })
    onDone()
  }

  return (
    <div className={s.editor}>
      <RadioGroup
        id="sheet-choice"
        name="sheet"
        legend="Arkusz oceny"
        value={sheetId}
        onChange={(v) => setSheetId(v as SheetId)}
        options={periodic.map((x) => ({
          value: x.id,
          label: `Formularz ${x.id}${analysis?.suggestedSheet?.sheetId === x.id ? ' (propozycja systemu)' : ''}`,
          hint: x.appliesTo,
        }))}
      />
      {analysis?.suggestedSheet && sheetId !== analysis.suggestedSheet.sheetId && (
        <InlineAlert tone="warning" title="Arkusz inny niż wynika z opisu stanowiska">
          Upewnij się, że opis stanowiska jest aktualny.
        </InlineAlert>
      )}

      <Fieldset
        id="extra-criteria"
        legend={`Kryteria dodatkowe (${selected.length}/${max})`}
        hint={`Najwyżej ${max}, najistotniejsze ze względu na obowiązki z opisu stanowiska. Można nie wybrać żadnego.`}
      >
        <div className={s.checks}>
          {candidates.map((c) => {
            const on = selected.includes(c.criterionId)
            return (
              <Checkbox
                key={c.criterionId}
                label={`${competencyName(model, c.criterionId)} (propozycja systemu)`}
                hint={c.reason}
                checked={on}
                disabled={!on && full}
                onChange={(e) => toggle(c.criterionId, e.target.checked)}
              />
            )
          })}
          {extras.map((id) => (
            <Checkbox key={id} label={competencyName(model, id)} hint="Dodane przez Ciebie spoza propozycji." checked onChange={() => toggle(id, false)} />
          ))}
        </div>
        <div className={s.add}>
          <Select
            aria-label="Dodaj inne kryterium z katalogu"
            value=""
            disabled={full}
            placeholder={full ? `Wybrano już ${max} kryteria dodatkowe` : 'Dodaj inne kryterium z katalogu…'}
            onChange={(e) => e.target.value && toggle(e.target.value, true)}
            options={catalog.map((id) => ({ value: id, label: competencyName(model, id) }))}
          />
        </div>
      </Fieldset>

      <StageError error={patch.error} />
      <div className={s.editorActions}>
        <Button variant="text" onClick={onDone}>
          Anuluj
        </Button>
        <Button loading={patch.isPending} onClick={save}>
          Zapisz zmiany
        </Button>
      </div>
    </div>
  )
}
