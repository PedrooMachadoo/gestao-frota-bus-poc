/**
 * Mock — Unidades Organizacionais + frota (Ao vivo).
 * Simula um cadastro de UOs (ainda não existe módulo próprio) com veículos
 * vinculados a uma UO e a uma Linha. Usado pelo filtro lateral em /ao-vivo.
 */

export type FleetStatus = 'active' | 'attention' | 'inactive'
export type LatLng = [number, number]

export interface FleetVehicle {
  id:               string
  codigo:           string
  plate:            string
  model:            string
  uoId:             string
  linhaId:          string
  status:           FleetStatus
  driverIdentified: boolean
  pos:              LatLng   // posição mockada no mapa (centro Recife ± spread)
  heading:          number   // 0–359°, rotação do SVG (leste = 0)
}

export interface UO {
  id:   string
  name: string
}

export const mockUOs: UO[] = [
  { id: 'uo-1', name: 'UO Recife – Boa Viagem' },
  { id: 'uo-2', name: 'UO Recife – Centro' },
  { id: 'uo-3', name: 'UO Olinda – Garagem Norte' },
  { id: 'uo-4', name: 'UO Jaboatão – Filial Sul' },
]

const STATUSES: FleetStatus[] = ['active', 'attention', 'inactive']

// Centro Recife — mesma referência usada nas outras telas (Replay/Ao vivo).
const CENTER: LatLng = [-8.0476, -34.8770]
const SPREAD = 0.045 // ≈ 5 km de raio nos eixos lat/lng

// Hash determinístico simples — id → 0..1
function rand01(seed: number, salt: number): number {
  const x = Math.sin(seed * 9301 + salt * 49297) * 233280
  return x - Math.floor(x)
}

function makeVehicle(i: number, uoId: string, linhaId: string): FleetVehicle {
  const codigo = String(1000 + i).padStart(4, '0')
  const plate  = `${'ABCDEFGHIJKL'[i % 12]}${'BCDFGH'[i % 6]}${'JKLMNP'[(i + 2) % 6]}-${String(1234 + i * 7).padStart(4, '0')}`
  const models = ['Mercedes-Benz OF 1721', 'Volkswagen 17.230', 'Scania K360', 'Volvo B340R', 'Marcopolo Paradiso']
  const pos: LatLng = [
    CENTER[0] + (rand01(i, 1) - 0.5) * SPREAD,
    CENTER[1] + (rand01(i, 2) - 0.5) * SPREAD,
  ]
  const heading = Math.floor(rand01(i, 3) * 360)
  return {
    id:               `v-${i}`,
    codigo,
    plate,
    model:            models[i % models.length],
    uoId,
    linhaId,
    status:           STATUSES[i % STATUSES.length],
    driverIdentified: i % 3 !== 1,
    pos,
    heading,
  }
}

// 28 veículos distribuídos entre UOs e linhas
const linhaIds = ['1', '2', '3', '4', '5', '6', '7', '8']
export const mockFleet: FleetVehicle[] = Array.from({ length: 28 }, (_, i) => {
  const uoId    = mockUOs[i % mockUOs.length].id
  const linhaId = linhaIds[i % linhaIds.length]
  return makeVehicle(i, uoId, linhaId)
})
