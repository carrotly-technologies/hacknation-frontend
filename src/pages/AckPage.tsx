import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router'
import { confirmAck, getAck, OBJECTION_MAX_LENGTH, submitObjection, type AckDone, type AckPending, type Objection } from '../api/ack'
import { ApiError, errorMessage } from '../api/client'
import { LoadingState } from '../components/QueryState'
import { Button, Checkbox, Dialog, ErrorSummary, Field, InlineAlert, TextArea, type FormError } from '../components/ui'
import { fmtDate } from '../lib/format'
import { caseCriteria } from '../lib/model'
import { SheetDocument } from '../sheet/SheetDocument'
import { ActivityNotice } from '../components/ActivityNotice'
import { BrandMark } from '../components/BrandMark'
import s from './AckPage.module.css'

const CONFIRM_ID = 'ack-confirm'
/** Wording of the periodic sheet templates (rozp. PRM z 4.04.2016, część II); the API sends it as employeeAcknowledgement. */
const PERIODIC_CONFIRMATION =
  'Przeprowadzono ze mną rozmowę oceniającą oraz zapoznałem(-łam) się z oceną okresową i wnioskami dotyczącymi indywidualnego programu rozwoju zawodowego.'
const FIRST_CONFIRMATION = 'Zapoznałam(-łem) się z pierwszą oceną.'
/** Before the acknowledgement. Source: art. 83 ust. 1 ustawy o służbie cywilnej (the term itself comes from the API). */
const OBJECTION_FIRST_ACK =
  'Aby złożyć zastrzeżenia, najpierw potwierdź zapoznanie z oceną. Potwierdzenie nie oznacza zgody z oceną. Od dnia zapoznania masz 7 dni na wniesienie sprzeciwu do dyrektora generalnego urzędu (art. 83 ust. 1 ustawy o służbie cywilnej).'
const OBJECTION_TEXT_ID = 'objection-text'
const OBJECTION_CONFIRM_ID = 'objection-confirm'

/**
 * Public page of the assessed person (/zapoznanie/:token, outside the app shell, no sign-in): the signed sheet read
 * only, the notice and the confirmation. The token from the link is the only key (GET/POST /api/ack/:token).
 */
export function AckPage() {
  const { token = '' } = useParams()
  const qc = useQueryClient()
  const key = ['ack', token]
  const q = useQuery({ queryKey: key, queryFn: ({ signal }) => getAck(token, signal), retry: false, staleTime: Infinity })
  const confirm = useMutation({
    mutationFn: () => confirmAck(token),
    onSuccess: (done) => qc.setQueryData(key, done),
  })
  const object = useMutation({
    mutationFn: (text: string) => submitObjection(token, text),
    onSuccess: (done) => qc.setQueryData(key, done),
  })

  useEffect(() => {
    const prev = document.title
    document.title = 'Zapoznanie z oceną — Kompas Kompetencji'
    return () => {
      document.title = prev
    }
  }, [])

  let body
  if (q.isPending) body = <LoadingState />
  else if (q.isError) {
    body =
      q.error instanceof ApiError && q.error.status === 404 ? (
        <InlineAlert tone="error" title="Link jest nieważny. Poproś przełożonego o nowy." />
      ) : (
        <InlineAlert tone="error" title="Nie udało się otworzyć oceny">
          <p>{errorMessage(q.error)} Spróbuj ponownie za chwilę.</p>
        </InlineAlert>
      )
  } else if (!('case' in q.data)) {
    body = (
      <>
        <Done done={q.data} justNow={confirm.isSuccess} />
        <ObjectionSection
          done={q.data}
          justNow={object.isSuccess}
          onSubmit={(text) => object.mutate(text)}
          pending={object.isPending}
          error={object.error}
        />
      </>
    )
  } else {
    body = <Pending data={q.data} onConfirm={() => confirm.mutate()} pending={confirm.isPending} error={confirm.error} />
  }

  return (
    <main className={s.root} id="main">
      <div className={s.inner}>
        <div className={s.brand}>
          <BrandMark />
          <span>Kompas Kompetencji</span>
        </div>
        {body}
        <ActivityNotice />
      </div>
    </main>
  )
}

