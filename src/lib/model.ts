import { useQuery } from '@tanstack/react-query'
import type { CaseDetail } from '../api/cases'
import { getCivilServiceGrades, getCompetencyModel, getSheets, type Competency, type CompetencyModel, type Sheet } from '../api/kompas'
import { sentenceCase } from './format'

export function useModel() {
  return useQuery({
    queryKey: ['competency-model'],
    queryFn: ({ signal }) => getCompetencyModel(signal),
    staleTime: Infinity,
  })
}

export function useSheets() {
  return useQuery({
    queryKey: ['sheets'],
    queryFn: ({ signal }) => getSheets(signal),
    staleTime: Infinity,
  })
}

export function useCivilServiceGrades() {
  return useQuery({
    queryKey: ['civil-service-grades'],
    queryFn: ({ signal }) => getCivilServiceGrades(signal),
    staleTime: Infinity,
  })
}

/** The part of the competency model a sheet needs (the public page of the assessed person gets only this). */
export type ModelNames = { scale: CompetencyModel['scale']; competencies: Pick<Competency, 'id' | 'name'>[] }

export function competencyName(model: ModelNames | undefined, id: string): string {
  const c = model?.competencies.find((x) => x.id === id)
  return c ? sentenceCase(c.name) : id
}

export function findCompetency(model: CompetencyModel | undefined, id: string): Competency | undefined {
  return model?.competencies.find((x) => x.id === id)
}

export interface CaseCriteria {
  sheet: Sheet | undefined
  mandatory: string[]
  additional: string[]
  all: string[]
  scale: number[]
}

/** Criteria assessed in this case: mandatory for the sheet + additional from part I. */
export function caseCriteria(
  detail: Pick<CaseDetail, 'path' | 'sheetId'> & { partI: Pick<CaseDetail['partI'], 'additionalCriteria'> },
  sheets: Sheet[] | undefined,
): CaseCriteria {
  const sheetId = detail.path === 'FIRST' ? 'FIRST' : detail.sheetId
  const sheet = sheets?.find((s) => s.id === sheetId)
  const mandatory = sheet?.mandatoryCriteria ?? []
  const additional = detail.path === 'FIRST' ? [] : detail.partI.additionalCriteria
  return {
    sheet,
    mandatory,
    additional,
    all: [...mandatory, ...additional],
    scale: sheet?.scale ?? (detail.path === 'FIRST' ? [3, 5, 7] : [1, 3, 5, 7, 9]),
  }
}
