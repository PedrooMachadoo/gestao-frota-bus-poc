<script setup lang="ts">
/**
 * Replay — Monitoramento
 * Figma: https://www.figma.com/design/hoKaXxVU7mFI4a97HGnn5m/SGF-Bus?node-id=1-384060
 *
 * Layout:
 *   [ Map (flex)            ] [ Side panel — 3 cards stacked ]
 *
 * Fluxo:
 *   Card 1 (Adicionar itinerário) → escolhe Linha + Itinerário
 *      • Map: desenha preview (IDA azul + VOLTA oliva) do trajeto da Linha
 *   Card 2 (Adicionar ativo)      → escolhe Ativo + datas/horas → "+ Adicionar"
 *      • Map: remove preview, adiciona trail vermelho + bolinhas direcionais +
 *             marker do ônibus + card de posição (popup)
 *      • Cards 1 e 2 são RESETADOS
 *   Card 3 (Ativos selecionados)  → lista os ativos adicionados
 *   Player (canto sup. esq. do mapa):
 *      • Play  → anima posição de todos os ativos visíveis pelo trajeto
 *      • Pause → pausa
 *      • Stop  → volta para a posição inicial
 *      • Skip back / forward → 1 passo p/ trás ou frente
 */

import {
  Flag,
  Bus,
  ListChecks,
  Plus,
  X,
  Pencil,
  Eye,
  Upload,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  FilterX,
} from 'lucide-vue-next'
import { mockLines } from '~/data/lines.mock'
import { mockVehicles } from '~/data/vehicles.mock'
import {
  getRouteForAtivo,
  getRouteForLinha,
  getStopsForLinha,
  type LatLng,
  type Stop,
  type StopTipo,
} from '~/data/replay-routes.mock'

definePageMeta({ layout: 'default' })

// ════════════════════════════════════════════════════
// 1) Tipos
// ════════════════════════════════════════════════════
interface AtivoSelecionado {
  id:           string
  vehicleId:    string
  plate:        string
  linhaId:      string
  itinerarioId: string
  dataInicial:  string
  dataFinal:    string
  horaInicial:  string
  horaFinal:    string
  km:           string
  color:        string
  visible:      boolean
}

interface AtivoMapLayer {
  trail:         any
  dots:          any
  marker:        any
  popup:         any
  route:         LatLng[]
  posIdx:        number
  initialPosIdx: number   // posição inicial (spread) — reset volta para cá
}

// ════════════════════════════════════════════════════
// 2) Refs do Leaflet (fora da reatividade)
// ════════════════════════════════════════════════════
let L: any = null
let map: any = null
let previewLayer: any = null
let stopsLayer:   any = null      // pontos de parada (toggle "Ponto de parada")
let radiusLayer:  any = null      // círculos de geofence (toggle "Raio")
const ativoLayers = new Map<string, AtivoMapLayer>()
let playTimer: any = null

const STOP_RADIUS_METERS = 80     // raio padrão da cerca em torno de cada parada

// Cores de regra de negócio (transporte urbano): IDA = azul, VOLTA = verde
const IDA_COLOR    = '#2D6BFF'
const VOLTA_COLOR  = '#16A34A'

const VELOCITY_MS: Record<string, number> = {
  '0.5x': 1600, '1x': 800, '2x': 400, '4x': 200,
}

// ════════════════════════════════════════════════════
// 3) Estado reativo
// ════════════════════════════════════════════════════

// Card 1
const linhaSel      = ref<string | null>(null)
const itinerarioSel = ref<string | null>(null)
const previewVisible = ref(false)   // trajeto desenhado no mapa? (independente do form)

// Card 2
const ativoSel    = ref<string | null>(null)
const dataInicial = ref('')
const dataFinal   = ref('')
const horaInicial = ref('')
const horaFinal   = ref('')

// Card 3
const ativosSelecionados = ref<AtivoSelecionado[]>([])

// Toggles do mapa (overlay sobre o itinerário do Card 1)
const showPontosParada = ref(false)
const showRaio         = ref(false)

// Player
const playing  = ref(false)
const velocity = ref('1x')
const velocityOptions = [
  { value: '0.5x', label: '0.5x' },
  { value: '1x',   label: '1x' },
  { value: '2x',   label: '2x' },
  { value: '4x',   label: '4x' },
]

/**
 * Paleta de cores do ATIVO (trail + marker + play button).
 * Hues bem espaçados (~60° cada) para máximo contraste entre ativos visíveis.
 * Evita azul e verde puros (reservados para o preview Ida/Volta).
 */
const ATIVO_PALETTE = [
  '#EF4444',  // red       (hue   0°)
  '#F97316',  // orange    (hue  25°)
  '#EAB308',  // yellow    (hue  50°)
  '#14B8A6',  // teal      (hue 170°)
  '#A855F7',  // purple    (hue 270°)
  '#EC4899',  // pink      (hue 320°)
]

/** Sorteia uma cor priorizando as ainda não usadas pelos ativos atuais. */
function pickAtivoColor(): string {
  const used = new Set(ativosSelecionados.value.map(a => a.color))
  const available = ATIVO_PALETTE.filter(c => !used.has(c))
  const pool = available.length > 0 ? available : ATIVO_PALETTE
  return pool[Math.floor(Math.random() * pool.length)]
}

// ════════════════════════════════════════════════════
// 4) Computeds
// ════════════════════════════════════════════════════
const linhaOptions = computed(() =>
  mockLines.map(l => ({ value: l.id, label: l.name }))
)

