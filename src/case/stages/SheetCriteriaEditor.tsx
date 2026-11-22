import { X } from 'lucide-react'
import { useId, useState } from 'react'
import type { CaseDetail } from '../../api/cases'
import type { CompetencyModel, SheetId } from '../../api/kompas'
import { Button, Checkbox, Field, Fieldset, InlineAlert, RadioGroup, TextInput } from '../../components/ui'
import { usePatchCase } from '../../lib/caseQueries'
import { criteriaCount, foldText } from '../../lib/format'
import { competencyName, useSheets } from '../../lib/model'
import { StageError } from './StageLayout'
import t from './CompetencyScores.module.css'
import s from './SheetProposalStage.module.css'

/**
 * "Wprowadź zmiany" on the proposed sheet: pick another sheet and choose the additional criteria.
 * The chosen ones are a table with "×" to remove (in the order they were added); new ones are ticked
 * on a searchable checkbox list of the whole model (the system's candidates from the job description on top).
 * Both views share one `selected` list. The limit of additional criteria comes from the sheet (API), not from the frontend.
 */
export function SheetCriteriaEditor({ detail, model, onDone }: { detail: CaseDetail; model: CompetencyModel; onDone: () => void }) {
  const sheets = useSheets()
  const patch = usePatchCase(detail.id)
  const listId = useId()
  const analysis = detail.ospAnalysis
  const periodic = (sheets.data ?? []).filter((x) => x.kind === 'PERIODIC')
  const [sheetId, setSheetId] = useState<SheetId>(detail.sheetId ?? analysis?.suggestedSheet?.sheetId ?? periodic[0]?.id ?? 'A')
  const [chosen, setChosen] = useState<string[]>(detail.partI.additionalCriteria)
  const [query, setQuery] = useState('')
  const sheet = periodic.find((x) => x.id === sheetId)
  const mandatory = sheet?.mandatoryCriteria ?? []
  const max = sheet?.maxAdditionalCriteria ?? 0
  const selected = chosen.filter((c) => !mandatory.includes(c))
  const full = selected.length >= max

  const candidates = (analysis?.additionalCandidates ?? []).filter((c) => !mandatory.includes(c.criterionId))
  const reasonOf = (id: string) => candidates.find((c) => c.criterionId === id)?.reason
  const options = [
    ...candidates.map((c) => c.criterionId),
    ...model.competencies.map((c) => c.id).filter((id) => !mandatory.includes(id) && !candidates.some((c) => c.criterionId === id)),
  ]
  const needle = foldText(query.trim())
  const shown = needle ? options.filter((id) => foldText(competencyName(model, id)).includes(needle)) : options

  const toggle = (id: string, on: boolean) => setChosen((list) => (on ? (list.includes(id) ? list : [...list, id]) : list.filter((x) => x !== id)))

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

      <table className={`${t.table} ${s.chosenTable}`}>
        <caption className={t.caption}>
          Wybrane kryteria dodatkowe ({selected.length}/{max})
        </caption>
        <thead>
          <tr>
            <th scope="col">Kryterium</th>
            <th scope="col" className={s.removeCol}>
              <span className="visually-hidden">Usuń</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {selected.length === 0 ? (
            <tr>
              <td colSpan={2} className={s.chosenEmpty}>
                Nie wybrano kryteriów dodatkowych (to dopuszczalne).
              </td>
            </tr>
          ) : (
            selected.map((id) => {
              const name = competencyName(model, id)
              return (
                <tr key={id}>
                  <th scope="row">{name}</th>
                  <td className={s.removeCol}>
                    <Button variant="text" className={s.remove} aria-label={`Usuń kryterium ${name}`} onClick={() => toggle(id, false)}>
                      <X size={20} aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      <Fieldset
        id="extra-criteria"
        legend="Dodaj kryteria dodatkowe"
        hint={`Najwyżej ${criteriaCount(max)}, najistotniejsze ze względu na obowiązki z opisu stanowiska. Można nie wybrać żadnego.`}
      >
        <Field label="Szukaj kryterium" className={s.search}>
          {(p) => (
            <TextInput {...p} type="search" autoComplete="off" aria-controls={listId} value={query} onChange={(e) => setQuery(e.target.value)} />
          )}
        </Field>
        <p className={s.limit} aria-live="polite">
          {full && max > 0 ? `Wybrano maksymalnie ${criteriaCount(max)}. Usuń jedno, aby dodać inne.` : ''}
        </p>
        <div id={listId} className={s.options} role="group" aria-label="Kryteria do wyboru" tabIndex={0}>
          {shown.length === 0 ? (
            <p className={s.noResults}>Brak kryteriów pasujących do „{query.trim()}”.</p>
          ) : (
            shown.map((id) => {
              const on = selected.includes(id)
              const reason = reasonOf(id)
              return (
                <Checkbox
                  key={id}
                  label={`${competencyName(model, id)}${reason !== undefined ? ' (propozycja systemu)' : ''}`}
                  hint={reason}
                  checked={on}
                  disabled={!on && full}
                  onChange={(e) => toggle(id, e.target.checked)}
                />
              )
            })
          )}
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
