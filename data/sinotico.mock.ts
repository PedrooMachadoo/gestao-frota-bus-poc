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
  /** nº de paradas (ticks) na timeline */
  stops: number
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
    stops: 28,
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
      { code: code4(101), status: 'atrasado',  dir: 'volta', pos: 18 },
      { code: code4(102), status: 'ok',        dir: 'volta', pos: 24 },
      { code: code4(103), status: 'atrasado',  dir: 'volta', pos: 45 },
      { code: code4(104), status: 'ok',        dir: 'volta', pos: 52 },
      { code: code4(105), status: 'adiantado', dir: 'volta', pos: 80 },

      { code: code4(106), status: 'ok',        dir: 'ida', pos: 14 },
      { code: code4(107), status: 'atrasado',  dir: 'ida', pos: 32 },
      { code: code4(108), status: 'adiantado', dir: 'ida', pos: 45 },
      { code: code4(109), status: 'adiantado', dir: 'ida', pos: 65 },
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
    stops: 28,
    offLeft:  chips(31, 4, 'off'),
    tp:       chips(32, 4, 'ok'),
    timeline: [
      { code: code4(201), status: 'atrasado',  dir: 'volta', pos: 12 },
      { code: code4(202), status: 'atrasado',  dir: 'volta', pos: 28 },
      { code: code4(203), status: 'ok',        dir: 'volta', pos: 40 },
      { code: code4(204), status: 'adiantado', dir: 'volta', pos: 70 },
      { code: code4(205), status: 'ok',        dir: 'volta', pos: 85 },

      { code: code4(206), status: 'atrasado',  dir: 'ida', pos: 18 },
      { code: code4(207), status: 'ok',        dir: 'ida', pos: 35 },
      { code: code4(208), status: 'adiantado', dir: 'ida', pos: 58 },
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
    stops: 28,
    offLeft:  chips(41, 4, 'off'),
    tp:       chips(42, 4, 'ok'),
    timeline: [
      { code: code4(301), status: 'atrasado',  dir: 'volta', pos: 20 },
      { code: code4(302), status: 'atrasado',  dir: 'volta', pos: 35 },
      { code: code4(303), status: 'atrasado',  dir: 'volta', pos: 50 },
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
    stops: 28,
    offLeft:  chips(51, 2, 'off'),
    tp:       chips(52, 3, 'ok'),
    timeline: [
      { code: code4(401), status: 'ok',        dir: 'volta', pos: 22 },
      { code: code4(402), status: 'adiantado', dir: 'volta', pos: 55 },
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
