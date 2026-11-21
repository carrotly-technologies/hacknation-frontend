import type { FormEvent } from 'react'
import { InfoList, InfoRow, InlineAlert } from '../../components/ui'
import type { StageProps } from '../CasePage'
import { PartHeading, WizardActions } from './SheetWizardCommon'
import layout from './StageLayout.module.css'
import s from './SheetWizard.module.css'

/**
 * Part III: the request for the next civil-service grade. The app does not file that request, so the part is
 * never attached; the reason follows the sheet preview (footnote 18 of the sheet template).
 */
export function SheetPartIII({ detail, onBack, onNext }: StageProps & { onBack: () => void; onNext: () => void }) {
  const urzednik = detail.person.employment === 'URZEDNIK'
  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault()
    onNext()
  }
  return (
    <form noValidate onSubmit={onSubmit} className={s.form}>
      <PartHeading roman="III">Wniosek o przyznanie kolejnego stopnia służbowego</PartHeading>
      <p className={layout.text}>
        Wniosek jest wypełniany i dołączany do arkusza oceny okresowej ocenianego tylko w sytuacji skorzystania przez oceniającego z możliwości
        przewidzianej w art. 89 ust. 1 ustawy z dnia 21 listopada 2008 r. o służbie cywilnej.
      </p>
      <InlineAlert tone="info" title="Część III nie jest dołączana">
        {urzednik ? 'Oceniający nie złożył wniosku o przyznanie kolejnego stopnia służbowego' : 'Oceniany jest pracownikiem służby cywilnej'} (przypis
        18 do wzoru arkusza).
      </InlineAlert>
      <InfoList>
        <InfoRow
          label="Czy do oceny okresowej dołączono wniosek o przyznanie kolejnego stopnia służbowego?"
          value={urzednik ? 'Nie' : 'Nie dotyczy (oceniany jest pracownikiem służby cywilnej)'}
        />
      </InfoList>
      <WizardActions onBack={onBack} />
    </form>
  )
}
