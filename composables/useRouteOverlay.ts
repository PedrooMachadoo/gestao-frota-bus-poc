/**
 * useRouteOverlay — desenha overlays de itinerário no mapa Leaflet.
 *
 * Centraliza toda a lógica visual compartilhada entre as telas
 *   • Replay  (1 linha por vez, modo preview)
 *   • Ao vivo (N linhas simultâneas, baseado nos veículos selecionados)
 *
 * IMPORTANTE: qualquer ajuste de visual (cores, espessuras, ícones)
 * deve ser feito AQUI — as duas telas consomem este mesmo módulo.
 *
 * CSS dos overlays (badges, chevrons, pinos, handles) vive em
 *   assets/css/route-overlay.css
 * registrado globalmente em `nuxt.config.ts`.
 */

import {
  getRouteForLinha,
  getStopsForLinha,
  type LatLng,
  type Stop,
  type StopTipo,
} from '~/data/replay-routes.mock'

// ── Cores de regra de negócio (transporte urbano) ──────────
export const IDA_COLOR    = '#2D6BFF'   // azul
export const VOLTA_COLOR  = '#16A34A'   // verde

// Opacidade da cerca — a COR vem da direção da parada (ida = azul, volta = verde),
// alinhando visualmente o sentido do trajeto com sua geofence.
const FENCE_FILL_OPACITY = 0.18

function fenceColorFor(direction: 'ida' | 'volta'): string {
  return direction === 'volta' ? VOLTA_COLOR : IDA_COLOR
}

/**
 * Metadata de cada tipo de ponto — espelha o módulo Pontos:
 *   • dotBg / balloonColor: cores do pin
 *   • iconPath: SVG path do ícone Lucide correspondente
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

// ── Helpers de geometria ───────────────────────────────────
export function bearing(from: LatLng, to: LatLng): number {
  return Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI
}

export function offsetLatLng(center: LatLng, radiusMeters: number, bearingDeg: number): LatLng {
  const R    = 6378137
  const δ    = radiusMeters / R
  const θ    = bearingDeg * Math.PI / 180
  const φ1   = center[0] * Math.PI / 180
  const λ1   = center[1] * Math.PI / 180
  const φ2   = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ))
  const λ2   = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
                                Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2))
  return [φ2 * 180 / Math.PI, λ2 * 180 / Math.PI]
}

// ── Builders de ícones (todos retornam L.divIcon) ──────────
function arrowTipIcon(L: any, color: string, bearingDeg: number) {
  const cssAngle = 90 - bearingDeg
  const html = `
    <div class="arrow-tip" style="transform: rotate(${cssAngle}deg);">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${color}">
        <path d="M12 2 L20 18 L12 14 L4 18 Z"/>
      </svg>
    </div>`
  return L.divIcon({ html, className: 'arrow-tip-wrap', iconSize: [18, 18], iconAnchor: [9, 9] })
}

function routeStartBadgeIcon(L: any, text: string, color: string) {
  const html = `
    <div class="route-badge route-badge--start" style="background:${color};">
      <span class="route-badge__dot"></span>
      <span class="route-badge__text">${text}</span>
    </div>`
  return L.divIcon({
    html,
    className:  'route-badge-wrap',
    iconSize:   [56, 22],
    iconAnchor: [0, 11],
  })
}

function stopPinIcon(L: any, tipo: StopTipo) {
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

// ──────────────────────────────────────────────────────────
// API pública: drawers individuais (cada um retorna o layerGroup
// criado, pra quem chama poder remover depois).
// ──────────────────────────────────────────────────────────

/** Opções de renderização do preview de linha. */
export interface PreviewOptions {
  /**
   * Modo "minimal": só polylines (sem badges, setas e chevrons).
   * Usado quando MÚLTIPLAS linhas são desenhadas simultaneamente
   * (ex.: Ao vivo com várias linhas ativas) — evita poluição visual.
   * Default: false (modo rich, com toda a decoração).
   */
  minimal?: boolean
}

/** Desenha as duas polylines (Ida azul + Volta verde). */
export function drawLinhaPreview(
  L: any,
  map: any,
  linhaId: string,
  opts: PreviewOptions = {},
): any {
  const seg   = getRouteForLinha(linhaId)
  const group = L.layerGroup().addTo(map)

  // Em minimal mode, linha mais fina + opacidade reduzida pra não dominar visualmente
  const weight  = opts.minimal ? 4    : 5
  const opacity = opts.minimal ? 0.7  : 0.95

  L.polyline(seg.ida,   { color: IDA_COLOR,   weight, opacity, lineCap: 'round', lineJoin: 'round' }).addTo(group)
  L.polyline(seg.volta, { color: VOLTA_COLOR, weight, opacity, lineCap: 'round', lineJoin: 'round' }).addTo(group)

  // Em modo minimal, paramos aqui (sem badges/setas)
  if (opts.minimal) return group

  // ── Modo rich: setas nas pontas + badges IDA/VOLTA ──
  const idaEnd  = seg.ida[seg.ida.length - 1]
  const idaPrev = seg.ida[seg.ida.length - 2]
  L.marker(idaEnd, {
    icon:        arrowTipIcon(L, IDA_COLOR, bearing(idaPrev, idaEnd)),
    interactive: false,
  }).addTo(group)

  const voltaEnd  = seg.volta[seg.volta.length - 1]
  const voltaPrev = seg.volta[seg.volta.length - 2]
  L.marker(voltaEnd, {
    icon:        arrowTipIcon(L, VOLTA_COLOR, bearing(voltaPrev, voltaEnd)),
    interactive: false,
  }).addTo(group)

  L.marker(seg.ida[0], {
    icon:         routeStartBadgeIcon(L, 'IDA', IDA_COLOR),
    interactive:  false,
    zIndexOffset: 600,
  }).addTo(group)
  L.marker(seg.volta[0], {
    icon:         routeStartBadgeIcon(L, 'VOLTA', VOLTA_COLOR),
    interactive:  false,
    zIndexOffset: 600,
  }).addTo(group)

  return group
}