const itinerariosByLinha = computed(() => {
  const m: Record<string, { value: string; label: string }[]> = {}
  for (const l of mockLines) {
    m[l.id] = [
      { value: `${l.id}-ida`,   label: `${l.origin} → ${l.destination}` },
      { value: `${l.id}-volta`, label: `${l.destination} → ${l.origin}` },
    ]
  }
  return m
})

const itinerarioOptions = computed(() => {
  if (!linhaSel.value) return []
  return itinerariosByLinha.value[linhaSel.value] ?? []
})

const ativoOptions = computed(() =>
  mockVehicles.map(v => ({ value: v.id, label: `${v.plate} • ${v.model}` }))
)

// Card 2 é independente do Card 1 — só exige os próprios campos.
// (linha/itinerário ficam vazios quando o usuário não escolhe nada no Card 1)
const canAdd = computed(() =>
  !!ativoSel.value &&
  !!dataInicial.value && !!dataFinal.value &&
  !!horaInicial.value && !!horaFinal.value
)

// ════════════════════════════════════════════════════
// 5) Helpers de mapa
// ════════════════════════════════════════════════════
function bearing(from: LatLng, to: LatLng): number {
  return Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI
}

function addArrowTip(prev: LatLng, end: LatLng, color: string, layerGroup: any) {
  const angle = bearing(prev, end)
  const cssAngle = 90 - angle
  const html = `
    <div class="arrow-tip" style="transform: rotate(${cssAngle}deg);">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${color}">
        <path d="M12 2 L20 18 L12 14 L4 18 Z"/>
      </svg>
    </div>`
  const icon = L.divIcon({ html, className: 'arrow-tip-wrap', iconSize: [18, 18], iconAnchor: [9, 9] })
  L.marker(end, { icon, interactive: false }).addTo(layerGroup)
}

/**
 * Pino de INÍCIO de uma rota: badge colorida com texto (ex.: "IDA" / "VOLTA").
 * Visualmente sai do mapa como uma etiqueta apontando para o waypoint inicial.
 */
function addRouteStartBadge(pos: LatLng, text: string, color: string, layerGroup: any) {
  const html = `
    <div class="route-badge route-badge--start" style="background:${color};">
      <span class="route-badge__dot"></span>
      <span class="route-badge__text">${text}</span>
    </div>`
  const icon = L.divIcon({
    html,
    className: 'route-badge-wrap',
    iconSize:  [56, 22],
    iconAnchor:[0,  11],   // ancora pelo lado esquerdo → badge "sai" do ponto
  })
  L.marker(pos, { icon, interactive: false, zIndexOffset: 600 }).addTo(layerGroup)
}

/**
 * Pino de FIM de uma rota: pequeno círculo color-coded com check.
 * Compacto pra não competir com o badge de início.
 */
function addRouteEndPin(pos: LatLng, color: string, layerGroup: any) {
  const html = `
    <div class="route-endpin" style="background:${color};">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>`
  const icon = L.divIcon({ html, className: 'route-endpin-wrap', iconSize: [16, 16], iconAnchor: [8, 8] })
  L.marker(pos, { icon, interactive: false, zIndexOffset: 550 }).addTo(layerGroup)
}

/**
 * Chevrons direcionais ao longo de uma polyline.
 * Coloca uma seta (▶) na cor da linha a cada `step` waypoints.
 * Pula os endpoints (que já têm o pino A/B + seta de ponta).
 */
function addDirectionChevrons(route: LatLng[], color: string, layerGroup: any, step = 5) {
  for (let i = step; i < route.length - 2; i += step) {
    const angle = bearing(route[i], route[i + 1])
    const cssAngle = 90 - angle
    const html = `
      <div class="chevron" style="transform: rotate(${cssAngle}deg);">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="${color}">
          <path d="M12 2 L20 18 L12 14 L4 18 Z"/>
        </svg>
      </div>`
    const icon = L.divIcon({ html, className: 'chevron-wrap', iconSize: [12, 12], iconAnchor: [6, 6] })
    L.marker(route[i], { icon, interactive: false }).addTo(layerGroup)
  }
}

/**
 * Marker do ATIVO atualmente: círculo na cor do ativo + seta branca
 * que aponta na direção de deslocamento (rotação CSS por bearing).
 */
function ativoMarkerIcon(color: string, bearingDeg: number) {
  const cssAngle = 90 - bearingDeg
  const html = `
    <div class="ativo-marker" style="background:${color};">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF"
           style="transform: rotate(${cssAngle}deg);">
        <path d="M12 2 L20 18 L12 14 L4 18 Z"/>
      </svg>
    </div>`
  return L.divIcon({ html, className: 'ativo-marker-wrap', iconSize: [28, 28], iconAnchor: [14, 14] })
}

/** Bearing entre o waypoint idx e o próximo (ou retorna o anterior no fim). */
function bearingAt(route: LatLng[], idx: number): number {
  if (idx < route.length - 1) return bearing(route[idx], route[idx + 1])
  if (idx > 0)                return bearing(route[idx - 1], route[idx])
  return 0
}

// (O furthest-point spread foi removido: como cada ativo agora tem sua
//  PRÓPRIA rota — gerada via `getRouteForAtivo(a.id)` — eles já aparecem
//  em trajetórias visualmente distintas. Não é mais preciso "espalhar"
//  manualmente dentro da mesma polyline.)

