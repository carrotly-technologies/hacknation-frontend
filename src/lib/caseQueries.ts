import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import {
  addObservation,
  getCase,
  patchCase,
  runCaseAction,
  type CaseAction,
  type CaseDetail,
  type CasePatch,
  type Observation,
} from '../api/cases'
import { caseUrl, viewStage } from './stages'

export const caseKey = (id: string) => ['case', id] as const

export function useCase(id: string) {
  return useQuery({
    queryKey: caseKey(id),
    queryFn: ({ signal }) => getCase(id, signal),
  })
}

function mergeNullable<T>(prev: Record<string, T>, patch: Record<string, T | null> | undefined): Record<string, T> {
  if (!patch) return prev
  const next = { ...prev }
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete next[k]
    else next[k] = v
  }
  return next
}

function applyPatch(prev: CaseDetail, patch: CasePatch): CaseDetail {
  return {
    ...prev,
    ...(patch.sheetId ? { sheetId: patch.sheetId } : {}),
    partI: patch.partI ? { ...prev.partI, ...patch.partI, topics: { ...prev.partI.topics, ...(patch.partI.topics ?? {}) } } : prev.partI,
    ratings: patch.ratings
      ? Object.fromEntries(
          Object.keys({ ...prev.ratings, ...patch.ratings }).map((k) => [k, { ...prev.ratings[k], ...patch.ratings?.[k] }]),
        )
      : prev.ratings,
    decisions: mergeNullable(prev.decisions, patch.decisions),
    deviationNotes: mergeNullable(prev.deviationNotes, patch.deviationNotes),
    justification: patch.justification ?? prev.justification,
    iprz: patch.iprz ?? prev.iprz,
    previousAssessment:
      patch.previousAssessment === undefined
        ? prev.previousAssessment
        : patch.previousAssessment === null
          ? null
          : { result: null, level: null, date: null, ...prev.previousAssessment, ...patch.previousAssessment },
    promotionRequest: patch.promotionRequest ? { ...prev.promotionRequest, ...patch.promotionRequest } : prev.promotionRequest,
    firstConditions:
      patch.firstConditions && prev.firstConditions
        ? { ...prev.firstConditions, ...patch.firstConditions }
        : prev.firstConditions,
  }
}

/** PATCH with optimistic update; the server response replaces the cache. */
export function usePatchCase(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: CasePatch) => patchCase(id, patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: caseKey(id) })
      const prev = qc.getQueryData<CaseDetail>(caseKey(id))
      if (prev) qc.setQueryData(caseKey(id), applyPatch(prev, patch))
      return { prev }
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.prev) qc.setQueryData(caseKey(id), ctx.prev)
    },
    onSuccess: (data) => {
      qc.setQueryData(caseKey(id), data)
      qc.invalidateQueries({ queryKey: ['team'] })
      qc.invalidateQueries({ queryKey: ['hr'] })
    },
  })
}

/** Runs a workflow action; when the case moves to another stage, the view follows it. */
export function useCaseAction(id: string) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (action: CaseAction) => runCaseAction(id, action),
    onSuccess: (data) => {
      const prev = qc.getQueryData<CaseDetail>(caseKey(id))
      qc.setQueryData(caseKey(id), data)
      // Only when the new stage has its own view: e.g. OPENING_TALK → OBSERVATION stays in the sheet wizard (?czesc=…).
      if (prev && viewStage(data.stages, prev.currentStage) !== viewStage(data.stages, data.currentStage)) {
        navigate(caseUrl(id, viewStage(data.stages, data.currentStage)))
      }
      qc.invalidateQueries({ queryKey: ['team'] })
      qc.invalidateQueries({ queryKey: ['hr'] })
    },
  })
}

export function useAddObservation(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (o: Omit<Observation, 'id'>) => addObservation(id, o),
    onSuccess: (data) => qc.setQueryData(caseKey(id), data),
  })
}
