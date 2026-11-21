import { Check } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Stepper } from '../../components/ui'
import { caseUrl } from '../../lib/stages'
import type { StageProps } from '../CasePage'
import { SheetPartI } from './SheetPartI'
import { SheetPartII } from './SheetPartII'
import { SheetPartIII } from './SheetPartIII'
import { StageLayout } from './StageLayout'
import s from './SheetWizard.module.css'

/** The three parts of the periodic assessment sheet (A, B, C), as in "Podgląd arkusza". */
const SHEET_PARTS = [
  { roman: 'I', name: 'Kryteria oceny i termin' },
  { roman: 'II', name: 'Ocena okresowa' },
  { roman: 'III', name: 'Wniosek o kolejny stopień służbowy' },
] as const

const TOTAL = SHEET_PARTS.length

function readPart(raw: string | null): number | null {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 && n <= TOTAL ? n : null
}

/**
 * "Formularz oceny": the supervisor fills in the assessment sheet part by part (I → II → III). The current
 * part lives in the URL (`?czesc=1|2|3`), so a refresh keeps the user where they were. Each part saves itself
 * on "Dalej"; what the backend does not allow to edit yet is shown read only with a note on when it opens.
 */
export function SheetWizard(props: StageProps) {
  const { detail, stage } = props
  const info = detail.stages.find((x) => x.id === stage)!
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const part = readPart(params.get('czesc')) ?? 1

  useEffect(() => {
    if (readPart(params.get('czesc')) === null) {
      setParams((p) => { p.set('czesc', '1'); return p }, { replace: true })
    }
  }, [params, setParams])

  const goTo = (n: number) => {
    setParams((p) => { p.set('czesc', String(n)); return p })
    document.querySelector('.case-work')?.scrollTo({ top: 0 })
  }

  // After part III: the stage the case is at now when it is further on, otherwise the next stage of the file.
  const finish = () => {
    const ids = detail.stages.map((x) => x.id)
    const here = ids.indexOf(stage)
    const current = ids.indexOf(detail.currentStage)
    const target = current > here ? detail.currentStage : ids[here + 1]
    if (target) navigate(caseUrl(detail.id, target))
  }

  const title = `Ocena okresowa pracownika – ${detail.sheetId ? `Arkusz ${detail.sheetId}` : 'arkusz nieustalony'}`

  return (
    <StageLayout info={info} title={title}>
      <div className={s.progress}>
        <Stepper unit="Część" current={part} total={TOTAL} name={SHEET_PARTS[part - 1].name} />
        <ol className={s.parts} aria-label="Części arkusza">
          {SHEET_PARTS.map((p, i) => {
            const n = i + 1
            const state = n < part ? 'done' : n === part ? 'current' : 'todo'
            return (
              <li key={p.roman} className={`${s.part} ${s[state]}`} aria-current={n === part ? 'step' : undefined}>
                <span className={s.partMark} aria-hidden="true">
                  {state === 'done' ? <Check size={14} strokeWidth={3} /> : p.roman}
                </span>
                <span className={s.partName}>
                  <span className="visually-hidden">Część {p.roman}: </span>
                  {p.name}
                  {state === 'done' && <span className="visually-hidden"> (za Tobą)</span>}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      {part === 1 && <SheetPartI {...props} onNext={() => goTo(2)} />}
      {part === 2 && <SheetPartII {...props} onBack={() => goTo(1)} onNext={() => goTo(3)} />}
      {part === 3 && <SheetPartIII {...props} onBack={() => goTo(2)} onNext={finish} />}
    </StageLayout>
  )
}
