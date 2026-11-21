// DEV ONLY: a tiny in-process mock of the Kompas API (notatki/api-kontrakt-v1.md and the
// v2 "teczki ocen" routes from notatki/api-kontrakt-v2.md, see dev-mock-v2.ts),
// used to develop the UI while the backend is not ready. Disabled by default.
// Enable with:  MOCK_API=1 npm run dev
// It reads ../notatki/model-kompetencji.json (override with MOCK_MODEL_PATH).
// Never part of the production bundle: it only runs inside the Vite dev server.
import { readFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { createV2 } from './dev-mock-v2.ts'

type Json = Record<string, unknown>

interface RawModel {
  tytul: string
  instrukcje: string[]
  skala: { poziomy: { punkty: number; etykieta: string }[] }
  mapowanie_arkuszy: Record<string, Json>
  competencies: {
    id: string
    competency: string
    indicators: { id: string; name: string; levels: Record<string, string> }[]
  }[]
}

function loadData(path: string) {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as RawModel
  const scaleLabels = new Map(
    raw.skala.poziomy.map((p) => [p.punkty, p.etykieta] as const),
  )
  const model = {
    title: raw.tytul,
    instructions: raw.instrukcje,
    scale: raw.skala.poziomy.map((p) => ({ points: p.punkty, label: p.etykieta })),
    competencies: raw.competencies.map((c) => ({
      id: c.id,
      name: c.competency,
      indicators: c.indicators,
    })),
  }
  const map = raw.mapowanie_arkuszy as Record<
    string,
    { kto?: string; kryteria_obowiazkowe?: string[]; podstawa?: string; elementy?: string[] }
  >
  const periodic = (id: 'A' | 'B' | 'C') => ({
    id,
    name: `Arkusz ${id} oceny okresowej`,
    appliesTo: map[id].kto ?? '',
    kind: 'PERIODIC',
    scale: [1, 3, 5, 7, 9],
    mandatoryCriteria: map[id].kryteria_obowiazkowe ?? [],
    maxAdditionalCriteria: 3,
    legalBasis: `${map[id].podstawa ?? ''} (rozp. PRM z 4.04.2016, Dz.U. poz. 470)`,
  })
  const sheets = [
    periodic('A'),
    periodic('B'),
    periodic('C'),
    {
      id: 'FIRST',
      name: 'Arkusz pierwszej oceny',
      appliesTo: 'pracownik służby cywilnej zatrudniony po raz pierwszy w służbie cywilnej',
      kind: 'FIRST',
      scale: [3, 5, 7],
      mandatoryCriteria: map.pierwsza_ocena.elementy ?? [],
      maxAdditionalCriteria: 0,
      legalBasis: '§2 pkt 1, §9, §10 rozp. PRM z 23.07.2015 (Dz.U. poz. 1144)',
    },
  ]
  return { model, sheets, scaleLabels }
}

function snap(mean: number, scale: number[]): number {
  let best = scale[0]
  let bestDist = Infinity
  for (const p of scale) {
    const d = Math.abs(p - mean)
    if (d < bestDist - 1e-9) {
      best = p
      bestDist = d
    } else if (Math.abs(d - bestDist) < 1e-9 && Math.abs(p - 5) < Math.abs(best - 5)) {
      best = p
    }
  }
  return best
}

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',')
}

