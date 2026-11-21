import { useState, type FormEvent } from 'react'
import type { PartI } from '../../api/cases'
import { Button, Checkbox, ErrorSummary, Field, Fieldset, InfoList, InfoRow, InlineAlert, TextArea, TextInput, type FormError } from '../../components/ui'
import { useCaseAction, usePatchCase } from '../../lib/caseQueries'
import { fmtDate } from '../../lib/format'
import { competencyName } from '../../lib/model'
import { allows } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import { PartHeading, PartSection, WizardActions } from './SheetWizardCommon'
import { StageError } from './StageLayout'
import layout from './StageLayout.module.css'
import s from './SheetWizard.module.css'

type TopicKey = keyof PartI['topics']

/** The four topics of the opening talk (§5 ust. 1 rozp. PRM z 4.04.2016). */
const TOPICS: { key: TopicKey; title: string; hint: string; optional?: boolean }[] = [
  { key: 'duties', title: 'Główne obowiązki wynikające z opisu stanowiska pracy', hint: 'Które zadania z opisu stanowiska są kluczowe w tym okresie?' },
  { key: 'criteria', title: 'Kryteria obowiązkowe i dodatkowe', hint: 'Omów, co każde kryterium oznacza na tym stanowisku.' },
  { key: 'expectations', title: 'Oczekiwania oceniającego co do spełniania kryteriów', hint: 'Szczegóły do każdego kryterium wpiszesz niżej.' },
  { key: 'goals', title: 'Cele na okres oceny i sposób ich realizacji', hint: 'Tylko jeśli uzasadnia to charakter obowiązków.', optional: true },
]

const topicId = (k: TopicKey) => `topic-${k}`
const expectId = (c: string) => `expect-${c}`
const DUE_ID = 'assessment-due'
const confirmId = (i: number) => `confirm-part-i-${i}`
const ACK_ID = 'employee-ack-part-i'
/** The assessed person's statement before "Oceniany potwierdził zapoznanie" (the template has no own sentence for it). */
const EMPLOYEE_ACK_LABEL = 'Zapoznałem(-łam) się z kryteriami oceny oraz terminem sporządzenia oceny'

/** A template line as a checkbox label: without the list punctuation ("…zagadnień," → "…zagadnień"). */
const asLabel = (line: string) => line.trim().replace(/[,;.]+$/, '')
/** First words of a long label, for the error summary. */
const shorten = (text: string, max = 80) => (text.length <= max ? text : `${text.slice(0, text.lastIndexOf(' ', max))}…`)

