/**
 * Mock data para o Sinótico.
 *
 * Cada linha exibe:
 *   - Cabeçalho com métricas
 *   - 1 garagem off (esquerda) + 1 terminal TP + timeline + 1 terminal TS + 1 garagem off (direita)
 *   - Veículos posicionados na timeline (direção ida/volta + pos% 0-100)
 *   - Alertas (desvio / comboio) com nível ok / warning / danger
 *
 * Regras de cor por status do veículo:
 *   ok        → verde
 *   adiantado → azul
 *   atrasado  → vermelho
 *   off       → cinza
 */

export type VehicleStatus = 'ok' | 'adiantado' | 'atrasado' | 'off'
export type AlertLevel    = 'ok' | 'warning' | 'danger'

export interface VehicleChip {
  code:   string
  status: VehicleStatus
}

export interface TimelineVehicle extends VehicleChip {
  /** 'ida' = trilho inferior (azul), 'volta' = trilho superior (verde) */
  dir: 'ida' | 'volta'
  /** Posição 0–100 (% ao longo do trajeto) */
  pos: number
}

export interface SinoticoLinha {
  id:    string
  code:  string
  name:  string
  metrics: {
    prev:            number
    saidasReal:      number
    saidasRealPct:   number
    viagensReal:     number
    viagensRealPct:  number
    saidasPont:      number
    saidasPontPct:   number
    saidasAdiant:    number
    saidasAdiantPct: number
    saidasAtrasadas: number
    saidasAtrasadasPct: number
  }
  /**
   * nº de paradas (ticks) por sentido. Na prática são valores variáveis
   * — a volta pode ter mais/menos pontos que a ida (rotas circulares,
   * paradas exclusivas em sentido único, etc.).
   * Mantemos `stops` como fallback p/ compat. retroativa.
   */
  stops?:      number
  stopsIda:    number
  stopsVolta:  number
  offLeft:  VehicleChip[]
  tp:       VehicleChip[]
  timeline: TimelineVehicle[]
  ts:       VehicleChip[]
  offRight: VehicleChip[]
  alerts: {
    desvio:  { count: number; level: AlertLevel }
    comboio: { count: number; level: AlertLevel }
  }
}

// helper — gera código aleatório de 4 dígitos
function code4(seed: number): string {
  return String(((seed * 9301 + 49297) % 9000) + 1000)
}

function chips(seed: number, n: number, status: VehicleStatus): VehicleChip[] {
  return Array.from({ length: n }, (_, i) => ({ code: code4(seed * 31 + i), status }))
}

// PRNG determinístico em [0,1) baseado em hash de inteiros — usado p/
// gerar cenários estáveis a partir do id da linha.
function rand01(seed: number, salt: number): number {
  const x = Math.sin(seed * 9301 + salt * 49297) * 233280
  return x - Math.floor(x)
}

function pickStatus(seed: number, salt: number, tipo: 'normal' | 'media' | 'critica'): VehicleStatus {
  const r = rand01(seed, salt)
  // Distribuição de status pondera pelo tipo da linha:
  //   Normal  → maioria ok, poucos atrasos.
  //   Média   → mix equilibrado, sem off.
  //   Crítica → muitos atrasos / adiantados.
  if (tipo === 'normal') {
    if (r < 0.70) return 'ok'
    if (r < 0.85) return 'adiantado'
    return 'atrasado'
  }
  if (tipo === 'media') {
    if (r < 0.45) return 'ok'
    if (r < 0.75) return 'atrasado'
    return 'adiantado'
  }
  // crítica
  if (r < 0.20) return 'ok'
  if (r < 0.70) return 'atrasado'
  return 'adiantado'
}

/**
 * Gera um SinoticoLinha determinístico a partir de uma linha do mockLines.
 * A composição (n de veículos por seção, posições na timeline, etc.) é
 * estável para o mesmo id — mesma linha sempre produz o mesmo card.
 *
 * @param lineId      Id da linha (mockLines).
 * @param lineName    Texto completo "1007 - ORIGEM / DESTINO".
 * @param tipo        Classificação da linha (normal/média/crítica) — afeta
 *                    distribuição de status dos veículos e contagem de alertas.
 */