function buildPopupHtml(a: AtivoSelecionado, idx: number): string {
  const vehicle = mockVehicles.find(v => v.id === a.vehicleId)
  const code    = vehicle?.id ?? '0000'
  const model   = vehicle?.model ?? ''
  const data    = a.dataInicial || '00/00/0000'
  const hora    = a.horaInicial || '00:00:00'
  const speed   = Math.floor(20 + (idx * 1.7) % 40)
  return `
    <div class="rp">
      <div class="rp__head">
        <span class="rp__title">[${code} - ${a.plate} - ${model}]</span>
        <button class="rp__close" type="button" aria-label="Fechar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
        </button>
      </div>
      <div class="rp__body">
        <div class="rp__row">
          <div class="rp__col">
            <div class="rp__label">Data</div>
            <div class="rp__value">${data} - ${hora}</div>
          </div>
          <span class="rp__badge">Ligado</span>
        </div>
        <div class="rp__col">
          <div class="rp__label">Velocidade</div>
          <div class="rp__value">${speed}Km/h</div>
        </div>
        <div class="rp__col">
          <div class="rp__label">Funcionário</div>
          <div class="rp__value">10800 - [Nome completo do funcionário]</div>
        </div>
        <div class="rp__col">
          <div class="rp__label">Endereço</div>
          <div class="rp__value">R. Dr. Joao Elisio, 18 - Centro, Igarassu, PE<br/>53610060, Brasil</div>
        </div>
      </div>
    </div>`
}

// ── Preview (Card 1) ─────────────────────────────────
function clearPreview() {
  if (previewLayer) {
    previewLayer.clearLayers()
    map?.removeLayer(previewLayer)
    previewLayer = null
  }
  previewVisible.value = false
}

function drawPreview(linhaId: string) {
  if (!L || !map) return
  clearPreview()
  const seg = getRouteForLinha(linhaId)
  previewLayer = L.layerGroup().addTo(map)
  previewVisible.value = true

  // ── Linhas (rotas independentes; compartilham só os terminais)
  const idaLine   = L.polyline(seg.ida,   { color: IDA_COLOR,   weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(previewLayer)
  const voltaLine = L.polyline(seg.volta, { color: VOLTA_COLOR, weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(previewLayer)

  // ── Setas só nas pontas (direção da rota) — chevrons e pinos de fim removidos
  //    para não criar ruído visual quando ativos cruzam a rota planejada.
  addArrowTip(seg.ida[seg.ida.length - 2],     seg.ida[seg.ida.length - 1],     IDA_COLOR,   previewLayer)
  addArrowTip(seg.volta[seg.volta.length - 2], seg.volta[seg.volta.length - 1], VOLTA_COLOR, previewLayer)

  // ── Badges "IDA" / "VOLTA" no INÍCIO de cada rota (ancoragem semântica)
  addRouteStartBadge(seg.ida[0],   'IDA',   IDA_COLOR,   previewLayer)
  addRouteStartBadge(seg.volta[0], 'VOLTA', VOLTA_COLOR, previewLayer)

  map.fitBounds(idaLine.getBounds().extend(voltaLine.getBounds()), { padding: [60, 60] })
}

// ── Pontos de parada e raios (toggles sobre o itinerário do Card 1) ──────

/**
 * Metadata de cada tipo de ponto — mesma definição do módulo Pontos:
 *   • dotBg / balloonColor: cores do pin
 *   • iconPath: SVG path do ícone Lucide correspondente (Home / Bus / MapPin / Users)
 */
const STOP_TIPOS: Record<StopTipo, { dotBg: string; balloonColor: string; iconPath: string }> = {
  garagem:  {
    dotBg: '#1F2937', balloonColor: '#1B3A6B',
    iconPath: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  },
  terminal: {
    dotBg: '#D97706', balloonColor: '#B45309',
    iconPath: '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
  },
  parada:   {
    dotBg: '#6B7280', balloonColor: '#4B5563',
    iconPath: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  },
  outros:   {
    dotBg: '#374151', balloonColor: '#374151',
    iconPath: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  },
}

/** Cores da cerca/raio — mesmo blue do módulo Pontos */
const FENCE_COLOR        = '#2D6BFF'
const FENCE_FILL_OPACITY = 0.18

/** Pin do ponto de parada — cor + ícone variam pelo tipo. */
function stopPinIcon(tipo: StopTipo) {
  const m = STOP_TIPOS[tipo]
  const html = `
    <svg width="26" height="30" viewBox="0 0 30 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="rp-stop-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="1.5" dy="1.5" stdDeviation="0.8" flood-color="rgba(0,0,0,0.25)"/>
        </filter>
      </defs>
      <g filter="url(#rp-stop-shadow)">
        <circle cx="15" cy="15" r="14.5" fill="${m.balloonColor}" stroke="rgba(248,248,248,0.97)" stroke-width="0.5"/>
        <polygon points="9,26 15,33.5 21,26" fill="${m.balloonColor}"/>
      </g>
      <circle cx="15" cy="14.5" r="8.5" fill="${m.dotBg}" stroke="white" stroke-width="1"/>
      <svg x="8.5" y="8" width="13" height="13" viewBox="0 0 24 24" fill="none"
           stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${m.iconPath}</svg>
    </svg>`
  return L.divIcon({ html, className: 'rp-stop-pin-wrap', iconSize: [26, 30], iconAnchor: [13, 30] })
}



function clearStops()  { if (stopsLayer)  { map?.removeLayer(stopsLayer);  stopsLayer  = null } }
function clearRadius() { if (radiusLayer) { map?.removeLayer(radiusLayer); radiusLayer = null } }

/** Desenha os pins de ponto de parada com seus respectivos tipos. */
function drawStops(linhaId: string) {
  if (!L || !map) return
  clearStops()
  const stops = getStopsForLinha(linhaId)
  if (stops.length === 0) return
  stopsLayer = L.layerGroup().addTo(map)
  for (const s of stops) {
    L.marker(s.pos, { icon: stopPinIcon(s.tipo), zIndexOffset: 400 }).addTo(stopsLayer)
  }
}

/**
 * Desenha as cercas/raios de cada parada. Suporta dois modos:
 *  • mode='radius'  → círculo de raio N metros + 4 handles cardinais (N/E/S/O)
 *  • mode='polygon' → polígono fechado com handle em cada vértice
 */
function drawRadius(linhaId: string) {
  if (!L || !map) return
  clearRadius()
  const stops = getStopsForLinha(linhaId)
  if (stops.length === 0) return
  radiusLayer = L.layerGroup().addTo(map)

  for (const s of stops) {
    if (s.fence.mode === 'radius') {
      // Círculo + 4 handles em N/E/S/O
      L.circle(s.pos, {
        radius:      s.fence.radius,
        color:       FENCE_COLOR,
        fillColor:   FENCE_COLOR,
        fillOpacity: FENCE_FILL_OPACITY,
        weight:      2,
        interactive: false,
      }).addTo(radiusLayer)

    } else {
      // Polígono fechado
      L.polygon(s.fence.vertices, {
        color:       FENCE_COLOR,
        fillColor:   FENCE_COLOR,
        fillOpacity: FENCE_FILL_OPACITY,
        weight:      2,
        interactive: false,
      }).addTo(radiusLayer)

    }
  }
}

/**
 * Helper: dado um centro, um raio em metros e um bearing em graus,
 * retorna a coordenada deslocada. Aproximação suficiente para distâncias < 1km.
 */
function offsetLatLng(center: LatLng, radiusMeters: number, bearingDeg: number): LatLng {
  const R    = 6378137                                     // raio da Terra
  const δ    = radiusMeters / R
  const θ    = bearingDeg * Math.PI / 180
  const φ1   = center[0] * Math.PI / 180
  const λ1   = center[1] * Math.PI / 180
  const φ2   = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ))
  const λ2   = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
                                Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2))
  return [φ2 * 180 / Math.PI, λ2 * 180 / Math.PI]
}