/** Part I: office, assessed person and evaluator (read only), the opening talk, expectations and the due date. */
export function SheetPartI({ detail, model, criteria, onNext }: StageProps & { onNext: () => void }) {
  const patch = usePatchCase(detail.id)
  const act = useCaseAction(detail.id)
  const confirmed = !!detail.partI.confirmedByEvaluatorOn
  const acked = !!detail.partI.acknowledgedByEmployeeOn
  // The backend accepts part I changes only at the opening talk, until the evaluator confirms it.
  const editable = !confirmed && detail.currentStage === 'OPENING_TALK'
  const afterNegative = detail.cycleLabel.toLowerCase().includes('negatyw')

  const [topics, setTopics] = useState(detail.partI.topics)
  // Every field the evaluator types starts empty; only what is already saved in the case is shown.
  const [expect, setExpect] = useState<Record<string, string>>(() =>
    Object.fromEntries(criteria.all.map((c) => [c, detail.partI.expectations[c] ?? ''])),
  )
  const [due, setDue] = useState(detail.partI.assessmentDue ?? '')
  const [errors, setErrors] = useState<FormError[]>([])
  const errorFor = (id: string) => errors.find((e) => e.id === id)?.message

  // "Potwierdzamy: – …; – …" from the sheet template (GET /api/sheets). Ticking is kept only here: the record of the
  // confirmation is the existing action with its date (CONFIRM_PART_I, EMPLOYEE_ACK_PART_I).
  const confirmLines = (criteria.sheet?.template?.partIConfirmation ?? []).map(asLabel)
  const [ticked, setTicked] = useState<boolean[]>(() => confirmLines.map(() => false))
  const [ackTicked, setAckTicked] = useState(false)
  const allTicked = confirmLines.every((_, i) => ticked[i])
  const canConfirm = editable && allows(detail, 'CONFIRM_PART_I')
  const canAck = confirmed && !acked && allows(detail, 'EMPLOYEE_ACK_PART_I')
  const clearError = (id: string) => setErrors((v) => (v.some((e) => e.id === id) ? v.filter((e) => e.id !== id) : v))
  const tick = (i: number, on: boolean) => {
    setTicked((v) => confirmLines.map((_, j) => (j === i ? on : !!v[j])))
    if (on) clearError(confirmId(i))
  }
  const confirmErrors = (): FormError[] =>
    confirmLines.flatMap((l, i) => (ticked[i] ? [] : [{ id: confirmId(i), message: `Zaznacz potwierdzenie „${shorten(l)}”` }]))
  const confirmGroupError = confirmLines.some((_, i) => errorFor(confirmId(i)))
    ? 'Zaznacz wszystkie potwierdzenia, zanim zatwierdzisz część I'
    : undefined

  const validate = (): FormError[] => {
    const e: FormError[] = TOPICS.filter((t) => !t.optional && !topics[t.key]?.trim()).map((t) => ({
      id: topicId(t.key),
      message: `Wpisz notatkę do zagadnienia „${t.title}”`,
    }))
    for (const c of criteria.all) {
      if (!expect[c]?.trim()) e.push({ id: expectId(c), message: `Wpisz oczekiwania do kryterium „${competencyName(model, c)}”` })
    }
    if (!due) e.push({ id: DUE_ID, message: 'Wpisz termin sporządzenia oceny' })
    return e
  }

  /** Validates and saves part I; false when something is missing or the save failed. */
  const save = async (): Promise<boolean> => {
    const e = validate()
    setErrors(e)
    if (e.length) return false
    try {
      await patch.mutateAsync({ partI: { topics, expectations: expect, assessmentDue: due } })
      return true
    } catch {
      return false
    }
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!editable) return onNext()
    if (await save()) onNext()
  }

  const confirm = async () => {
    const missing = confirmErrors()
    if (missing.length) return setErrors([...validate(), ...missing])
    if (await save()) act.mutate('CONFIRM_PART_I')
  }

  const acknowledge = () => {
    if (!ackTicked) return setErrors([{ id: ACK_ID, message: `Zaznacz pole „${EMPLOYEE_ACK_LABEL}”` }])
    setErrors([])
    act.mutate('EMPLOYEE_ACK_PART_I')
  }

  return (
    <form noValidate onSubmit={onSubmit} className={s.form}>
      {/* The "Część I jest zatwierdzona" status is shown by SheetWizard under the stage title. */}
      {afterNegative && (
        <InlineAlert tone="warning" title="Ponowna ocena po ocenie negatywnej">
          Rozmowę rozpoczynającą przeprowadza się w ciągu 7 dni od sporządzenia oceny (§7 pkt 2 rozp. 2016), a ocenę po 6 miesiącach od
          zapoznania (art. 81 ust. 9 ustawy).
        </InlineAlert>
      )}

      <PartHeading roman="I">Kryteria oceny i termin sporządzenia oceny</PartHeading>
      <ErrorSummary errors={errors} />

      <PartSection title="Nazwa urzędu i dane" hint="Uzupełnione automatycznie z teczki. Nie można ich tu zmienić.">
        <InfoList>
          <InfoRow label="Nazwa urzędu" value={detail.officeName} />
        </InfoList>
        <div className={s.people}>
          <Person title="Dane ocenianego" p={detail.person} />
          <Person title="Dane oceniającego" p={detail.evaluator} />
        </div>
      </PartSection>

      <PartSection title="Kryteria oceny i termin sporządzenia oceny" hint="Kryteria ustalono w kroku „Proponowany formularz”.">
        <div className={s.criteria}>
          <div>
            <p className={s.listLabel}>Kryteria obowiązkowe</p>
            <ul className={layout.bullets}>
              {criteria.mandatory.map((c) => <li key={c}>{competencyName(model, c)}</li>)}
            </ul>
          </div>
          <div>
            <p className={s.listLabel}>Kryteria dodatkowe wybrane przez oceniającego (nie więcej niż 3)</p>
            {criteria.additional.length ? (
              <ul className={layout.bullets}>
                {criteria.additional.map((c) => <li key={c}>{competencyName(model, c)}</li>)}
              </ul>
            ) : (
              <p className={layout.muted}>Brak</p>
            )}
          </div>
        </div>
        <Field
          id={DUE_ID}
          label="Termin sporządzenia oceny"
          hint={`Wpisz datę (dd.mm.rrrr). Ocenę sporządza się ${afterNegative ? 'po 6 miesiącach (art. 81 ust. 9 ustawy)' : 'co 24 miesiące (art. 81 ust. 1 ustawy)'}. Po zatwierdzeniu części I zmiana tylko w trybie zmiany terminu.`}
          error={errorFor(DUE_ID)}
        >
          {(p) => <TextInput {...p} type="date" width={20} placeholder="dd.mm.rrrr" readOnly={!editable} value={due} onChange={(e) => setDue(e.target.value)} />}
        </Field>
      </PartSection>

      <PartSection title="Zagadnienia rozmowy rozpoczynającej" hint="Rozporządzenie wymaga omówienia każdego zagadnienia (§5 ust. 1 rozp. PRM z 4.04.2016).">
        <div className={s.fields}>
          {TOPICS.map((t) => (
            <Field key={t.key} id={topicId(t.key)} label={t.title} hint={t.hint} optional={t.optional} error={errorFor(topicId(t.key))}>
              {(p) => (
                <TextArea
                  {...p}
                  rows={3}
                  readOnly={!editable}
                  value={topics[t.key] ?? ''}
                  onChange={(e) => setTopics((v) => ({ ...v, [t.key]: e.target.value }))}
                />
              )}
            </Field>
          ))}
        </div>
      </PartSection>

      <PartSection
        title="Oczekiwania wobec kryteriów"
        hint="Opisz, czego oczekujesz w każdym kryterium na tym stanowisku: to punkt odniesienia przy ocenie."
      >
        <div className={s.fields}>
          {criteria.all.map((c) => (
            <Field
              key={c}
              id={expectId(c)}
              label={competencyName(model, c)}
              error={errorFor(expectId(c))}
            >
              {(p) => (
                <TextArea {...p} rows={3} readOnly={!editable} value={expect[c] ?? ''} onChange={(e) => setExpect((v) => ({ ...v, [c]: e.target.value }))} />
              )}
            </Field>
          ))}
        </div>
      </PartSection>

      {/* Each confirmation is a checkbox that has to be ticked before the action; once done it stays ticked, locked, with the date. */}
      <PartSection title="Potwierdzenie części I" hint="Oceniający i oceniany potwierdzają rozmowę oraz zapoznanie z kryteriami i terminem oceny.">
        {confirmLines.length > 0 && (
          <Fieldset
            id="confirm-part-i"
            legend="Potwierdzenie oceniającego"
            hint={canConfirm ? 'Zaznacz wszystkie potwierdzenia. Bez tego nie zatwierdzisz części I.' : undefined}
            error={confirmGroupError}
          >
            {confirmLines.map((l, i) => (
              <Checkbox
                key={l}
                id={confirmId(i)}
                label={l}
                hint={confirmed ? `Potwierdzono ${fmtDate(detail.partI.confirmedByEvaluatorOn)}` : undefined}
                checked={confirmed || !!ticked[i]}
                disabled={confirmed || !canConfirm}
                invalid={!!errorFor(confirmId(i))}
                onChange={(e) => tick(i, e.target.checked)}
              />
            ))}
          </Fieldset>
        )}
        {!confirmed && !editable && <p className={layout.muted}>Oceniający jeszcze nie potwierdził części I.</p>}
        {!confirmed && editable && (
          <div className={s.inlineActions}>
            <Button
              variant="secondary"
              loading={act.isPending}
              disabled={patch.isPending || !canConfirm}
              aria-disabled={!allTicked || undefined}
              onClick={confirm}
            >
              Zatwierdź część I
            </Button>
            <p className={layout.muted}>Zatwierdzenie zapisuje część I i blokuje kryteria oraz termin oceny.</p>
          </div>
        )}

        <Fieldset
          id="employee-ack"
          legend="Potwierdzenie ocenianego"
          hint={confirmed ? undefined : 'Oceniany potwierdza zapoznanie po zatwierdzeniu części I przez oceniającego.'}
          error={errorFor(ACK_ID) ? 'Zaznacz pole, zanim potwierdzisz zapoznanie ocenianego' : undefined}
        >
          <Checkbox
            id={ACK_ID}
            label={EMPLOYEE_ACK_LABEL}
            hint={acked ? `Potwierdzono ${fmtDate(detail.partI.acknowledgedByEmployeeOn)}` : undefined}
            checked={acked || ackTicked}
            disabled={!canAck}
            invalid={!!errorFor(ACK_ID)}
            onChange={(e) => {
              setAckTicked(e.target.checked)
              if (e.target.checked) clearError(ACK_ID)
            }}
          />
        </Fieldset>
        {confirmed && !acked && (
          <div className={s.inlineActions}>
            <Button
              variant="secondary"
              loading={act.isPending}
              disabled={!allows(detail, 'EMPLOYEE_ACK_PART_I')}
              aria-disabled={!ackTicked || undefined}
              onClick={acknowledge}
            >
              Oceniany potwierdził zapoznanie
            </Button>
            <p className={layout.muted}>W wersji demonstracyjnej podpis ocenianego symulujemy przyciskiem (data = dziś).</p>
          </div>
        )}
      </PartSection>

      <StageError error={patch.error ?? act.error} />
      <WizardActions loading={patch.isPending && !act.isPending} />
    </form>
  )
}

function Person({ title, p }: { title: string; p: { firstName: string; lastName: string; unit: string; position: string } }) {
  return (
    <div>
      <p className={s.listLabel}>{title}</p>
      <InfoList>
        <InfoRow label="Imię" value={p.firstName} />
        <InfoRow label="Nazwisko" value={p.lastName} />
        <InfoRow label="Komórka organizacyjna" value={p.unit} />
        <InfoRow label="Stanowisko pracy" value={p.position} />
      </InfoList>
    </div>
  )
}