export function buildSinoticoForLine(
  lineId:   string,
  lineName: string,
  tipo:    'normal' | 'media' | 'critica',
): SinoticoLinha {
  const seed = Number(lineId) || 1

  const stopsIda   = 6 + Math.floor(rand01(seed, 1) * 8)         // 6–13
  const stopsVolta = stopsIda * 3                                 // simétrico ao mock original
  const nOffLeft   = 1 + Math.floor(rand01(seed, 2) * 4)          // 1–4
  const nOffRight  = 1 + Math.floor(rand01(seed, 3) * 4)
  const nTP        = 2 + Math.floor(rand01(seed, 4) * 3)          // 2–4
  const nTS        = 2 + Math.floor(rand01(seed, 5) * 3)
  const nTimeline  = 5 + Math.floor(rand01(seed, 6) * 6)          // 5–10

  const timeline: TimelineVehicle[] = []
  for (let i = 0; i < nTimeline; i++) {
    const dir: 'ida' | 'volta' = rand01(seed, 100 + i) < 0.5 ? 'ida' : 'volta'
    const pos    = 5 + rand01(seed, 200 + i) * 90                 // 5–95%
    const status = pickStatus(seed, 300 + i, tipo)
    timeline.push({ code: code4(seed * 23 + i), status, dir, pos: Math.round(pos) })
  }

  // Alertas — escalam com a severidade do tipo
  const alertScale = { normal: 0.10, media: 0.40, critica: 0.85 }[tipo]
  const desvioCount  = Math.floor(rand01(seed, 7) * 6 * alertScale)
  const comboioCount = Math.floor(rand01(seed, 8) * 4 * alertScale)
  const lvl = (n: number, threshold: number): AlertLevel =>
    n === 0 ? 'ok' : n >= threshold ? 'danger' : 'warning'

  return {
    id:   `sin-${lineId}`,
    code: lineName.split(' - ')[0] ?? lineId,
    name: lineName,
    metrics: {
      prev: 0, saidasReal: 0, saidasRealPct: 0, viagensReal: 0, viagensRealPct: 0,
      saidasPont: 0, saidasPontPct: 0, saidasAdiant: 0, saidasAdiantPct: 0,
      saidasAtrasadas: 0, saidasAtrasadasPct: 0,
    },
    stopsIda,
    stopsVolta,
    offLeft:  chips(seed * 11, nOffLeft, 'off'),
    tp:       Array.from({ length: nTP }, (_, i) => ({
      code: code4(seed * 17 + i), status: pickStatus(seed, 400 + i, tipo),
    })),
    timeline,
    ts:       Array.from({ length: nTS }, (_, i) => ({
      code: code4(seed * 19 + i), status: pickStatus(seed, 500 + i, tipo),
    })),
    offRight: chips(seed * 13, nOffRight, 'off'),
    alerts: {
      desvio:  { count: desvioCount,  level: lvl(desvioCount,  3) },
      comboio: { count: comboioCount, level: lvl(comboioCount, 2) },
    },
  }
}