// ── Ativos no mapa (Card 2 → Card 3) ─────────────────
function addAtivoToMap(a: AtivoSelecionado) {
  if (!L || !map) return
  // Trajeto HISTÓRICO do ativo (único por ativo, independe do itinerário do Card 1)
  const route = getRouteForAtivo(a.id)
  if (route.length < 2) return

  // Trail na COR DO ATIVO (mesma cor do marker e do play button no Card 3)
  const trail = L.polyline(route, { color: a.color, weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(map)

  // Breadcrumbs (cinza para futuro+passado — só o ativo atual fica colorido)
  const dots = L.layerGroup().addTo(map)
  for (let i = 0; i < route.length - 1; i += 2) {
    const angle    = bearing(route[i], route[i + 1])
    const cssAngle = 90 - angle
    const html = `
      <div class="trail-dot">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFFFFF"
             style="transform: rotate(${cssAngle}deg);">
          <path d="M12 2 L20 18 L12 14 L4 18 Z"/>
        </svg>
      </div>`
    const icon = L.divIcon({ html, className: 'trail-dot-wrap', iconSize: [16, 16], iconAnchor: [8, 8] })
    L.marker(route[i], { icon, interactive: false }).addTo(dots)
  }

  // Cada ativo começa em route[0] — o início real da sua trajetória histórica
  const initialPosIdx  = 0
  const initialPos     = route[initialPosIdx]
  const initialBearing = bearingAt(route, initialPosIdx)

  // Marker do ATIVO: cor do ativo + seta direcional, na posição espaçada
  const marker = L.marker(initialPos, { icon: ativoMarkerIcon(a.color, initialBearing), zIndexOffset: 700 }).addTo(map)
  const popup = L.popup({
    className:    'replay-popup',
    closeButton:  false,
    autoClose:    false,
    closeOnClick: false,
    offset:       [0, -16],
  }).setContent(buildPopupHtml(a, initialPosIdx))
  marker.bindPopup(popup)
  marker.openPopup()

  ativoLayers.set(a.id, {
    trail, dots, marker, popup, route,
    posIdx:        initialPosIdx,
    initialPosIdx,
  })
  map.fitBounds(trail.getBounds(), { padding: [60, 60] })
}

function removeAtivoFromMap(ativoId: string) {
  const layer = ativoLayers.get(ativoId)
  if (!layer || !map) return
  map.removeLayer(layer.trail)
  map.removeLayer(layer.dots)
  map.removeLayer(layer.marker)
  ativoLayers.delete(ativoId)
}

function setAtivoVisibleOnMap(ativoId: string, visible: boolean) {
  const layer = ativoLayers.get(ativoId)
  if (!layer || !map) return
  if (visible) {
    layer.trail.addTo(map)
    layer.dots.addTo(map)
    layer.marker.addTo(map)
  } else {
    map.removeLayer(layer.trail)
    map.removeLayer(layer.dots)
    map.removeLayer(layer.marker)
  }
}

// ════════════════════════════════════════════════════
// 6) Ações do usuário
// ════════════════════════════════════════════════════
function adicionar() {
  if (!canAdd.value) return
  const vehicle = mockVehicles.find(v => v.id === ativoSel.value)
  if (!vehicle) return

  const newAtivo: AtivoSelecionado = {
    id:           crypto.randomUUID(),
    vehicleId:    vehicle.id,
    plate:        vehicle.plate,
    // Card 1 é apenas contexto visual da rota planejada — pode estar vazio.
    // Os dados do ATIVO vêm da sua própria trajetória histórica.
    linhaId:      linhaSel.value      ?? '',
    itinerarioId: itinerarioSel.value ?? '',
    dataInicial:  dataInicial.value,
    dataFinal:    dataFinal.value,
    horaInicial:  horaInicial.value,
    horaFinal:    horaFinal.value,
    km:           '00.000,00km',
    color:        pickAtivoColor(),
    visible:      true,
  }
  ativosSelecionados.value.push(newAtivo)

  // adiciona o ativo no mapa (preview do Card 1 permanece — ele é independente)
  addAtivoToMap(newAtivo)

  // reseta APENAS o Card 2 (Card 1 mantém a seleção e o trajeto desenhado)
  ativoSel.value    = null
  dataInicial.value = ''
  dataFinal.value   = ''
  horaInicial.value = ''
  horaFinal.value   = ''
}

function removerAtivo(id: string) {
  removeAtivoFromMap(id)
  ativosSelecionados.value = ativosSelecionados.value.filter(a => a.id !== id)
}

/** Limpa o filtro do Card 1: linha + itinerário + preview no mapa. */
function clearCard1() {
  linhaSel.value      = null
  itinerarioSel.value = null
  clearPreview()
}

/** Limpa o filtro do Card 2: ativo + datas + horas (NÃO mexe no Card 1). */
function clearCard2() {
  ativoSel.value    = null
  dataInicial.value = ''
  dataFinal.value   = ''
  horaInicial.value = ''
  horaFinal.value   = ''
}

const card1HasFilter = computed(() => !!linhaSel.value || !!itinerarioSel.value)
const card2HasFilter = computed(() =>
  !!ativoSel.value || !!dataInicial.value || !!dataFinal.value ||
  !!horaInicial.value || !!horaFinal.value
)

function toggleVisivel(id: string) {
  const a = ativosSelecionados.value.find(x => x.id === id)
  if (!a) return
  a.visible = !a.visible
  setAtivoVisibleOnMap(id, a.visible)
}

// ── Player ───────────────────────────────────────────
function ativoIdFromLayer(target: AtivoMapLayer): string | undefined {
  for (const [id, l] of ativoLayers.entries()) if (l === target) return id
  return undefined
}

function updatePopupAt(layer: AtivoMapLayer, pos: LatLng) {
  const ativoId = ativoIdFromLayer(layer)
  const ativo   = ativosSelecionados.value.find(a => a.id === ativoId)
  if (!ativo) return
  layer.popup.setContent(buildPopupHtml(ativo, layer.posIdx))
  layer.popup.setLatLng(pos)
}

/** Atualiza posição + rotação do marker (seta aponta para o próximo waypoint). */
function syncMarker(layer: AtivoMapLayer, pos: LatLng) {
  const ativoId = ativoIdFromLayer(layer)
  const ativo   = ativosSelecionados.value.find(a => a.id === ativoId)
  if (!ativo) return
  layer.marker.setLatLng(pos)
  layer.marker.setIcon(ativoMarkerIcon(ativo.color, bearingAt(layer.route, layer.posIdx)))
}

function tick() {
  let anyMoving = false
  for (const layer of ativoLayers.values()) {
    if (layer.posIdx < layer.route.length - 1) {
      layer.posIdx++
      const pos = layer.route[layer.posIdx]
      syncMarker(layer, pos)
      updatePopupAt(layer, pos)
      anyMoving = true
    }
  }
  if (!anyMoving) stopPlay()
}

function startPlay() {
  if (ativoLayers.size === 0) return
  playing.value = true
  const interval = VELOCITY_MS[velocity.value] ?? 800
  playTimer = setInterval(tick, interval)
}

function stopPlay() {
  playing.value = false
  if (playTimer) { clearInterval(playTimer); playTimer = null }
}

function togglePlay()  { playing.value ? stopPlay() : startPlay() }

function resetPlay() {
  stopPlay()
  for (const layer of ativoLayers.values()) {
    // Volta para a posição inicial ESPAÇADA (não para o waypoint 0),
    // mantendo o espalhamento visual entre múltiplos ativos.
    layer.posIdx = layer.initialPosIdx
    const pos    = layer.route[layer.initialPosIdx]
    syncMarker(layer, pos)
    updatePopupAt(layer, pos)
  }
}

function stepBack() {
  for (const layer of ativoLayers.values()) {
    if (layer.posIdx > 0) {
      layer.posIdx--
      const pos = layer.route[layer.posIdx]
      syncMarker(layer, pos)
      updatePopupAt(layer, pos)
    }
  }
}

function stepForward() { tick() }

// ════════════════════════════════════════════════════
// 7) Watchers
// ════════════════════════════════════════════════════
// Trocar de linha reseta itinerário
watch(linhaSel, () => { itinerarioSel.value = null })

// Trajeto preview do Card 1 é INDEPENDENTE dos Cards 2/3.
// Regra: só desenha (substituindo o anterior) quando há um par (linha+itinerário)
// VÁLIDO. Estados parciais (ex.: linha trocada mas itinerário ainda nulo) NÃO
// limpam o trajeto — ele permanece até ser substituído por uma nova seleção.
watch([linhaSel, itinerarioSel], () => {
  if (!map) return
  if (linhaSel.value && itinerarioSel.value) {
    drawPreview(linhaSel.value)
  }
  // else: mantém o último preview visível
})

// Trocar velocidade durante play → reinicia timer
watch(velocity, () => { if (playing.value) { stopPlay(); startPlay() } })

// Toggles "Ponto de parada" / "Raio" → só ativos com itinerário selecionado
watch([itinerarioSel, showPontosParada], () => {
  if (!map) return
  if (itinerarioSel.value && linhaSel.value && showPontosParada.value) drawStops(linhaSel.value)
  else                                                                  clearStops()
})
watch([itinerarioSel, showRaio], () => {
  if (!map) return
  if (itinerarioSel.value && linhaSel.value && showRaio.value) drawRadius(linhaSel.value)
  else                                                         clearRadius()
})

// Limpa overlays e reseta toggles ao desselecionar itinerário
watch(itinerarioSel, (val) => {
  if (!val) {
    showPontosParada.value = false
    showRaio.value         = false
    clearStops()
    clearRadius()
  }
})

// ════════════════════════════════════════════════════
// 8) Ciclo de vida do mapa
// ════════════════════════════════════════════════════
onMounted(async () => {
  const leaflet = await import('leaflet')
  await import('leaflet/dist/leaflet.css')
  L = leaflet.default ?? leaflet

  map = L.map('replay-map', {
    center: [-8.0476, -34.8770],
    zoom: 13,
    zoomControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  setTimeout(() => map?.invalidateSize(), 150)
})

onUnmounted(() => {
  stopPlay()
  map?.remove()
  map = null
})
</script>

<template>
  <div class="replay-page">
    <PageHeader
      title="Monitoramento"
      :tabs="[{ label: 'Replay', to: '/replay' }]"
    />

    <div class="replay__body">
      <!-- ── Mapa ── -->
      <div class="replay__map-wrap">
        <div id="replay-map" class="replay__map" />

        <!-- ── Player de replay (canto sup. esq.) ───────────────
             3 pills brancas dentro de container azul com gradiente. -->
        <div class="rp-player">
          <!-- Pill 1: Play / Pause / Stop -->
          <div class="rp-player__pill">
            <button class="rp-player__btn"
                    :class="{ 'rp-player__btn--active': playing }"
                    title="Play" @click="startPlay">
              <Play :size="14" />
            </button>
            <span class="rp-player__divider" />
            <button class="rp-player__btn" title="Pausar" @click="stopPlay">
              <Pause :size="14" />
            </button>
            <span class="rp-player__divider" />
            <button class="rp-player__btn" title="Parar (volta ao início)" @click="resetPlay">
              <Square :size="14" />
            </button>
          </div>

          <!-- Pill 2: Skip back / Skip forward -->
          <div class="rp-player__pill">
            <button class="rp-player__btn" title="Passo atrás" @click="stepBack">
              <SkipBack :size="14" />
            </button>
            <span class="rp-player__divider" />
            <button class="rp-player__btn" title="Passo à frente" @click="stepForward">
              <SkipForward :size="14" />
            </button>
          </div>

          <!-- Pill 3: Velocidade -->
          <div class="rp-player__pill rp-player__pill--velocity">
            <span class="rp-player__velocity-label">Velocidade:</span>
            <UiSelect
              v-model="velocity"
              :options="velocityOptions"
              class="rp-player__velocity-select"
            />
          </div>
        </div>

        <!-- ── Toggles do itinerário — só aparece com itinerário ativo ── -->
        <div v-if="itinerarioSel" class="rp-toggles">
          <label class="rp-toggle">
            <input type="checkbox" v-model="showRaio" />
            <span class="rp-toggle__box"></span>
            <span class="rp-toggle__label">Raio</span>
          </label>
          <label class="rp-toggle">
            <input type="checkbox" v-model="showPontosParada" />
            <span class="rp-toggle__box"></span>
            <span class="rp-toggle__label">Ponto de parada</span>
          </label>
        </div>
      </div>

      <!-- ── Side panel: 3 cards ── -->
      <aside class="replay__side">

        <!-- ────── Card 1 — Adicionar itinerário ────── -->
        <section class="rc">
          <header class="rc__head">
            <span class="rc__head-icon"><Flag :size="14" /></span>
            <h2 class="rc__head-title">Adicionar itinerário</h2>
            <button
              class="rc__head-clear"
              type="button"
              title="Limpar filtro"
              :disabled="!card1HasFilter"
              @click="clearCard1"
            >
              <FilterX :size="14" />
            </button>
          </header>

          <div class="rc__body">
            <div class="rc__field">
              <label class="rc__label">Linha</label>
              <UiSelect
                v-model="linhaSel"
                :options="linhaOptions"
                placeholder="Selecione uma opção"
              />
            </div>
            <div class="rc__field">
              <label class="rc__label">Itinerário:</label>
              <UiSelect
                v-model="itinerarioSel"
                :options="itinerarioOptions"
                placeholder="Selecione uma opção"
                :disabled="!linhaSel"
              />
            </div>
          </div>
        </section>

        <!-- ────── Card 2 — Adicionar ativo ────── -->
        <section class="rc">
          <header class="rc__head">
            <span class="rc__head-icon"><Bus :size="14" /></span>
            <h2 class="rc__head-title">Adicionar ativo</h2>
            <button
              class="rc__head-clear"
              type="button"
              title="Limpar filtro"
              :disabled="!card2HasFilter"
              @click="clearCard2"
            >
              <FilterX :size="14" />
            </button>
          </header>

          <div class="rc__body">
            <div class="rc__field">
              <label class="rc__label">Ativo</label>
              <UiSelect
                v-model="ativoSel"
                :options="ativoOptions"
                placeholder="Selecione uma opção"
              />
            </div>

            <div class="rc__row">
              <div class="rc__field">
                <label class="rc__label">Data inicial:*</label>
                <UiInput
                  v-model="dataInicial"
                  type="date"
                  placeholder="00/00/00"
                />
              </div>
              <div class="rc__field">
                <label class="rc__label">Data final:*</label>
                <UiInput
                  v-model="dataFinal"
                  type="date"
                  placeholder="00/00/00"
                />
              </div>
            </div>

            <div class="rc__row">
              <div class="rc__field">
                <label class="rc__label">Hora inicial:*</label>
                <UiInput
                  v-model="horaInicial"
                  type="time"
                  placeholder="00:00"
                />
              </div>
              <div class="rc__field">
                <label class="rc__label">Hora final:*</label>
                <UiInput
                  v-model="horaFinal"
                  type="time"
                  placeholder="00:00"
                />
              </div>
            </div>

            <div class="rc__actions">
              <UiButton
                :disabled="!canAdd"
                size="sm"
                @click="adicionar"
              >
                <template #icon-left><Plus :size="14" /></template>
                Adicionar
              </UiButton>
            </div>
          </div>
        </section>

        <!-- ────── Card 3 — Ativos selecionados ────── -->
        <section class="rc rc--scrollable">
          <header class="rc__head">
            <span class="rc__head-icon"><ListChecks :size="14" /></span>
            <h2 class="rc__head-title">Ativos selecionados</h2>
          </header>

          <div class="rc__body rc__body--list">
            <p v-if="ativosSelecionados.length === 0" class="rc__empty">
              Nenhum ativo adicionado
            </p>

            <div
              v-for="a in ativosSelecionados"
              :key="a.id"
              class="rc-item"
            >
              <span
                class="rc-item__play"
                :style="{ background: a.color }"
              >
                <Play :size="10" color="white" fill="white" />
              </span>
              <span class="rc-item__plate">[{{ a.plate }}]</span>
              <span class="rc-item__km">{{ a.km }}</span>
              <div class="rc-item__actions">
                <button class="rc-item__act rc-item__act--danger" @click="removerAtivo(a.id)">
                  <X :size="14" />
                </button>
                <button class="rc-item__act">
                  <Pencil :size="14" />
                </button>
                <button class="rc-item__act" @click="toggleVisivel(a.id)">
                  <Eye :size="14" />
                </button>
                <button class="rc-item__act">
                  <Upload :size="14" />
                </button>
              </div>
            </div>
          </div>
        </section>

      </aside>
    </div>
  </div>
</template>

<style scoped>
.replay-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ── Body: map + side panel ─────────────────────── */
.replay__body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.replay__map-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}
.replay__map {
  position: absolute;
  inset: 0;
}

/* ── Player de replay ────────────────────────────────
   Container com gradiente azul (cyan → navy) + pills brancas internas. */
.rp-player {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2CC5C9 0%, #1F3A8A 55%, #0F1E3D 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.rp-player__pill {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 6px;
  overflow: hidden;
  height: 32px;
}

.rp-player__btn {
  width: 36px;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #1F1F1F;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.rp-player__btn:hover     { background: #F2F2F2; }
.rp-player__btn:active    { background: #E5E5E5; }
.rp-player__btn--active   { color: #2D6BFF; }

.rp-player__divider {
  width: 1px;
  height: 18px;
  background: #E5E5E5;
  flex-shrink: 0;
}

/* Pill de velocidade — texto + select inline */
.rp-player__pill--velocity {
  padding: 0 12px;
  gap: 8px;
  height: 32px;
}
.rp-player__velocity-label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #1F1F1F;
  white-space: nowrap;
}
.rp-player__velocity-select {
  min-width: 56px;
}
.rp-player__velocity-select :deep(.ui-select__field) {
  height: 24px;
  padding: 0 8px;
  border: none;
  background: transparent;
  font-weight: 700;
}
.rp-player__velocity-select :deep(.ui-select__field):focus,
.rp-player__velocity-select :deep(.ui-select--open .ui-select__field) {
  border-color: transparent;
  outline: none;
}

/* ── Toggles do itinerário ───────────────────────────
   Painel canto sup. dir. com mesmo gradiente do player. */
.rp-toggles {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 500;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2CC5C9 0%, #1F3A8A 55%, #0F1E3D 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.rp-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}
.rp-toggle input { position: absolute; opacity: 0; pointer-events: none; }

.rp-toggle__box {
  width: 18px;
  height: 18px;
  border: 2px solid #FFFFFF;
  border-radius: 4px;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}
.rp-toggle input:checked + .rp-toggle__box {
  background: #FFFFFF;
}
.rp-toggle input:checked + .rp-toggle__box::after {
  content: '';
  width: 10px;
  height: 6px;
  border-left: 2px solid #1F3A8A;
  border-bottom: 2px solid #1F3A8A;
  transform: rotate(-45deg) translate(1px, -1px);
}

.rp-toggle__label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #FFFFFF;
  white-space: nowrap;
}
.rp-toggle:hover .rp-toggle__box { border-color: rgba(255,255,255,0.85); }

/* ── Side panel ─────────────────────────────────── */
.replay__side {
  width: 320px;
  flex-shrink: 0;
  background: var(--color-neutral-50, #F8F8F8);
  border-left: 1px solid var(--color-neutral-200);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;        /* permite que filhos com flex encolham */
  overflow: hidden;     /* o scroll fica no Card 3, não no side inteiro */
}

/* ── Card (rc = replay-card) ────────────────────── */
.rc {
  background: #FFFFFF;
  border: 1px solid var(--color-neutral-200);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;       /* Cards 1 e 2 nunca encolhem */
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Card 3 — toma o espaço restante e a LISTA rola internamente */
.rc--scrollable {
  flex: 1 1 0;          /* ocupa o restante do side panel */
  min-height: 120px;
}
.rc--scrollable .rc__body--list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: #D4D4D4 transparent;
}
.rc--scrollable .rc__body--list::-webkit-scrollbar { width: 4px; }
.rc--scrollable .rc__body--list::-webkit-scrollbar-thumb {
  background: #D4D4D4;
  border-radius: 4px;
}

/* Header — barra clara com ícone, título e action */
.rc__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #F8FAFC;
  border-bottom: 1px solid var(--color-neutral-200);
}
.rc__head-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2D6BFF;
  flex-shrink: 0;
}
.rc__head-title {
  flex: 1;
  margin: 0;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #1F1F1F;
}
/* Botão "Limpar filtro" no header do card (substitui a antiga bandeira decorativa) */
.rc__head-clear {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-neutral-500);
  cursor: pointer;
  border-radius: 4px;
  flex-shrink: 0;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.rc__head-clear:hover:not(:disabled) {
  background: var(--color-neutral-100);
  color: var(--color-neutral-900);
}
.rc__head-clear:disabled {
  color: var(--color-neutral-300);
  cursor: not-allowed;
}

/* Body */
.rc__body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rc__body--list {
  gap: 8px;
}

.rc__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}
.rc__row {
  display: flex;
  gap: 8px;
}

.rc__label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-neutral-700);
}

.rc__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

/* Empty state */
.rc__empty {
  margin: 0;
  padding: 8px 0;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--color-neutral-400);
  text-align: center;
}