function Done({ done, justNow }: { done: AckDone; justNow: boolean }) {
  const date = fmtDate(done.acknowledgedOn)
  return (
    <InlineAlert tone="success" live title={justNow ? `Dziękujemy. Potwierdzono zapoznanie ${date}.` : `Potwierdzono zapoznanie z oceną ${date}.`}>
      {done.objectionDeadline ? (
        <p>Potwierdzenie zapoznania nie oznacza zgody z oceną.</p>
      ) : (
        !justNow && <p>Link nie wymaga już żadnej czynności.</p>
      )}
    </InlineAlert>
  )
}

/** Objection after the acknowledgement (periodic assessment only): the form, the filed text, or the closed term. */
function ObjectionSection({
  done,
  justNow,
  onSubmit,
  pending,
  error,
}: {
  done: AckDone
  justNow: boolean
  onSubmit: (text: string) => void
  pending: boolean
  error: unknown
}) {
  const deadline = done.objectionDeadline
  if (!deadline) return null
  if (done.objection) return <ObjectionFiled objection={done.objection} justNow={justNow} />
  if (!done.objectionOpen) {
    return <InlineAlert tone="warning" title={`Termin na sprzeciw minął ${fmtDate(deadline.date)}.`} />
  }
  return <ObjectionForm deadline={deadline.date} onSubmit={onSubmit} pending={pending} error={error} />
}

function ObjectionFiled({ objection, justNow }: { objection: Objection; justNow: boolean }) {
  return (
    <section className={s.card} aria-labelledby="objection-filed">
      <InlineAlert tone="success" live={justNow} title={`Zastrzeżenia zostały przekazane ${fmtDate(objection.submittedOn)}.`} />
      <h2 className={s.h2} id="objection-filed">
        Treść zastrzeżeń
      </h2>
      {/* user input: rendered as text, never as HTML */}
      <p className={s.objectionText}>{objection.text}</p>
    </section>
  )
}

