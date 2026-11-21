import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client'
import type { Person } from '../api/cases'
import { getPerson, updatePerson, type HistoryItem, type PersonOsp, type PersonProfile, type UpdatePerson } from '../api/people'
import { ErrorState, LoadingState } from '../components/QueryState'
import {
  Accordion,
  BackLink,
  Button,
  ButtonLink,
  Card,
  Dialog,
  EmptyState,
  ErrorSummary,
  Field,
  InfoList,
  InfoRow,
  InlineAlert,
  PageLayout,
  Select,
  StatusBadge,
  TextInput,
  type FormError,
} from '../components/ui'
import { fmtDate } from '../lib/format'
import { assessmentAction, EMPLOYMENT_LABEL, lastCompleted, RESULT_LABEL } from '../lib/people'
import { caseUrl } from '../lib/stages'
import { HOME_BY_ROLE, useMe } from '../lib/useAuth'
import s from './PersonPage.module.css'

/** Employee profile: data with the supervisor, job description (collapsed) and assessment history in one column, with one button to the right assessment. */
export function PersonPage() {
  const { personId = '' } = useParams()
  const me = useMe()
  const q = useQuery({ queryKey: ['person', personId], queryFn: ({ signal }) => getPerson(personId, signal) })
  const back = <BackLink to={HOME_BY_ROLE[me.role]}>Mój zespół</BackLink>

  if (q.isPending) return <PageLayout back={back}><LoadingState /></PageLayout>
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) {
      return (
        <PageLayout back={back}>
          <EmptyState as="h1" title="Nie znaleziono pracownika">
            Tego pracownika nie ma w Twoim zespole albo adres jest nieaktualny. Wróć do listy zespołu i wybierz osobę jeszcze raz.
          </EmptyState>
        </PageLayout>
      )
    }
    return <PageLayout back={back}><ErrorState error={q.error} what="profil pracownika" onRetry={() => q.refetch()} /></PageLayout>
  }

  const profile = q.data
  const { person, supervisor } = profile
  const name = `${person.firstName} ${person.lastName}`

  return (
    <PageLayout
      back={back}
      title={`${person.firstName} ${person.lastName}`}
      meta={person.position}
      actions={<AssessmentButton profile={profile} />}
    >
      <LastAssessment history={profile.history} />

      <div className={s.sections}>
        <Card title="O pracowniku" as="h2">
          <InfoList>
            <InfoRow label="Komórka organizacyjna" value={person.unit} />
            <InfoRow label="Stanowisko" value={person.position} />
            <InfoRow label="Status" value={EMPLOYMENT_LABEL[person.employment]} />
            <InfoRow label="Data zatrudnienia" value={fmtDate(person.hiredOn)} />
            <InfoRow
              label="Przełożony"
              value={
                supervisor ? (
                  <>
                    {supervisor.firstName} {supervisor.lastName}
                    <span className={s.supervisorPosition}>{supervisor.position}</span>
                  </>
                ) : (
                  'Brak danych'
                )
              }
            />
          </InfoList>
          <EditPerson person={person} name={name} />
        </Card>
        <Accordion
          items={[
            {
              title: (
                <span className={s.ospHead}>
                  <span className="h-sub">Opis stanowiska</span>
                  {profile.osp && <span className={s.ospHeadTitle}>{profile.osp.title}</span>}
                </span>
              ),
              content: <JobDescription osp={profile.osp} />,
            },
          ]}
        />
        <Card title="Historia ocen" as="h2">
          <HistoryTable history={profile.history} name={name} />
        </Card>
      </div>
    </PageLayout>
  )
}