export const mockSinotico: SinoticoLinha[] = [
  {
    id:   's1',
    code: '1998',
    name: '1998 - CAETÉS III / TI ABREU E LIMA',
    metrics: {
      prev: 0, saidasReal: 0, saidasRealPct: 0, viagensReal: 0, viagensRealPct: 0,
      saidasPont: 0, saidasPontPct: 0, saidasAdiant: 0, saidasAdiantPct: 0,
      saidasAtrasadas: 0, saidasAtrasadasPct: 0,
    },
    // ida aleatória; volta = ida × 3
    stopsIda:    8,
    stopsVolta: 24,
    offLeft: [
      { code: '9999', status: 'off' },
      { code: '9999', status: 'off' },
    ],
    tp: [
      { code: code4(11), status: 'ok' },
      { code: code4(12), status: 'ok' },
      { code: code4(13), status: 'adiantado' },
      { code: code4(14), status: 'ok' },
    ],
    timeline: [
      // Cluster de 2 veículos no mesmo ponto (~45%) — empilham em coluna
      { code: code4(101), status: 'atrasado',  dir: 'volta', pos: 18 },
      { code: code4(102), status: 'ok',        dir: 'volta', pos: 24 },
      { code: code4(103), status: 'atrasado',  dir: 'volta', pos: 45 },
      { code: code4(104), status: 'ok',        dir: 'volta', pos: 46 },
      { code: code4(105), status: 'adiantado', dir: 'volta', pos: 80 },

      // Cluster de 3 veículos na ida (~32%)
      { code: code4(106), status: 'ok',        dir: 'ida', pos: 14 },
      { code: code4(107), status: 'atrasado',  dir: 'ida', pos: 32 },
      { code: code4(110), status: 'adiantado', dir: 'ida', pos: 33 },
      { code: code4(111), status: 'ok',        dir: 'ida', pos: 32 },
      { code: code4(108), status: 'adiantado', dir: 'ida', pos: 55 },
      { code: code4(109), status: 'adiantado', dir: 'ida', pos: 75 },
    ],
    ts: [
      { code: code4(21), status: 'ok' },
      { code: code4(22), status: 'ok' },
      { code: code4(23), status: 'ok' },
      { code: code4(24), status: 'atrasado' },
    ],
    offRight: [
      { code: '9999', status: 'off' },
      { code: '9999', status: 'off' },
      { code: '9999', status: 'off' },
      { code: '9999', status: 'off' },
    ],
    alerts: {
      desvio:  { count: 0, level: 'ok' },
      comboio: { count: 0, level: 'danger' },
    },
  },
  {
    id:   's2',
    code: '1998',
    name: '1998 - CAETÉS III / TI ABREU E LIMA',
    metrics: {
      prev: 0, saidasReal: 0, saidasRealPct: 0, viagensReal: 0, viagensRealPct: 0,
      saidasPont: 0, saidasPontPct: 0, saidasAdiant: 0, saidasAdiantPct: 0,
      saidasAtrasadas: 0, saidasAtrasadasPct: 0,
    },
    stopsIda:   11,
    stopsVolta: 33,
    offLeft:  chips(31, 4, 'off'),
    tp:       chips(32, 4, 'ok'),
    timeline: [
      // Cluster duplo (12 e 28) na volta
      { code: code4(201), status: 'atrasado',  dir: 'volta', pos: 12 },
      { code: code4(210), status: 'atrasado',  dir: 'volta', pos: 12 },
      { code: code4(202), status: 'atrasado',  dir: 'volta', pos: 28 },
      { code: code4(203), status: 'ok',        dir: 'volta', pos: 40 },
      { code: code4(204), status: 'adiantado', dir: 'volta', pos: 70 },
      { code: code4(205), status: 'ok',        dir: 'volta', pos: 85 },

      { code: code4(206), status: 'atrasado',  dir: 'ida', pos: 18 },
      { code: code4(207), status: 'ok',        dir: 'ida', pos: 35 },
      { code: code4(208), status: 'adiantado', dir: 'ida', pos: 58 },
      { code: code4(211), status: 'ok',        dir: 'ida', pos: 60 },
      { code: code4(209), status: 'adiantado', dir: 'ida', pos: 82 },
    ],
    ts:       chips(33, 4, 'ok'),
    offRight: chips(34, 4, 'off'),
    alerts: {
      desvio:  { count: 3, level: 'danger' },
      comboio: { count: 1, level: 'warning' },
    },
  },
  {
    id:   's3',
    code: '1998',
    name: '1998 - CAETÉS III / TI ABREU E LIMA',
    metrics: {
      prev: 0, saidasReal: 0, saidasRealPct: 0, viagensReal: 0, viagensRealPct: 0,
      saidasPont: 0, saidasPontPct: 0, saidasAdiant: 0, saidasAdiantPct: 0,
      saidasAtrasadas: 0, saidasAtrasadasPct: 0,
    },
    stopsIda:    6,
    stopsVolta: 18,
    offLeft:  chips(41, 4, 'off'),
    tp:       chips(42, 4, 'ok'),
    timeline: [
      { code: code4(301), status: 'atrasado',  dir: 'volta', pos: 20 },
      { code: code4(302), status: 'atrasado',  dir: 'volta', pos: 35 },
      { code: code4(303), status: 'atrasado',  dir: 'volta', pos: 50 },
      { code: code4(309), status: 'atrasado',  dir: 'volta', pos: 51 },
      { code: code4(304), status: 'adiantado', dir: 'volta', pos: 75 },

      { code: code4(305), status: 'ok',        dir: 'ida', pos: 12 },
      { code: code4(306), status: 'atrasado',  dir: 'ida', pos: 30 },
      { code: code4(307), status: 'atrasado',  dir: 'ida', pos: 48 },
      { code: code4(308), status: 'ok',        dir: 'ida', pos: 70 },
    ],
    ts:       chips(43, 4, 'ok'),
    offRight: chips(44, 4, 'off'),
    alerts: {
      desvio:  { count: 5, level: 'danger' },
      comboio: { count: 4, level: 'danger' },
    },
  },
  {
    id:   's4',
    code: '1998',
    name: '1998 - CAETÉS III / TI ABREU E LIMA',
    metrics: {
      prev: 0, saidasReal: 0, saidasRealPct: 0, viagensReal: 0, viagensRealPct: 0,
      saidasPont: 0, saidasPontPct: 0, saidasAdiant: 0, saidasAdiantPct: 0,
      saidasAtrasadas: 0, saidasAtrasadasPct: 0,
    },
    stopsIda:   13,
    stopsVolta: 39,
    offLeft:  chips(51, 2, 'off'),
    tp:       chips(52, 3, 'ok'),
    timeline: [
      { code: code4(401), status: 'ok',        dir: 'volta', pos: 22 },
      { code: code4(402), status: 'adiantado', dir: 'volta', pos: 55 },
      { code: code4(406), status: 'ok',        dir: 'volta', pos: 56 },
      { code: code4(403), status: 'ok',        dir: 'volta', pos: 78 },

      { code: code4(404), status: 'ok',        dir: 'ida', pos: 25 },
      { code: code4(405), status: 'ok',        dir: 'ida', pos: 60 },
    ],
    ts:       chips(53, 3, 'ok'),
    offRight: chips(54, 2, 'off'),
    alerts: {
      desvio:  { count: 0, level: 'ok' },
      comboio: { count: 0, level: 'ok' },
    },
  },
]
