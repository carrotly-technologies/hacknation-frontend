import { Copy, Link2 } from 'lucide-react'
import { useState } from 'react'
import type { CaseDetail } from '../../api/cases'
import { Button, Checkbox, Dialog, Field, InlineAlert, Snackbar, TextInput } from '../../components/ui'
import { useCaseAction } from '../../lib/caseQueries'
import { fmtDate } from '../../lib/format'
import { allows } from '../../lib/stages'
import { MutationError } from './common'
import layout from './StageLayout.module.css'

const LINK_ID = 'ack-link'

/**
 * Part II, "Zapoznanie ocenianego z oceną": after signing, the evaluator generates a link (SEND_FOR_ACK) and hands it
 * to the assessed person, who reads the sheet and confirms on the public page /zapoznanie/:token (AckPage).
 * The API returns the path only; the full address is built from this app's origin (the API may live on another one).
 */
export function AckLinkSection({ detail, label }: { detail: CaseDetail; label: string }) {
  const act = useCaseAction(detail.id, { follow: false })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const signed = !!detail.signedByEvaluatorOn
  const acked = detail.acknowledgedOn
  const link = detail.ackLink ? `${window.location.origin}${detail.ackLink}` : null

  if (acked) {
    return (
      <Checkbox
        id="employee-acknowledgement"
        label={label}
        hint={`Potwierdzono ${fmtDate(acked)}, ${detail.person.firstName} ${detail.person.lastName}`}
        checked
        disabled
        readOnly
      />
    )
  }

  const generate = () => {
    setConfirmOpen(false)
    act.mutate('SEND_FOR_ACK')
  }

  const copy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopyError(false)
      setCopied(true)
    } catch {
      setCopyError(true)
    }
  }

  return (
    <>
      <p className={layout.muted}>
        Oceniany zapoznaje się z oceną przez link: otwiera arkusz tylko do odczytu i potwierdza zapoznanie. Od dnia
        potwierdzenia biegnie termin na sprzeciw.
      </p>
      {link ? (
        <>
          <Field id={LINK_ID} label="Link dla ocenianego" hint={`Link jest ważny 14 dni (do ${fmtDate(detail.ackLinkExpiresOn ?? null)}). Przekaż go ocenianemu.`}>
            {(p) => <TextInput {...p} readOnly value={link} onFocus={(e) => e.currentTarget.select()} />}
          </Field>
          <div className={layout.actions}>
            <Button type="button" icon={<Copy size={16} aria-hidden="true" />} onClick={copy}>
              Kopiuj link
            </Button>
            <Button type="button" variant="secondary" loading={act.isPending} onClick={() => setConfirmOpen(true)}>
              Wygeneruj nowy link
            </Button>
          </div>
          {copyError && (
            <InlineAlert tone="warning" live>
              Nie udało się skopiować automatycznie. Zaznacz link w polu powyżej i skopiuj go ręcznie (Ctrl+C).
            </InlineAlert>
          )}
        </>
      ) : (
        <div className={layout.actions}>
          <Button
            type="button"
            icon={<Link2 size={16} aria-hidden="true" />}
            disabled={!signed || !allows(detail, 'SEND_FOR_ACK')}
            aria-describedby={!signed ? 'ack-link-hint' : undefined}
            loading={act.isPending}
            onClick={generate}
          >
            Wygeneruj link dla ocenianego
          </Button>
          {!signed && (
            <span id="ack-link-hint" className={layout.muted}>
              Dostępne po podpisaniu oceny
            </span>
          )}
        </div>
      )}
      <Checkbox id="employee-acknowledgement" label={label} hint="Jeszcze nie: oceniany potwierdza zapoznanie przez link" checked={false} disabled readOnly />
      <MutationError error={act.error} />
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Wygenerować nowy link?"
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>
              Anuluj
            </Button>
            <Button type="button" onClick={generate}>
              Wygeneruj nowy link
            </Button>
          </>
        }
      >
        <p>Poprzedni link przestanie działać. Przekaż ocenianemu nowy link.</p>
      </Dialog>
      <Snackbar open={copied} message="Skopiowano" onClose={() => setCopied(false)} />
    </>
  )
}