function JobDescription({ osp }: { osp: PersonOsp | null }) {
  if (!osp) return <p>Brak opisu stanowiska w systemie</p>
  return (
    <div className={s.osp}>
      <p>{osp.purpose}</p>
      <h3 className="h-sub">Zadania pracownika</h3>
      <ul className="bullets">
        {osp.mainTasks.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  )
}

const EMPLOYMENT_OPTIONS = Object.entries(EMPLOYMENT_LABEL).map(([value, label]) => ({ value, label }))
const todayIso = () => new Date().toLocaleDateString('sv-SE')
const editable = ({ position, unit, employment, hiredOn }: Person): UpdatePerson => ({ position, unit, employment, hiredOn })

/** "Edytuj informacje o pracowniku": position, unit, employment and hiring date in a dialog. */
function EditPerson({ person, name }: { person: Person; name: string }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(() => editable(person))
  const [errors, setErrors] = useState<FormError[]>([])
  const save = useMutation({
    mutationFn: (data: UpdatePerson) => updatePerson(person.id, data),
    onSuccess: (profile) => {
      qc.setQueryData(['person', person.id], profile)
      qc.invalidateQueries({ queryKey: ['person', person.id] })
      qc.invalidateQueries({ queryKey: ['case'] })
      setOpen(false)
    },
    onError: (err) => setErrors([{ id: 'person-position', message: err.message }]),
  })
  const set = (key: keyof UpdatePerson) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  const errorOf = (id: string) => errors.find((e) => e.id === id)?.message

  const start = () => {
    setForm(editable(person))
    setErrors([])
    setOpen(true)
  }
  const submit = () => {
    const next: FormError[] = []
    if (!form.position.trim()) next.push({ id: 'person-position', message: 'Podaj stanowisko.' })
    if (!form.unit.trim()) next.push({ id: 'person-unit', message: 'Podaj komórkę organizacyjną.' })
    if (!form.hiredOn) next.push({ id: 'person-hired', message: 'Podaj datę zatrudnienia.' })
    else if (form.hiredOn > todayIso()) next.push({ id: 'person-hired', message: 'Data zatrudnienia nie może być z przyszłości.' })
    setErrors(next)
    if (next.length === 0) save.mutate(form)
  }

  return (
    <>
      <div className={s.edit}>
        <Button variant="text" onClick={start}>
          Edytuj informacje o pracowniku
        </Button>
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Edytuj informacje: ${name}`}
        actions={
          <>
            <Button type="button" variant="text" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button type="button" onClick={submit} loading={save.isPending}>
              Zapisz
            </Button>
          </>
        }
      >
        <div className={s.form}>
          <ErrorSummary errors={errors} />
          <Field label="Stanowisko" id="person-position" error={errorOf('person-position')}>
            {(c) => <TextInput {...c} value={form.position} onChange={set('position')} />}
          </Field>
          <Field label="Komórka organizacyjna" id="person-unit" error={errorOf('person-unit')}>
            {(c) => <TextInput {...c} value={form.unit} onChange={set('unit')} />}
          </Field>
          <Field label="Status zatrudnienia" id="person-employment">
            {(c) => <Select {...c} options={EMPLOYMENT_OPTIONS} value={form.employment} onChange={set('employment')} />}
          </Field>
          <Field label="Data zatrudnienia" id="person-hired" error={errorOf('person-hired')}>
            {(c) => <TextInput {...c} type="date" width={10} max={todayIso()} value={form.hiredOn} onChange={set('hiredOn')} />}
          </Field>
        </div>
      </Dialog>
    </>
  )
}

function AssessmentButton({ profile }: { profile: PersonProfile }) {
  const label = assessmentAction(profile)
  const current = profile.currentCase
  if (current) {
    return (
      <ButtonLink variant="primary" to={caseUrl(current.id, current.currentStage)} className={s.action}>
        {label}
      </ButtonLink>
    )
  }
  // Creating a new case is a separate task: the button is visible but inactive for now.
  return (
    <div className={s.action}>
      <Button variant="primary" disabled aria-describedby="person-action-hint">
        {label}
      </Button>
      <p id="person-action-hint" className={s.hint}>Wkrótce</p>
    </div>
  )
}

function LastAssessment({ history }: { history: HistoryItem[] }) {
  const last = lastCompleted(history)
  if (last) {
    return (
      <InlineAlert tone={last.result === 'POSITIVE' ? 'success' : 'warning'} title={`Ostatnia ocena: ${RESULT_LABEL[last.result].toLowerCase()}`}>
        Podpisana {fmtDate(last.signedByEvaluatorOn)}, zaakceptowana przez ocenianego {fmtDate(last.acknowledgedOn)}.
      </InlineAlert>
    )
  }
  const external = history.find((h) => h.source === 'EXTERNAL')
  if (external?.result) {
    return (
      <InlineAlert tone="info" title={`Ostatnia ocena: ${RESULT_LABEL[external.result].toLowerCase()}`}>
        Z dnia {fmtDate(external.date)}, sporządzona poza systemem. Brak zakończonych ocen w systemie.
      </InlineAlert>
    )
  }
  return <InlineAlert tone="info" title="Brak zakończonych ocen" />
}

const kindOf = (h: HistoryItem) => (h.source === 'EXTERNAL' || h.path === 'PERIODIC' ? 'Ocena okresowa' : 'Pierwsza ocena')

function ResultBadge({ h }: { h: HistoryItem }) {
  if (h.result) return <StatusBadge tone={h.result === 'POSITIVE' ? 'success' : 'error'}>{RESULT_LABEL[h.result]}</StatusBadge>
  if (h.source === 'SYSTEM') return <StatusBadge tone="info">W toku</StatusBadge>
  return <span className="faint">—</span>
}

function HistoryTable({ history, name }: { history: HistoryItem[]; name: string }) {
  if (history.length === 0) return <p>Brak ocen w systemie.</p>
  return (
    <div className={s.tableWrap}>
      <table className={`table ${s.table}`}>
        <caption className="visually-hidden">Historia ocen: {name}, od najnowszej</caption>
        <thead>
          <tr>
            <th scope="col">Rodzaj</th>
            <th scope="col" className={s.wide}>Okres / cykl</th>
            <th scope="col">Wynik</th>
            <th scope="col" className={s.wide}>Poziom</th>
            <th scope="col" className={s.wide}>Podpisano</th>
            <th scope="col" className={s.wide}>Zaakceptowano</th>
            <th scope="col"><span className="visually-hidden">Arkusz</span></th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => {
            const cycle = h.source === 'SYSTEM' ? h.cycleLabel : h.date ? `Ocena z ${fmtDate(h.date)}` : '—'
            const signed = h.source === 'SYSTEM' ? fmtDate(h.signedByEvaluatorOn) : '—'
            const acked = h.source === 'SYSTEM' ? fmtDate(h.acknowledgedOn) : '—'
            return (
              <tr key={h.source === 'SYSTEM' ? h.caseId : 'external'}>
                <th scope="row" className={s.kind}>
                  <span>{kindOf(h)}</span>
                  {h.source === 'EXTERNAL' && <span className={s.meta}>spoza systemu</span>}
                  {/* Below 600px the hidden columns are listed here, under the name. */}
                  <span className={s.narrow}>
                    <span className={s.meta}>{cycle}</span>
                    {h.level && <span className={s.meta}>Poziom: {h.level}</span>}
                    {h.source === 'SYSTEM' && (
                      <span className={s.meta}>Podpisano {signed} · zaakceptowano {acked}</span>
                    )}
                  </span>
                </th>
                <td className={s.wide}>{cycle}</td>
                <td><ResultBadge h={h} /></td>
                <td className={s.wide}>{h.level ?? '—'}</td>
                <td className={`${s.wide} num`}>{signed}</td>
                <td className={`${s.wide} num`}>{acked}</td>
                <td className="cell-action">
                  {h.source === 'SYSTEM' && (
                    <Link to={`/teczka/${h.caseId}/arkusz`} className="btn btn--sm" aria-label={`Zobacz arkusz: ${kindOf(h).toLowerCase()}, ${h.cycleLabel}`}>
                      <FileText size={14} aria-hidden="true" />
                      Zobacz arkusz
                    </Link>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
