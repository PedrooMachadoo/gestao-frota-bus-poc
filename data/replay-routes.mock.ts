/**
 * Mock de rotas para a tela Replay.
 *
 * Conceito:
 *   • Um itinerário tem DUAS ROTAS independentes (Ida e Volta).
 *   • Ambas compartilham os terminais (primeiro e último ponto físico),
 *     mas o miolo segue ruas diferentes — refletindo a realidade do
 *     transporte urbano (mão única, retornos por avenidas alternativas).
 *   • Cada rota é construída a partir de macro-waypoints (~6 pontos)
 *     ligados por trechos retos interpolados — visual mais próximo de
 *     ruas reais (em vez de random-walk wiggly).
 *
 * Centro: Recife (-8.0476, -34.8770)
 */

export type LatLng = [number, number]

export interface RouteSegment {
  ida:   LatLng[]
  volta: LatLng[]
}

/* ─────────────────────────────────────────────────────
 * Geração estável por seed (mesma linha → mesma rota)
 * ──────────────────────────────────────────────────── */

function seedFrom(linhaId: string): number {
  return linhaId.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
}

/**
 * Macro-waypoints da rota Ida: 6 pontos que formam o "esqueleto"
 * (terminais nas pontas, curvas estratégicas no meio).
 */
function generateIdaMacros(seed: number, count = 6): LatLng[] {
  const baseLat = -8.0476
  const baseLng = -34.8770

  const macros: LatLng[] = []
  // Terminal-A varia por seed (longe do centro, simulando bairro)
  let lat = baseLat + (((seed * 17) % 100) - 50) / 6000
  let lng = baseLng + (((seed * 23) % 100) - 50) / 6000
  macros.push([lat, lng])

  // Direção inicial pseudo-aleatória mas estável
  let angle = ((seed * 41) % 360) * (Math.PI / 180)

  for (let i = 1; i < count; i++) {
    // Curva moderada (max ~60° por trecho) — simula esquina/avenida
    const turn = (((seed * 7 + i * 13) % 90) - 45) * (Math.PI / 180)
    angle += turn * 0.6
    // Trechos longos (~800m), variando levemente
    const dist = 0.0085 + ((i % 3) * 0.002)
    lat += Math.sin(angle) * dist
    lng += Math.cos(angle) * dist
    macros.push([lat, lng])
  }
  return macros
}

/**
 * Macro-waypoints da Volta:
 *   • Começa onde a Ida termina (terminal-B)
 *   • Termina onde a Ida começa (terminal-A)
 *   • Miolo é DIFERENTE da Ida — offset perpendicular, simulando
 *     ruas paralelas (mão única).
 */
function generateVoltaMacros(idaMacros: LatLng[], seed: number): LatLng[] {
  const result: LatLng[] = []
  // Compartilha terminal-B (fim da Ida = início da Volta)
  result.push(idaMacros[idaMacros.length - 1])

  // Miolo: reverso da Ida com offset perpendicular variável
  for (let i = idaMacros.length - 2; i > 0; i--) {
    const [la, ln]   = idaMacros[i]
    const [pa, pn]   = idaMacros[i + 1]
    // Direção do segmento e perpendicular
    const dx = la - pa
    const dy = ln - pn
    const len = Math.hypot(dx, dy) || 1
    const perpX = -dy / len
    const perpY =  dx / len
    // Offset varia por segmento (algumas ruas mais distantes que outras)
    const offset = 0.0025 + (((seed + i) % 3) * 0.0008)
    result.push([la + perpX * offset, ln + perpY * offset])
  }

  // Compartilha terminal-A (início da Ida = fim da Volta)
  result.push(idaMacros[0])
  return result
}

/**
 * Interpola pontos intermediários entre macro-waypoints,
 * gerando trechos retos (com pequena curvatura próxima às esquinas).
 */
function interpolate(macros: LatLng[], stepsPerSegment = 6): LatLng[] {
  const out: LatLng[] = []
  for (let i = 0; i < macros.length - 1; i++) {
    const [la0, ln0] = macros[i]
    const [la1, ln1] = macros[i + 1]
    for (let t = 0; t < stepsPerSegment; t++) {
      const f = t / stepsPerSegment
      out.push([la0 + (la1 - la0) * f, ln0 + (ln1 - ln0) * f])
    }
  }
  out.push(macros[macros.length - 1])
  return out
}

/* ─────────────────────────────────────────────────────
 * Cache + API pública
 * ──────────────────────────────────────────────────── */

const linhaCache: Record<string, RouteSegment> = {}
const ativoCache: Record<string, LatLng[]>     = {}

/**
 * Rota PLANEJADA da linha (Card 1 — preview Ida/Volta).
 * Sempre a mesma para a mesma linha (rota oficial planejada).
 */