/** Desenha os pinos de ponto de parada com seus respectivos tipos. */
export function drawLinhaStops(L: any, map: any, linhaId: string): any | null {
  const stops = getStopsForLinha(linhaId)
  if (stops.length === 0) return null
  const group = L.layerGroup().addTo(map)
  for (const s of stops) {
    L.marker(s.pos, { icon: stopPinIcon(L, s.tipo), zIndexOffset: 400 }).addTo(group)
  }
  return group
}

/**
 * Desenha as cercas (raio circular OU polígono) — apenas a forma,
 * SEM handles de vértice. A COR de cada cerca segue a direção da parada:
 *   • ida   → azul   (IDA_COLOR)
 *   • volta → verde  (VOLTA_COLOR)
 *
 * Replay e Ao vivo são telas de visualização — a edição da cerca (com
 * handles arrastáveis) acontece no módulo Planejamento → Ponto de parada.
 */
export function drawLinhaFences(L: any, map: any, linhaId: string): any | null {
  const stops = getStopsForLinha(linhaId)
  if (stops.length === 0) return null
  const group = L.layerGroup().addTo(map)

  for (const s of stops) {
    const color = fenceColorFor(s.direction)
    if (s.fence.mode === 'radius') {
      L.circle(s.pos, {
        radius:      s.fence.radius,
        color,
        fillColor:   color,
        fillOpacity: FENCE_FILL_OPACITY,
        weight:      2,
        interactive: false,
      }).addTo(group)
    } else {
      L.polygon(s.fence.vertices, {
        color,
        fillColor:   color,
        fillOpacity: FENCE_FILL_OPACITY,
        weight:      2,
        interactive: false,
      }).addTo(group)
    }
  }
  return group
}

// ──────────────────────────────────────────────────────────
// Manager: sincroniza um CONJUNTO de linhas no mapa.
// Usado pelo Ao vivo (N linhas ativas) e pelo Replay (set de 1 ou 0).
// ──────────────────────────────────────────────────────────

export interface RouteOverlayManager {
  /** Configura Leaflet + map (chamado após onMounted do mapa). */
  init(L: any, map: any): void
  /** Sincroniza o set de linhas com preview (Ida/Volta) visível.
   *  `opts.minimal: true` desenha SÓ as polylines (uso em Ao vivo). */
  syncLinhas(linhaIds: string[], opts?: PreviewOptions): void
  /** Sincroniza o set de linhas com pontos de parada visíveis. */
  syncStops(linhaIds: string[]): void
  /** Sincroniza o set de linhas com cercas (raio + polígono) visíveis. */
  syncFences(linhaIds: string[]): void
  /** Remove todas as camadas (chamado no onUnmounted). */
  destroy(): void
}

export function createRouteOverlayManager(): RouteOverlayManager {
  let L: any = null
  let map: any = null
  const linhas      = new Map<string, any>()
  const stops       = new Map<string, any>()
  const fences      = new Map<string, any>()
  let   linhaOpts: PreviewOptions = {}

  function syncSet(
    wanted: string[],
    current: Map<string, any>,
    drawFn: (id: string) => any | null,
  ) {
    if (!L || !map) return
    const wantedSet = new Set(wanted)
    for (const id of [...current.keys()]) {
      if (!wantedSet.has(id)) {
        const layer = current.get(id)
        if (layer) map.removeLayer(layer)
        current.delete(id)
      }
    }
    for (const id of wanted) {
      if (current.has(id)) continue
      const layer = drawFn(id)
      if (layer) current.set(id, layer)
    }
  }

  function clearAll(current: Map<string, any>) {
    if (!map) return
    for (const layer of current.values()) map.removeLayer(layer)
    current.clear()
  }

  return {
    init(_L, _map) { L = _L; map = _map },
    syncLinhas(ids, opts) {
      // Se as opções mudaram (ex.: minimal toggle), recria tudo
      const newOpts = opts ?? {}
      if (newOpts.minimal !== linhaOpts.minimal) {
        clearAll(linhas)
        linhaOpts = newOpts
      }
      syncSet(ids, linhas, id => drawLinhaPreview(L, map, id, linhaOpts))
    },
    syncStops(ids)  { syncSet(ids, stops,  id => drawLinhaStops(L, map, id)) },
    syncFences(ids) { syncSet(ids, fences, id => drawLinhaFences(L, map, id)) },
    destroy() {
      clearAll(linhas)
      clearAll(stops)
      clearAll(fences)
      L = null
      map = null
      linhaOpts = {}
    },
  }
}