/* Item da lista (card 3) */
.rc-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  min-width: 0;          /* permite truncamento dos filhos */
  flex-shrink: 0;        /* não encolhe verticalmente quando há muitos */
}
.rc-item__play {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}
.rc-item__plate {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #1F1F1F;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1 1 auto;        /* só a placa encolhe; restante mantém */
}
.rc-item__km {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #1F1F1F;
  flex-shrink: 0;
  white-space: nowrap;
}
.rc-item__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}
.rc-item__act {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-neutral-600);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
  flex-shrink: 0;
}
.rc-item__act:hover {
  background: var(--color-neutral-100);
  color: var(--color-neutral-900);
}
.rc-item__act--danger { color: #EF4444; }
.rc-item__act--danger:hover { background: rgba(239, 68, 68, 0.08); color: #DC2626; }

/* Selects/Inputs dentro dos cards: 32px de altura, compactos */
.rc__body :deep(.ui-select__field) {
  height: 32px;
  font-size: 13px;
}
.rc__body :deep(.ui-input__field) {
  height: 32px;
  font-size: 13px;
  padding: 0 10px;
}
.rc__body :deep(.ui-input) {
  gap: 0;
}
.rc__body :deep(.ui-input__label) {
  display: none; /* usamos a .rc__label externa */
}
</style>

<!-- ── Estilos globais p/ overlays do mapa (Leaflet usa o body) ── -->
<style>
/* Setas de ponta das polylines de Ida/Volta */
.arrow-tip-wrap { background: transparent; border: none; }
.arrow-tip {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25));
}

