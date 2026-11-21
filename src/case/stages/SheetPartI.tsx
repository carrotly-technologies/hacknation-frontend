import { useState, type FormEvent } from 'react'
import type { PartI } from '../../api/cases'
import type { CompetencyModel } from '../../api/kompas'
import { Button, ErrorSummary, Field, InfoList, InfoRow, InlineAlert, TextArea, TextInput, type FormError } from '../../components/ui'
import { useCaseAction, usePatchCase } from '../../lib/caseQueries'
import { DEMO_TODAY, fmtDate } from '../../lib/format'
import { competencyName, findCompetency } from '../../lib/model'
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

function defaultExpectation(model: CompetencyModel, id: string) {
  const c = findCompetency(model, id)
  return c ? c.indicators.map((i) => i.levels['5']).join(' ') : ''
}

function addMonthsIso(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 10)
}

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
  const [expect, setExpect] = useState<Record<string, string>>(() =>
    Object.fromEntries(criteria.all.map((c) => [c, detail.partI.expectations[c] ?? defaultExpectation(model, c)])),
  )
  const [due, setDue] = useState(detail.partI.assessmentDue ?? addMonthsIso(DEMO_TODAY, afterNegative ? 6 : 24))
  const [errors, setErrors] = useState<FormError[]>([])
  const errorFor = (id: string) => errors.find((e) => e.id === id)?.message

  const validate = (): FormError[] => {
    const e: FormError[] = TOPICS.filter((t) => !t.optional && !topics[t.key]?.trim()).map((t) => ({
      id: topicId(t.key),
      message: `Wpisz notatkę do zagadnienia „${t.title}”`,
    }))
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
    if (await save()) act.mutate('CONFIRM_PART_I')
  }

  return (
    <form noValidate onSubmit={onSubmit} className={s.form}>
      <PartHeading roman="I">Kryteria oceny i termin sporządzenia oceny</PartHeading>
      <ErrorSummary errors={errors} />

      {confirmed && (
        <InlineAlert tone="info" title="Część I jest zatwierdzona">
          Oceniający zatwierdził ją {fmtDate(detail.partI.confirmedByEvaluatorOn)}, więc pola są tylko do odczytu. Zmiana jest możliwa
          tylko w trybie korekty błędów przez administratora.
        </InlineAlert>
      )}
      {afterNegative && (
        <InlineAlert tone="warning" title="Ponowna ocena po ocenie negatywnej">
          Rozmowę rozpoczynającą przeprowadza się w ciągu 7 dni od sporządzenia oceny (§7 pkt 2 rozp. 2016), a ocenę po 6 miesiącach od
          zapoznania (art. 81 ust. 9 ustawy).
        </InlineAlert>
      )}

      <PartSection title="Nazwa urzędu i dane" hint="Uzupełnione automatycznie z teczki. Nie można ich tu zmienić.">
        <InfoList>
          <InfoRow label="Nazwa urzędu" value={detail.officeName} />
        </InfoList>
        <div className={s.people}>
          <Person title="Dane ocenianego" p={detail.person} />
          <Person title="Dane oceniającego" p={detail.evaluator} />
        </div>
      </PartSection>

      <PartSection title="Kryteria oceny" hint="Ustalone w kroku „Proponowany formularz”.">
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
        hint="Domyślnie opis poziomu „na poziomie oczekiwań” z modelu kompetencji. Dostosuj go do stanowiska: to punkt odniesienia przy ocenie."
      >
        <div className={s.fields}>
          {criteria.all.map((c) => (
            <Field
              key={c}
              id={expectId(c)}
              label={
                <>
                  {competencyName(model, c)}{' '}
                  <span className={`${layout.tag} ${criteria.additional.includes(c) ? layout.tagAccent : ''}`}>
                    {criteria.additional.includes(c) ? 'dodatkowe' : 'obowiązkowe'}
                  </span>
                </>
              }
            >
              {(p) => (
                <TextArea {...p} rows={3} readOnly={!editable} value={expect[c] ?? ''} onChange={(e) => setExpect((v) => ({ ...v, [c]: e.target.value }))} />
              )}
            </Field>
          ))}
        </div>
      </PartSection>

      <Field
        id={DUE_ID}
        label="Termin sporządzenia oceny"
        hint={`Domyślnie ${afterNegative ? '6 miesięcy (art. 81 ust. 9 ustawy)' : '24 miesiące (art. 81 ust. 1 ustawy)'}. Po zatwierdzeniu części I zmiana tylko w trybie zmiany terminu.`}
        error={errorFor(DUE_ID)}
      >
        {(p) => <TextInput {...p} type="date" width={20} readOnly={!editable} value={due} onChange={(e) => setDue(e.target.value)} />}
      </Field>

      <PartSection title="Potwierdzenie części I" hint="Oceniający i oceniany potwierdzają rozmowę oraz zapoznanie z kryteriami i terminem oceny.">
        <InfoList>
          <InfoRow label="Oceniający potwierdza przeprowadzenie rozmowy i ustalenia" value={confirmed ? fmtDate(detail.partI.confirmedByEvaluatorOn) : 'Nie potwierdzono'} />
          <InfoRow
            label="Oceniany potwierdza zapoznanie z kryteriami i terminem (od tej daty biegnie okres oceny)"
            value={acked ? fmtDate(detail.partI.acknowledgedByEmployeeOn) : 'Nie potwierdzono'}
          />
        </InfoList>
        {!confirmed && editable && (
          <div className={s.inlineActions}>
            <Button variant="secondary" loading={act.isPending} disabled={patch.isPending || !allows(detail, 'CONFIRM_PART_I')} onClick={confirm}>
              Zatwierdź część I
            </Button>
            <p className={layout.muted}>Zatwierdzenie zapisuje część I i blokuje kryteria oraz termin oceny.</p>
          </div>
        )}
        {confirmed && !acked && (
          <div className={s.inlineActions}>
            <Button variant="secondary" loading={act.isPending} disabled={!allows(detail, 'EMPLOYEE_ACK_PART_I')} onClick={() => act.mutate('EMPLOYEE_ACK_PART_I')}>
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
