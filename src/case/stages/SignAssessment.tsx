import { useId, useState } from 'react'
import { useNavigate } from 'react-router'
import type { CaseDetail } from '../../api/cases'
import { Button, Dialog, InlineAlert } from '../../components/ui'
import { useCaseAction } from '../../lib/caseQueries'
import { fmtDate } from '../../lib/format'
import { officePlace } from '../../lib/office'
import { scrollPageToTop } from '../../lib/scrollPage'
import { allows, caseUrl } from '../../lib/stages'
import { StageError } from './StageLayout'

/** Why "Podpisz ocenę" is not active yet, or null when it is. The backend decides; this only explains it. */
function blockedReason(detail: CaseDetail, formalCheck: boolean): string | null {
  const checked = !formalCheck || detail.formalCheck.every((i) => i.ok)
  if (allows(detail, 'SIGN_ASSESSMENT') && checked) return null
  if (detail.path === 'PERIODIC' && !detail.assessmentTalkOn) return 'Dostępne po rozmowie oceniającej'
  if (!allows(detail, 'SIGN_ASSESSMENT')) return 'Dostępne po ocenie wszystkich kryteriów'
  return 'Dostępne po poprawieniu błędów kontroli formalnej'
}

/**
 * "Podpisz ocenę" with its confirmation dialog: the one signing control, in part II of the sheet and in
 * "Weryfikacja formularza". Signing is the assessment "na piśmie" (§11 rozp. PRM z 4.04.2016): only after the
 * assessment talk (§10), and the backend refuses it while the formal check fails. `beforeSign` saves text that is
 * still on screen, so the signature covers it; such a form passes `formalCheck={false}`, because unsaved text may
 * fix the check (the backend answers with the failing items). After signing it opens "Ocena końcowa"; a signed case
 * shows the evaluator's signature here.
 */
export function SignAssessment({
  detail,
  beforeSign,
  formalCheck = true,
}: {
  detail: CaseDetail
  beforeSign?: () => Promise<unknown>
  /** Inactive while the formal check of the saved case has errors. */
  formalCheck?: boolean
}) {
  // After signing the case moves on to "Ocena końcowa" and so does the screen, from the top (an explicit navigate:
  // signing in part II starts from the sheet wizard, not from the case's current stage). On an error it stays here.
  const sign = useCaseAction(detail.id, { follow: false })
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const hintId = useId()
  const signed = detail.signedByEvaluatorOn
  const evaluator = detail.evaluator

  if (signed) {
    return (
      <InlineAlert tone="success" live title="Data i podpis oceniającego">
        Podpisano elektronicznie: {evaluator.firstName} {evaluator.lastName}, {officePlace()}, {fmtDate(signed)}
      </InlineAlert>
    )
  }

  const reason = blockedReason(detail, formalCheck)
  const signNow = async () => {
    setConfirm(false)
    try {
      await beforeSign?.()
      const signedCase = await sign.mutateAsync('SIGN_ASSESSMENT')
      if (signedCase.stages.some((x) => x.id === 'DOCUMENT')) {
        navigate(caseUrl(detail.id, 'DOCUMENT'))
        scrollPageToTop()
      }
    } catch {
      // the error is shown under the button
    }
  }

  return (
    <div>
      <Button disabled={!!reason} loading={sign.isPending} aria-describedby={reason ? hintId : undefined} onClick={() => setConfirm(true)}>
        Podpisz ocenę
      </Button>
      {reason && (
        <p id={hintId} className="blocked-reason">
          {reason}
        </p>
      )}
      <StageError error={sign.error} />
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Podpisać ocenę?"
        actions={
          <>
            <Button variant="text" onClick={() => setConfirm(false)}>
              Anuluj
            </Button>
            <Button onClick={() => void signNow()}>Podpisz</Button>
          </>
        }
      >
        Po podpisaniu oceny nie można jej zmienić. Podpisać?
      </Dialog>
    </div>
  )
}