/* Chevrons direcionais ao longo da rota (menores que a seta de ponta) */
.chevron-wrap { background: transparent; border: none; }
.chevron {
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
}

/* Badge de INÍCIO de rota (pílula com texto IDA / VOLTA) */
.route-badge-wrap { background: transparent; border: none; }
.route-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 7px;
  border-radius: 999px;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  white-space: nowrap;
  border: 2px solid #FFFFFF;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  /* Desloca a badge para a direita do ponto inicial */
  transform: translateX(-8px);
}
.route-badge__dot {
  width: 6px;
  height: 6px;
  background: #FFFFFF;
  border-radius: 50%;
  flex-shrink: 0;
}
.route-badge__text { line-height: 1; }

/* Pino de FIM (check ✓ pequeno color-coded) */
.route-endpin-wrap { background: transparent; border: none; }
.route-endpin {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2.5px solid #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

/* Bolinhas direcionais ao longo do trail */
.trail-dot-wrap { background: transparent; border: none; }
.trail-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #9CA3AF;
  border: 1.5px solid #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}


/* Wrap dos pins de ponto de parada (sem chrome do Leaflet) */
.rp-stop-pin-wrap { background: transparent !important; border: none !important; }

/* Marker do ATIVO (posição atual): círculo color-coded + seta direcional */
.ativo-marker-wrap { background: transparent; border: none; }
.ativo-marker {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}

/* ── Popup do card de posição ───────────────────────
   Sobrescreve o padding/border padrão do .leaflet-popup-content-wrapper
   para usarmos nosso próprio chrome (.rp). */
.leaflet-popup.replay-popup .leaflet-popup-content-wrapper {
  background: transparent;
  box-shadow: none;
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
}
.leaflet-popup.replay-popup .leaflet-popup-content {
  margin: 0;
  padding: 0;
  width: auto !important;
}
.leaflet-popup.replay-popup .leaflet-popup-tip-container,
.leaflet-popup.replay-popup .leaflet-popup-tip {
  display: none;   /* sem "tip" — o card flutua próximo ao marker */
}

.rp {
  width: 320px;
  background: #FFFFFF;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.rp__head {
  background: #0F1E3D;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
}
.rp__title {
  flex: 1;
  font-size: 13px;
  font-weight: 700;
  color: #FFFFFF;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rp__close {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #FFFFFF;
  cursor: pointer;
  border-radius: 4px;
  flex-shrink: 0;
}
.rp__close:hover { background: rgba(255, 255, 255, 0.1); }

.rp__body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #FFFFFF;
}
.rp__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.rp__col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.rp__label {
  font-size: 12px;
  font-weight: 700;
  color: #1F1F1F;
  line-height: 1.3;
}
.rp__value {
  font-size: 12px;
  font-weight: 400;
  color: #404040;
  line-height: 1.4;
}
.rp__badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  background: #E8F5E9;
  color: #2E7D32;
  font-size: 12px;
  font-weight: 700;
  border-radius: 20px;
  flex-shrink: 0;
  align-self: center;
}
</style>