function readBody(req: IncomingMessage): Promise<Json> {
  return new Promise((ok, fail) => {
    let data = ''
    req.on('data', (c: Buffer) => (data += c.toString()))
    req.on('end', () => {
      try {
        ok(data ? (JSON.parse(data) as Json) : {})
      } catch (e) {
        fail(e)
      }
    })
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export function devMockApi(): Plugin {
  return {
    name: 'kompas-dev-mock-api',
    apply: 'serve',
    configureServer(server) {
      if (process.env.MOCK_API !== '1') return
      const path = resolve(
        process.env.MOCK_MODEL_PATH ?? '../notatki/model-kompetencji.json',
      )
      const { model, sheets, scaleLabels } = loadData(path)
      const v2 = createV2(model, sheets, scaleLabels)
      server.config.logger.info(`  [mock] Kompas API mock enabled (${path})`)

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/')) return next()
        await new Promise((r) => setTimeout(r, 120)) // feel like a network
        try {
          if (req.method === 'GET' && url === '/api/health') return send(res, 200, { status: 'ok' })
          if (req.method === 'GET' && url === '/api/competency-model') return send(res, 200, model)
          if (req.method === 'GET' && url === '/api/sheets') return send(res, 200, sheets)

          if (req.method === 'POST' && url === '/api/assessments/suggest-level') {
            const body = (await readBody(req)) as {
              sheetId: string
              indicatorRatings: { indicatorId: string; points: number | null }[]
            }
            const sheet = sheets.find((s) => s.id === body.sheetId)
            if (!sheet) return send(res, 400, { message: 'Nieznany arkusz.' })
            const isFirst = sheet.kind === 'FIRST'
            const rated = body.indicatorRatings
              .filter((r) => r.points !== null)
              .map((r) => (isFirst ? Math.min(7, Math.max(3, r.points as number)) : (r.points as number)))
            const skipped = body.indicatorRatings.length - rated.length
            const warnings: string[] = []
            if (!rated.length) {
              return send(res, 200, {
                suggestedPoints: null,
                suggestedLabel: null,
                ratedCount: 0,
                skippedCount: skipped,
                mean: null,
                rationale: 'Brak ocenionych wskaźników — nie można zaproponować poziomu.',
                warnings,
                isSuggestionOnly: true,
              })
            }
            const mean = rated.reduce((a, b) => a + b, 0) / rated.length
            const points = snap(mean, sheet.scale)
            if (!isFirst && rated.includes(1)) {
              warnings.push(
                'Co najmniej jeden wskaźnik oceniono na 1 pkt. Ocena cząstkowa kryterium 1 pkt oznacza negatywną ocenę okresową (§11 ust. 1 pkt 4 rozp. 2016).',
              )
            }
            if (skipped > 0 && rated.length === 1) {
              warnings.push('Sugestia opiera się tylko na jednym wskaźniku — rozważ, czy to wystarczająca podstawa.')
            }
            return send(res, 200, {
              suggestedPoints: points,
              suggestedLabel: scaleLabels.get(points) ?? null,
              ratedCount: rated.length,
              skippedCount: skipped,
              mean,
              rationale: `[MOCK] Średnia z ${rated.length} ocenionych wskaźników wynosi ${fmt(mean)}; zaokrąglono do najbliższej wartości skali arkusza (reguła przyjęta przez zespół, nie wynika z przepisów).`,
              warnings,
              isSuggestionOnly: true,
            })
          }

          if (req.method === 'POST' && url === '/api/assessments/evaluate') {
            const body = (await readBody(req)) as {
              sheetId: string
              scores: { criterionId: string; points: number }[]
              firstAssessment?: { examPassed: string; reportSubmittedOnTime: boolean }
            }
            const sheet = sheets.find((s) => s.id === body.sheetId)
            if (!sheet) return send(res, 400, { message: 'Nieznany arkusz.' })
            const pts = body.scores.map((s) => s.points)
            const average = pts.reduce((a, b) => a + b, 0) / pts.length
            const reasons: string[] = []
            let positive: boolean
            let level: { label: string; range: string } | null = null
            if (sheet.kind === 'PERIODIC') {
              const bands = [
                { max: 2, label: 'Znacznie poniżej oczekiwań', range: '1–2' },
                { max: 4, label: 'Poniżej oczekiwań', range: '>2–4' },
                { max: 6, label: 'Na poziomie oczekiwań', range: '>4–6' },
                { max: 8, label: 'Powyżej oczekiwań', range: '>6–8' },
                { max: 9, label: 'Znacznie powyżej oczekiwań', range: '>8–9' },
              ]
              const b = bands.find((x) => average <= x.max) ?? bands[4]
              level = { label: b.label, range: b.range }
              const hasOne = pts.includes(1)
              positive = average > 4 && !hasOne
              reasons.push(`[MOCK] Średnia ${fmt(average)} ${average > 4 ? 'jest' : 'nie jest'} wyższa niż 4 (§11 ust. 1 pkt 3 rozp. 2016).`)
              if (hasOne) reasons.push('[MOCK] Co najmniej jedna ocena cząstkowa wynosi 1 pkt (§11 ust. 1 pkt 4 rozp. 2016).')
            } else {
              const fa = body.firstAssessment
              if (!fa) return send(res, 400, { message: 'Dla pierwszej oceny wymagane są dane o egzaminie i sprawozdaniu.' })
              const threes = pts.filter((p) => p === 3).length
              positive = average >= 5 && threes <= 1 && fa.examPassed !== 'NO' && fa.reportSubmittedOnTime
              reasons.push(`[MOCK] Średnia ${fmt(average)} ${average >= 5 ? 'wynosi co najmniej' : 'jest niższa niż'} 5 (§10 ust. 1 rozp. 2015).`)
              reasons.push(`[MOCK] Liczba ocen 3 pkt: ${threes} (dopuszczalna najwyżej jedna).`)
              if (fa.examPassed === 'NO') reasons.push('[MOCK] Egzamin kończący służbę przygotowawczą nie został zdany.')
              if (!fa.reportSubmittedOnTime) reasons.push('[MOCK] Sprawozdanie nie zostało złożone w terminie.')
            }
            return send(res, 200, {
              average,
              averageDisplay: fmt(average),
              level,
              result: positive ? 'POSITIVE' : 'NEGATIVE',
              reasons,
            })
          }

          const body = req.method === 'GET' ? {} : await readBody(req)
          const out = v2(req.method ?? 'GET', url, body)
          if (out) return send(res, out.status, out.body)
          return send(res, 404, { message: 'Nie znaleziono (mock).' })
        } catch (e) {
          return send(res, 500, { message: String(e) })
        }
      })
    },
  }
}