function ObjectionForm({
  deadline,
  onSubmit,
  pending,
  error,
}: {
  deadline: string | null
  onSubmit: (text: string) => void
  pending: boolean
  error: unknown
}) {
  const [text, setText] = useState('')
  const [checked, setChecked] = useState(false)
  const [errors, setErrors] = useState<FormError[]>([])
  const [confirming, setConfirming] = useState(false)
  const errorFor = (id: string) => errors.find((e) => e.id === id)?.message

  const validate = (): FormError[] => {
    const out: FormError[] = []
    const trimmed = text.trim()
    if (!trimmed) out.push({ id: OBJECTION_TEXT_ID, message: 'Wpisz treść zastrzeżeń' })
    else if (trimmed.length > OBJECTION_MAX_LENGTH)
      out.push({ id: OBJECTION_TEXT_ID, message: `Treść zastrzeżeń może mieć najwyżej ${OBJECTION_MAX_LENGTH} znaków` })
    if (!checked) out.push({ id: OBJECTION_CONFIRM_ID, message: 'Zaznacz, że wnosisz sprzeciw od oceny' })
    return out
  }

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (found.length === 0) setConfirming(true)
  }

  return (
    <form className={s.card} noValidate onSubmit={onFormSubmit} aria-labelledby="objection-title">
      <h2 className={s.h2} id="objection-title">
        Zastrzeżenia do oceny
      </h2>
      {deadline && <p>Sprzeciw możesz wnieść do {fmtDate(deadline)}.</p>}
      <ErrorSummary errors={errors} />
      <Field
        id={OBJECTION_TEXT_ID}
        label="Treść zastrzeżeń"
        hint={`${text.length} / ${OBJECTION_MAX_LENGTH} znaków`}
        error={errorFor(OBJECTION_TEXT_ID)}
      >
        {(p) => (
          <TextArea
            {...p}
            rows={8}
            required
            maxLength={OBJECTION_MAX_LENGTH}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}
      </Field>
      <Checkbox
        id={OBJECTION_CONFIRM_ID}
        label="Wnoszę sprzeciw od oceny do dyrektora generalnego urzędu"
        required
        invalid={!!errorFor(OBJECTION_CONFIRM_ID)}
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
      {!!error && (
        <InlineAlert tone="error" live title="Nie udało się wysłać zastrzeżeń">
          <p>{errorMessage(error)}</p>
        </InlineAlert>
      )}
      <div>
        <Button type="submit" loading={pending}>
          Wyślij zastrzeżenia
        </Button>
      </div>
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Wysłać zastrzeżenia?"
        actions={
          <>
            <Button variant="text" onClick={() => setConfirming(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() => {
                setConfirming(false)
                onSubmit(text.trim())
              }}
            >
              Wyślij
            </Button>
          </>
        }
      >
        <p>Po wysłaniu nie można zmienić treści.</p>
      </Dialog>
    </form>
  )
}

function Pending({ data, onConfirm, pending, error }: { data: AckPending; onConfirm: () => void; pending: boolean; error: unknown }) {
  const [checked, setChecked] = useState(false)
  const [errors, setErrors] = useState<FormError[]>([])
  const [objectionInfo, setObjectionInfo] = useState(false)
  const detail = data.case
  const template = data.sheet?.template
  const isFirst = detail.path === 'FIRST'
  const label = isFirst ? FIRST_CONFIRMATION : (template?.employeeAcknowledgement ?? PERIODIC_CONFIRMATION)
  const criteria = caseCriteria(detail, data.sheet ? [data.sheet] : [])
  const model = { scale: data.scale, competencies: data.competencies }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!checked) {
      setErrors([{ id: CONFIRM_ID, message: 'Zaznacz potwierdzenie zapoznania z oceną' }])
      return
    }
    setErrors([])
    onConfirm()
  }

  return (
    <>
      <header>
        <h1 className={s.h1}>
          {isFirst ? 'Pierwsza ocena' : 'Ocena okresowa'} — {detail.person.firstName} {detail.person.lastName}
        </h1>
        <p className={s.lead}>
          Przeczytaj arkusz oceny przygotowany przez {detail.evaluator.firstName} {detail.evaluator.lastName}, a potem potwierdź zapoznanie
          na dole strony. Arkusza nie można tu zmienić.
        </p>
      </header>

      {template && (
        <InlineAlert tone="info" title="Pouczenie">
          <p>{template.objectionNotice}</p>
          {template.objectionNoticeNote && <p>{template.objectionNoticeNote}</p>}
        </InlineAlert>
      )}

      <section className="paper-preview" aria-label="Arkusz oceny (tylko do odczytu)">
        <SheetDocument detail={detail} model={model} criteria={criteria} />
      </section>

      <form className={s.card} noValidate onSubmit={onSubmit}>
        <h2 className={s.h2}>Potwierdzenie zapoznania</h2>
        <ErrorSummary errors={errors} />
        <Checkbox
          id={CONFIRM_ID}
          label={label}
          required
          invalid={errors.length > 0}
          checked={checked}
          onChange={(e) => {
            setChecked(e.target.checked)
            if (e.target.checked) setErrors([])
          }}
        />
        <p className="muted">Link jest ważny do {fmtDate(data.expiresOn)}. Datą zapoznania będzie dzisiejsza data.</p>
        {!!error && (
          <InlineAlert tone="error" live title="Nie udało się potwierdzić">
            <p>{errorMessage(error)}</p>
          </InlineAlert>
        )}
        {objectionInfo && (
          <InlineAlert tone="info" live>
            <p>{OBJECTION_FIRST_ACK}</p>
          </InlineAlert>
        )}
        <div className={s.actions}>
          <Button type="submit" loading={pending}>
            Potwierdzam zapoznanie
          </Button>
          {!isFirst && (
            <Button type="button" variant="secondary" onClick={() => setObjectionInfo(true)}>
              Mam zastrzeżenia do oceny
            </Button>
          )}
        </div>
      </form>
    </>
  )
}
