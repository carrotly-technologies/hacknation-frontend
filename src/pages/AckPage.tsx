import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Compass } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router'
import { confirmAck, getAck, type AckDone, type AckPending } from '../api/ack'
import { ApiError, errorMessage } from '../api/client'
import { LoadingState } from '../components/QueryState'
import { Button, Checkbox, ErrorSummary, InlineAlert, type FormError } from '../components/ui'
import { fmtDate } from '../lib/format'
import { caseCriteria } from '../lib/model'
import { SheetDocument } from '../sheet/SheetDocument'
import s from './AckPage.module.css'

const CONFIRM_ID = 'ack-confirm'
/** Wording of the periodic sheet templates (rozp. PRM z 4.04.2016, część II); the API sends it as employeeAcknowledgement. */
const PERIODIC_CONFIRMATION =
  'Przeprowadzono ze mną rozmowę oceniającą oraz zapoznałem(-łam) się z oceną okresową i wnioskami dotyczącymi indywidualnego programu rozwoju zawodowego.'
const FIRST_CONFIRMATION = 'Zapoznałam(-łem) się z pierwszą oceną.'

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
    body = <Done done={q.data} justNow={confirm.isSuccess} />
  } else {
    body = <Pending data={q.data} onConfirm={() => confirm.mutate()} pending={confirm.isPending} error={confirm.error} />
  }

  return (
    <main className={s.root} id="main">
      <div className={s.inner}>
        <div className={s.brand}>
          <Compass size={24} strokeWidth={1.75} aria-hidden="true" />
          <span>Kompas Kompetencji</span>
        </div>
        {body}
      </div>
    </main>
  )
}

function Done({ done, justNow }: { done: AckDone; justNow: boolean }) {
  const date = fmtDate(done.acknowledgedOn)
  const objection = done.objectionDeadline
  return (
    <InlineAlert tone="success" live title={justNow ? `Dziękujemy. Potwierdzono zapoznanie ${date}.` : `Potwierdzono zapoznanie z oceną ${date}.`}>
      {objection && (
        <p>
          Od tego dnia masz 7 dni na wniesienie sprzeciwu do dyrektora generalnego urzędu
          {objection.date ? ` (do ${fmtDate(objection.date)})` : ''}.
        </p>
      )}
      {!justNow && <p>Link nie wymaga już żadnej czynności.</p>}
    </InlineAlert>
  )
}

function Pending({ data, onConfirm, pending, error }: { data: AckPending; onConfirm: () => void; pending: boolean; error: unknown }) {
  const [checked, setChecked] = useState(false)
  const [errors, setErrors] = useState<FormError[]>([])
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

      <div className="paper-preview" aria-label="Arkusz oceny (tylko do odczytu)">
        <SheetDocument detail={detail} model={model} criteria={criteria} />
      </div>

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
        <div>
          <Button type="submit" loading={pending}>
            Potwierdzam zapoznanie
          </Button>
        </div>
      </form>
    </>
  )
}