export function getRouteForLinha(linhaId: string): RouteSegment {
  if (linhaCache[linhaId]) return linhaCache[linhaId]
  const seed        = seedFrom(linhaId)
  const idaMacros   = generateIdaMacros(seed)
  const voltaMacros = generateVoltaMacros(idaMacros, seed)
  linhaCache[linhaId] = {
    ida:   interpolate(idaMacros),
    volta: interpolate(voltaMacros),
  }
  return linhaCache[linhaId]
}

/** Resolve `${linhaId}-ida` ou `${linhaId}-volta` para a polyline planejada. */
export function getRouteForItinerario(itinerarioId: string): LatLng[] {
  const dashIdx = itinerarioId.lastIndexOf('-')
  if (dashIdx === -1) return []
  const linhaId   = itinerarioId.slice(0, dashIdx)
  const direction = itinerarioId.slice(dashIdx + 1)
  const seg = getRouteForLinha(linhaId)
  return direction === 'volta' ? seg.volta : seg.ida
}

/**
 * Rota HISTÓRICA do ativo (Card 2 — trajetória que o veículo efetivamente
 * percorreu nas datas/horas escolhidas).
 *
 * • Independente do itinerário planejado — o ativo pode ter seguido o trajeto
 *   da linha ou não (desvios, retornos, blocos diferentes).
 * • Cada ativo tem sua própria rota, derivada do `ativoId` como seed →
 *   rotas visualmente distintas mesmo para ativos no mesmo itinerário.
 * • Mantém o centro em Recife pra todos serem visíveis no mesmo viewport.
 */
export function getRouteForAtivo(ativoId: string): LatLng[] {
  if (ativoCache[ativoId]) return ativoCache[ativoId]
  const seed   = seedFrom(ativoId)
  const macros = generateIdaMacros(seed, 6)
  const route  = interpolate(macros)
  ativoCache[ativoId] = route
  return route
}

/**
 * Pontos de parada da linha (mock).
 * No produto real virão do módulo de "Planejamento → Ponto de parada".
 *
 * Cada parada tem:
 *  • `tipo`  — Garagem / Terminal / Ponto de parada / Outros (mesmo enum do
 *              módulo de Pontos, com ícone e cor próprios)
 *  • `fence` — Geofence própria: círculo (raio) OU polígono (vértices)
 *
 *  Convenção do mock:
 *    Garagem  / Terminal  → polígono (locais com forma irregular)
 *    Parada   / Outros    → raio circular (geofence simples)
 */
export type StopTipo = 'garagem' | 'terminal' | 'parada' | 'outros'

export type StopFence =
  | { mode: 'radius';  radius: number }
  | { mode: 'polygon'; vertices: LatLng[] }

export interface Stop {
  pos:   LatLng
  tipo:  StopTipo
  fence: StopFence
}

/** Gera um polígono quadrilátero leve em torno de um ponto. */
function polygonAround(pos: LatLng, sizeLat = 0.0006, sizeLng = 0.0008, seed = 0): LatLng[] {
  const [lat, lng] = pos
  // Pequena variação por seed pra polígonos não ficarem todos idênticos
  const j = (n: number) => 0.85 + (((seed * n) % 30) / 100)  // 0.85..1.15
  return [
    [lat + sizeLat * j(7),       lng - sizeLng * j(11) * 0.7],
    [lat + sizeLat * j(13) * 0.5, lng + sizeLng * j(17)],
    [lat - sizeLat * j(19) * 0.6, lng + sizeLng * j(23) * 0.8],
    [lat - sizeLat * j(29),       lng - sizeLng * j(31) * 0.5],
  ]
}

/** Sequência de tipos pra dar variedade visual ao longo da rota. */
const TIPO_SEQUENCE: StopTipo[] = ['garagem', 'parada', 'terminal', 'parada', 'outros', 'parada']

export function getStopsForLinha(linhaId: string): Stop[] {
  const seg  = getRouteForLinha(linhaId)
  const seed = seedFrom(linhaId)
  const out: Stop[] = []
  let idx = 0

  for (const route of [seg.ida, seg.volta]) {
    for (let i = 3; i < route.length - 2; i += 4) {
      const pos  = route[i]
      const tipo = TIPO_SEQUENCE[idx % TIPO_SEQUENCE.length]
      const fence: StopFence =
        (tipo === 'garagem' || tipo === 'terminal')
          ? { mode: 'polygon', vertices: polygonAround(pos, 0.00065, 0.00085, seed + idx) }
          : { mode: 'radius',  radius: 80 }
      out.push({ pos, tipo, fence })
      idx++
    }
  }

  return out
}
