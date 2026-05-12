<script setup lang="ts">
import { onMounted, onUnmounted, nextTick } from 'vue'
import { Upload, ChevronDown, Trash2, Home, Bus, MapPin, Users, Crosshair } from 'lucide-vue-next'
import type { TipoPontoOption } from '~/components/PontoTipoSelect.vue'
import veiculoSvgRaw from '~/components/ui/veiculo.svg?raw'

definePageMeta({ title: 'Planejamento' })

// ── Tabs ──────────────────────────────────────────────
const tabs = [
  { label: 'Linha', to: '/linhas' },
  { label: 'Ponto de Parada', to: '/pontos' },
]

// ── Edit panel state ──────────────────────────────────
const editingPonto  = ref(false)
const pontoForm = reactive({
  tipo:     null as string | null,
  nome:     '',
  codigo:   '',
  endereco: '',
  lat:      '',
  lng:      '',
})

// ── Saved ponto registry — clicking a marker re-opens it for edit ─────
interface SavedPonto {
  id: string
  data: {
    tipo:     string | null
    nome:     string
    codigo:   string
    endereco: string
    lat:      string
    lng:      string
  }
  cerca: {
    mode:    'radius' | 'polygon'
    radius:  number
    polygon: { lat: number; lng: number }[]
  }
  marker: any  // L.Marker instance
}
const savedPontos: SavedPonto[] = []
let editingId: string | null    = null   // null = creating new; otherwise = SavedPonto.id
let editBackup: SavedPonto | null = null  // pristine copy to restore on cancel

function makePontoId() {
  return Math.random().toString(36).slice(2, 10)
}

// ── Tipos de ponto — icon = aparência no mapa ─────────
const tipoOptions: TipoPontoOption[] = [
  {
    value:        'garagem',
    label:        'Garagem',
    dotBg:        '#1F2937',
    balloonColor: '#1B3A6B',
    icon:         Home,
  },
  {
    value:        'terminal',
    label:        'Terminal',
    dotBg:        '#D97706',
    balloonColor: '#B45309',
    icon:         Bus,
  },
  {
    value:        'parada',
    label:        'Ponto de parada',
    dotBg:        '#6B7280',
    balloonColor: '#4B5563',
    icon:         MapPin,
  },
  {
    value:        'outros',
    label:        'Outros',
    dotBg:        '#374151',
    balloonColor: '#374151',
    icon:         Users,
  },
]

const selectedTipo = computed(() =>
  tipoOptions.find(t => t.value === pontoForm.tipo) ?? null
)

// ── Context menu state ────────────────────────────────
const ctxMenu = reactive({
  visible: false,
  x:       0,
  y:       0,
  latlng:  null as { lat: number; lng: number } | null,
})

// ── Map refs (outside Vue reactivity) ─────────────────
let mapInstance: any = null
let L: any = null
let currentMarker: any = null

// ── Cerca (geofence) state ────────────────────────────
type CercaMode = 'radius' | 'polygon'
const cerca = reactive({
  mode:   'radius' as CercaMode,
  radius: 150 as number,                                   // meters
  polygon: [] as { lat: number; lng: number }[],
})
let cercaLayer: any = null
let cercaHandles: any[]    = []   // corner/vertex handles
let cercaMidHandles: any[] = []   // midpoint handles (polygon mode only)
let cercaCenter: { lat: number; lng: number } | null = null   // current center (radius mode)

// Approximate offset in lat/lng degrees for a given distance (m) at a center
function offsetLatLng(center: { lat: number; lng: number }, distance: number, bearingDeg: number) {
  const dLat = 1 / 111320
  const dLng = 1 / (111320 * Math.cos(center.lat * Math.PI / 180))
  const θ = bearingDeg * Math.PI / 180
  return {
    lat: center.lat + distance * dLat * Math.cos(θ),
    lng: center.lng + distance * dLng * Math.sin(θ),
  }
}

function cercaHandleIcon() {
  return L.divIcon({
    html:      '<div class="cerca-handle"></div>',
    className: 'cerca-handle-icon',
    iconSize:  [16, 16],
    iconAnchor:[8, 8],
  })
}

function cercaMidHandleIcon() {
  return L.divIcon({
    html:      '<div class="cerca-handle cerca-handle--mid" title="Clique para adicionar âncora">+</div>',
    className: 'cerca-handle-icon',
    iconSize:  [14, 14],
    iconAnchor:[7, 7],
  })
}

const RADIUS_BEARINGS = [0, 90, 180, 270] // N, E, S, W

function createRadiusCerca(center: { lat: number; lng: number }) {
  cercaCenter = { ...center }

  cercaLayer = L.circle([center.lat, center.lng], {
    radius:      cerca.radius,
    color:       '#2D6BFF',
    weight:      2,
    fillColor:   '#2D6BFF',
    fillOpacity: 0.18,
    interactive: false,
  }).addTo(mapInstance)

  cercaHandles = RADIUS_BEARINGS.map((bearing) => {
    const p = offsetLatLng(center, cerca.radius, bearing)
    const handle = L.marker([p.lat, p.lng], {
      icon:         cercaHandleIcon(),
      draggable:    true,
      zIndexOffset: 800,
    }).addTo(mapInstance)

    handle.on('drag', () => {
      if (!cercaCenter) return
      const newPos = handle.getLatLng()
      const newR = Math.max(15, mapInstance.distance([cercaCenter.lat, cercaCenter.lng], newPos))
      cerca.radius = Math.round(newR)
      cercaLayer.setRadius(newR)
      repositionRadiusHandles()
    })
    return handle
  })
}

function repositionRadiusHandles() {
  if (!cercaCenter) return
  cercaHandles.forEach((h, i) => {
    const p = offsetLatLng(cercaCenter!, cerca.radius, RADIUS_BEARINGS[i])
    h.setLatLng([p.lat, p.lng])
  })
}

// Move the radius cerca center to a new pin location (no-op for polygon mode)
function moveRadiusCercaCenter(newCenter: { lat: number; lng: number }) {
  if (cerca.mode !== 'radius' || !cercaLayer) return
  cercaCenter = { ...newCenter }
  cercaLayer.setLatLng([newCenter.lat, newCenter.lng])
  repositionRadiusHandles()
}

// ── Geometry helpers (used to constrain pin inside polygon cerca) ─────
type LL = { lat: number; lng: number }

function isPointInPolygon(p: LL, poly: LL[]): boolean {
  if (poly.length < 3) return true
  let inside = false
  const x = p.lng, y = p.lat
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lng, yi = poly[i].lat
    const xj = poly[j].lng, yj = poly[j].lat
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

function closestPointOnSegment(p: LL, a: LL, b: LL): LL {
  const dx = b.lng - a.lng
  const dy = b.lat - a.lat
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return { lat: a.lat, lng: a.lng }
  let t = ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return { lat: a.lat + t * dy, lng: a.lng + t * dx }
}

function polygonCentroid(poly: LL[]): LL {
  const sum = poly.reduce((acc, v) => ({ lat: acc.lat + v.lat, lng: acc.lng + v.lng }), { lat: 0, lng: 0 })
  return { lat: sum.lat / poly.length, lng: sum.lng / poly.length }
}

// Pull the clamped point slightly toward the centroid so it sits inside,
// not exactly on the edge (avoids visual ambiguity + future isInside checks).
function clampInsidePolygon(p: LL, poly: LL[]): LL {
  if (poly.length < 3 || isPointInPolygon(p, poly)) return p

  let best = poly[0]
  let bestDist = Infinity
  for (let i = 0; i < poly.length; i++) {
    const cp = closestPointOnSegment(p, poly[i], poly[(i + 1) % poly.length])
    const dx = p.lng - cp.lng, dy = p.lat - cp.lat
    const d = dx * dx + dy * dy
    if (d < bestDist) { bestDist = d; best = cp }
  }

  const c = polygonCentroid(poly)
  const k = 0.001  // 0.1% pull toward centroid — tiny but reliably inside
  return { lat: best.lat + (c.lat - best.lat) * k, lng: best.lng + (c.lng - best.lng) * k }
}

// Force the current pin inside the current polygon cerca (used after vertex drag)
function enforcePinInsidePolygon() {
  if (cerca.mode !== 'polygon' || !currentMarker || cerca.polygon.length < 3) return
  const ll = currentMarker.getLatLng()
  const p  = { lat: ll.lat, lng: ll.lng }
  if (isPointInPolygon(p, cerca.polygon)) return
  const clamped = clampInsidePolygon(p, cerca.polygon)
  currentMarker.setLatLng([clamped.lat, clamped.lng])
  pontoForm.lat = clamped.lat.toFixed(6)
  pontoForm.lng = clamped.lng.toFixed(6)
}

// Translate the entire polygon cerca (vertices + handles) by a lat/lng delta.
// Used when the pin is "teleported" (forward-geocode) and would land outside.
function translatePolygonCerca(dLat: number, dLng: number) {
  if (!cercaLayer || cerca.polygon.length === 0) return
  cerca.polygon = cerca.polygon.map(v => ({ lat: v.lat + dLat, lng: v.lng + dLng }))
  cercaLayer.setLatLngs(cerca.polygon.map(p => [p.lat, p.lng]))
  cerca.polygon.forEach((v, i) => {
    if (cercaHandles[i]) cercaHandles[i].setLatLng([v.lat, v.lng])
  })
  const n = cerca.polygon.length
  for (let i = 0; i < n; i++) {
    const a = cerca.polygon[i]
    const b = cerca.polygon[(i + 1) % n]
    if (cercaMidHandles[i]) {
      cercaMidHandles[i].setLatLng([(a.lat + b.lat) / 2, (a.lng + b.lng) / 2])
    }
  }
}

function createPolygonCerca(center: { lat: number; lng: number }) {
  // Default polygon: square at 4 diagonal corners, side ~= radius*2
  const d = cerca.radius
  const corners = [315, 45, 135, 225].map(b => offsetLatLng(center, d * 1.2, b))
  cerca.polygon = corners.map(c => ({ lat: c.lat, lng: c.lng }))

  cercaLayer = L.polygon(cerca.polygon.map(c => [c.lat, c.lng]), {
    color:       '#2D6BFF',
    weight:      2,
    fillColor:   '#2D6BFF',
    fillOpacity: 0.18,
    interactive: false,
  }).addTo(mapInstance)

  rebuildPolygonHandles()
}

// Build/rebuild vertex + midpoint handles from cerca.polygon
function rebuildPolygonHandles() {
  cercaHandles.forEach(h => h.remove());    cercaHandles    = []
  cercaMidHandles.forEach(h => h.remove()); cercaMidHandles = []

  const n = cerca.polygon.length

  // Corner (vertex) handles — draggable
  cerca.polygon.forEach((v, i) => {
    const handle = L.marker([v.lat, v.lng], {
      icon:         cercaHandleIcon(),
      draggable:    true,
      zIndexOffset: 800,
    }).addTo(mapInstance)

    handle.on('drag', () => {
      const np = handle.getLatLng()
      cerca.polygon[i] = { lat: np.lat, lng: np.lng }
      cercaLayer.setLatLngs(cerca.polygon.map(p => [p.lat, p.lng]))
      // Move the two adjacent midpoint handles
      const len = cerca.polygon.length
      ;[(i - 1 + len) % len, i].forEach(mi => {
        const mh = cercaMidHandles[mi]
        if (!mh) return
        const a = cerca.polygon[mi]
        const b = cerca.polygon[(mi + 1) % len]
        mh.setLatLng([(a.lat + b.lat) / 2, (a.lng + b.lng) / 2])
      })
      // Pin must remain inside the cerca — pull it back if necessary
      enforcePinInsidePolygon()
    })
    cercaHandles.push(handle)
  })

  // Midpoint handles — click to insert a new vertex there
  for (let i = 0; i < n; i++) {
    const a = cerca.polygon[i]
    const b = cerca.polygon[(i + 1) % n]
    const mLat = (a.lat + b.lat) / 2
    const mLng = (a.lng + b.lng) / 2

    const handle = L.marker([mLat, mLng], {
      icon:         cercaMidHandleIcon(),
      draggable:    false,
      zIndexOffset: 700,
    }).addTo(mapInstance)

    const segmentIndex = i
    handle.on('click', () => {
      cerca.polygon.splice(segmentIndex + 1, 0, { lat: mLat, lng: mLng })
      cercaLayer.setLatLngs(cerca.polygon.map(p => [p.lat, p.lng]))
      rebuildPolygonHandles()
    })
    cercaMidHandles.push(handle)
  }
}

function createCerca(center: { lat: number; lng: number }) {
  removeCerca()
  if (cerca.mode === 'radius') createRadiusCerca(center)
  else createPolygonCerca(center)
}

function removeCerca() {
  if (cercaLayer) { cercaLayer.remove(); cercaLayer = null }
  cercaHandles.forEach(h => h.remove());    cercaHandles    = []
  cercaMidHandles.forEach(h => h.remove()); cercaMidHandles = []
}

function setCercaMode(mode: CercaMode) {
  if (cerca.mode === mode || !currentMarker) {
    cerca.mode = mode
    return
  }
  cerca.mode = mode
  const ll = currentMarker.getLatLng()
  createCerca({ lat: ll.lat, lng: ll.lng })
}

// ── Geocoding (Nominatim / OpenStreetMap) ─────────────
// Suppression flags to prevent reactive loops between marker drag, address
// auto-fill (reverse geocode), and user edits (forward geocode).
let suppressEnderecoWatch = false
let geocodeTimer: any     = null

function formatAddress(data: any): string {
  const a = data?.address ?? {}
  const street = [a.road, a.house_number].filter(Boolean).join(', ')
  const parts = [
    street,
    a.suburb || a.neighbourhood || a.quarter || a.city_district,
    a.city || a.town || a.village || a.municipality,
  ].filter(Boolean)
  return parts.join(' - ') || data?.display_name || ''
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=pt-BR&zoom=18&addressdetails=1`
    )
    if (!r.ok) return ''
    return formatAddress(await r.json())
  } catch { return '' }
}

async function forwardGeocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=1&accept-language=pt-BR`
    )
    if (!r.ok) return null
    const data = await r.json()
    if (Array.isArray(data) && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch { /* swallow */ }
  return null
}

// Push marker position → form fields (lat, lng, endereco) + cerca (if radius)
async function syncFromMarker(latlng: { lat: number; lng: number }, opts: { geocode?: boolean } = {}) {
  pontoForm.lat = latlng.lat.toFixed(6)
  pontoForm.lng = latlng.lng.toFixed(6)

  // Radius cerca follows the pin; polygon stays put (user invariant)
  moveRadiusCercaCenter(latlng)

  if (opts.geocode !== false) {
    const addr = await reverseGeocode(latlng.lat, latlng.lng)
    if (addr) {
      suppressEnderecoWatch = true
      pontoForm.endereco = addr
      // Release the flag on the next tick so user-triggered edits later still fire
      nextTick(() => { suppressEnderecoWatch = false })
    }
  }
}

// Lucide icon path data (viewBox 24x24, stroked)
const TIPO_ICON_PATHS: Record<string, string> = {
  garagem:  '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  terminal: '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
  parada:   '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  outros:   '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
}

// SVG for the custom pin marker — color + icon based on selected tipo
function markerSvg(balloonColor = '#2D6BFF', dotBg = '#EF3E4A', tipoValue: string | null = null) {
  // Default (no tipo selected): blue balloon with a white "?" — same look as
  // the pp-tipo-pin preview shown in the side panel.
  if (!tipoValue) {
    return `
      <svg width="30" height="34" viewBox="0 0 30 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="pp-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="2" stdDeviation="1" flood-color="rgba(0,0,0,0.25)"/>
          </filter>
        </defs>
        <g filter="url(#pp-shadow)">
          <circle cx="15" cy="15" r="14.5" fill="#2D6BFF" stroke="rgba(248,248,248,0.97)" stroke-width="0.5"/>
          <polygon points="9,26 15,33.5 21,26" fill="#2D6BFF"/>
        </g>
        <text x="15" y="20.5" text-anchor="middle"
              font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="700" fill="white">?</text>
      </svg>
    `
  }

  // With tipo selected: colored balloon + inner dot + lucide icon
  const iconPath = TIPO_ICON_PATHS[tipoValue] ?? ''
  return `
    <svg width="30" height="34" viewBox="0 0 30 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="pp-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="2" dy="2" stdDeviation="1" flood-color="rgba(0,0,0,0.25)"/>
        </filter>
      </defs>
      <g filter="url(#pp-shadow)">
        <circle cx="15" cy="15" r="14.5" fill="${balloonColor}" stroke="rgba(248,248,248,0.97)" stroke-width="0.5"/>
        <polygon points="9,26 15,33.5 21,26" fill="${balloonColor}"/>
      </g>
      <circle cx="15" cy="14.5" r="8.5" fill="${dotBg}" stroke="white" stroke-width="1"/>
      <svg x="7.5" y="7" width="15" height="15" viewBox="0 0 24 24" fill="none"
           stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${iconPath}</svg>
    </svg>
  `
}

function buildMarkerIcon(tipoValue: string | null) {
  const tipo = tipoOptions.find(t => t.value === tipoValue)
  return L.divIcon({
    html:        markerSvg(tipo?.balloonColor, tipo?.dotBg, tipoValue),
    className:   'pp-marker-icon',
    iconSize:    [30, 34],
    iconAnchor:  [15, 34],
    popupAnchor: [0, -34],
  })
}

// Edit-mode drag handlers — attached to BOTH new and saved markers.
// Uses `e.target` so the handler never references a stale `currentMarker`.
function attachMarkerEditHandlers(marker: any) {
  marker.on('drag', (e: any) => {
    if (!editingPonto.value) return
    const m = e.target
    let ll: LL = m.getLatLng()

    if (cerca.mode === 'polygon' && cerca.polygon.length >= 3) {
      if (!isPointInPolygon(ll, cerca.polygon)) {
        ll = clampInsidePolygon(ll, cerca.polygon)
        m.setLatLng([ll.lat, ll.lng])
      }
    } else {
      moveRadiusCercaCenter(ll)
    }
    pontoForm.lat = ll.lat.toFixed(6)
    pontoForm.lng = ll.lng.toFixed(6)
  })

  marker.on('dragend', (e: any) => {
    if (!editingPonto.value) return
    const ll = e.target.getLatLng()
    syncFromMarker({ lat: ll.lat, lng: ll.lng }, { geocode: true })
  })
}

// Recreate the cerca on the map from previously saved data (no defaults).
function restoreCercaFromData(savedCerca: SavedPonto['cerca'], pinLL: LL) {
  removeCerca()
  cerca.mode    = savedCerca.mode
  cerca.radius  = savedCerca.radius
  cerca.polygon = savedCerca.polygon.map(p => ({ ...p }))

  if (cerca.mode === 'radius') {
    createRadiusCerca(pinLL)
    return
  }

  // Polygon: restore the saved vertices instead of creating defaults
  cercaLayer = L.polygon(cerca.polygon.map(p => [p.lat, p.lng]), {
    color:       '#2D6BFF',
    weight:      2,
    fillColor:   '#2D6BFF',
    fillOpacity: 0.18,
    interactive: false,
  }).addTo(mapInstance)
  rebuildPolygonHandles()
}

// Open a saved ponto for editing
function editPonto(id: string) {
  if (editingPonto.value) return  // already editing something else
  const saved = savedPontos.find(s => s.id === id)
  if (!saved || !mapInstance || !L) return

  editingId  = id
  editBackup = {
    id: saved.id,
    data:  { ...saved.data },
    cerca: {
      mode:    saved.cerca.mode,
      radius:  saved.cerca.radius,
      polygon: saved.cerca.polygon.map(p => ({ ...p })),
    },
    marker: saved.marker,
  }

  // Load form data (suppressing the endereco watcher to avoid a phantom geocode)
  suppressEnderecoWatch = true
  pontoForm.tipo     = saved.data.tipo
  pontoForm.nome     = saved.data.nome
  pontoForm.codigo   = saved.data.codigo
  pontoForm.endereco = saved.data.endereco
  pontoForm.lat      = saved.data.lat
  pontoForm.lng      = saved.data.lng
  nextTick(() => { suppressEnderecoWatch = false })

  // Reactivate the marker for editing
  currentMarker = saved.marker
  currentMarker.dragging?.enable()

  // Restore cerca on the map
  const ll = saved.marker.getLatLng()
  restoreCercaFromData(saved.cerca, { lat: ll.lat, lng: ll.lng })

  editingPonto.value = true
  mapInstance.flyTo([ll.lat, ll.lng], Math.max(mapInstance.getZoom(), 17), { duration: 0.5 })
  setTimeout(() => mapInstance?.invalidateSize(), 260)
}

function addPonto() {
  if (!ctxMenu.latlng || !mapInstance || !L) return

  // Remove previous uncommitted marker if exists
  if (currentMarker) {
    currentMarker.remove()
  }

  currentMarker = L.marker(
    [ctxMenu.latlng.lat, ctxMenu.latlng.lng],
    {
      icon:        buildMarkerIcon(pontoForm.tipo),
      draggable:   true,
      autoPan:     true,
      autoPanPadding: L.point(60, 60),
    }
  ).addTo(mapInstance)

  attachMarkerEditHandlers(currentMarker)

  // Default cerca (radius) around the new point
  cerca.mode   = 'radius'
  cerca.radius = 150
  createCerca({ lat: ctxMenu.latlng.lat, lng: ctxMenu.latlng.lng })

  // Initial fill — lat/lng instantly, endereco via reverse geocode (async)
  syncFromMarker({ lat: ctxMenu.latlng.lat, lng: ctxMenu.latlng.lng }, { geocode: true })

  ctxMenu.visible = false
  editingPonto.value = true

  // Always zoom to a usability-friendly level so the cerca + handles are visible
  const DEFAULT_ADD_ZOOM = 17
  mapInstance.flyTo(
    [ctxMenu.latlng.lat, ctxMenu.latlng.lng],
    DEFAULT_ADD_ZOOM,
    { duration: 0.6 }
  )

  // Invalidate map size after layout shift (panel opens)
  setTimeout(() => mapInstance?.invalidateSize(), 260)
}

// Keep the marker in sync with the selected tipo while editing
watch(() => pontoForm.tipo, (newTipo) => {
  if (currentMarker && L) {
    currentMarker.setIcon(buildMarkerIcon(newTipo))
  }
})

// User edits "Endereço" → forward-geocode → move pin + cerca + update lat/lng
watch(() => pontoForm.endereco, (newAddr) => {
  if (suppressEnderecoWatch) return
  if (!currentMarker || !mapInstance) return
  const trimmed = (newAddr ?? '').trim()
  if (trimmed.length < 5) return

  if (geocodeTimer) clearTimeout(geocodeTimer)
  geocodeTimer = setTimeout(async () => {
    const result = await forwardGeocode(trimmed)
    if (!result || !currentMarker) return

    const oldLL = currentMarker.getLatLng()
    const dLat  = result.lat - oldLL.lat
    const dLng  = result.lng - oldLL.lng

    currentMarker.setLatLng([result.lat, result.lng])
    // setLatLng doesn't fire `drag` → manually sync everything
    pontoForm.lat = result.lat.toFixed(6)
    pontoForm.lng = result.lng.toFixed(6)

    if (cerca.mode === 'radius') {
      moveRadiusCercaCenter(result)
    } else if (cerca.mode === 'polygon' && !isPointInPolygon(result, cerca.polygon)) {
      // Pin teleported outside the cerca → translate polygon to follow,
      // preserving its custom shape but keeping the pin inside it.
      translatePolygonCerca(dLat, dLng)
    }

    mapInstance.flyTo([result.lat, result.lng], Math.max(mapInstance.getZoom(), 17), { duration: 0.5 })
  }, 700)
})

function cancelar() {
  if (editingId && editBackup) {
    // Cancelling an existing ponto edit — restore its saved state.
    const saved = savedPontos.find(s => s.id === editingId)
    if (saved) {
      saved.data  = { ...editBackup.data }
      saved.cerca = {
        mode:    editBackup.cerca.mode,
        radius:  editBackup.cerca.radius,
        polygon: editBackup.cerca.polygon.map(p => ({ ...p })),
      }
      saved.marker.setLatLng([parseFloat(saved.data.lat), parseFloat(saved.data.lng)])
      saved.marker.setIcon(buildMarkerIcon(saved.data.tipo))
      saved.marker.dragging?.disable()
    }
    editingId  = null
    editBackup = null
  } else if (currentMarker) {
    // Cancelling a new (unsaved) ponto — remove the marker entirely.
    currentMarker.remove()
  }
  removeCerca()
  currentMarker = null
  resetForm()
  editingPonto.value = false
  setTimeout(() => mapInstance?.invalidateSize(), 260)
}

function salvar() {
  if (editingId) {
    // Update an existing SavedPonto with the edited values
    const saved = savedPontos.find(s => s.id === editingId)
    if (saved) {
      saved.data = {
        tipo:     pontoForm.tipo,
        nome:     pontoForm.nome,
        codigo:   pontoForm.codigo,
        endereco: pontoForm.endereco,
        lat:      pontoForm.lat,
        lng:      pontoForm.lng,
      }
      saved.cerca = {
        mode:    cerca.mode,
        radius:  cerca.radius,
        polygon: cerca.polygon.map(p => ({ ...p })),
      }
      saved.marker.setIcon(buildMarkerIcon(saved.data.tipo))
      saved.marker.dragging?.disable()
    }
    editingId  = null
    editBackup = null
  } else if (currentMarker) {
    // Persist a brand-new ponto
    const id = makePontoId()
    const marker = currentMarker
    marker.dragging?.disable()
    marker.on('click', () => editPonto(id))
    savedPontos.push({
      id,
      data: {
        tipo:     pontoForm.tipo,
        nome:     pontoForm.nome,
        codigo:   pontoForm.codigo,
        endereco: pontoForm.endereco,
        lat:      pontoForm.lat,
        lng:      pontoForm.lng,
      },
      cerca: {
        mode:    cerca.mode,
        radius:  cerca.radius,
        polygon: cerca.polygon.map(p => ({ ...p })),
      },
      marker,
    })
  }

  // Hide the cerca shape from view (data is preserved in the SavedPonto)
  if (cercaLayer) { cercaLayer.remove(); cercaLayer = null }
  cercaHandles.forEach(h => h.remove());    cercaHandles    = []
  cercaMidHandles.forEach(h => h.remove()); cercaMidHandles = []
  currentMarker = null
  resetForm()
  editingPonto.value = false
  setTimeout(() => mapInstance?.invalidateSize(), 260)
}

function resetForm() {
  pontoForm.tipo     = null
  pontoForm.nome     = ''
  pontoForm.codigo   = ''
  pontoForm.endereco = ''
  pontoForm.lat      = ''
  pontoForm.lng      = ''
}

function hideCtxMenu() {
  ctxMenu.visible = false
}

// ── Vehicle (GPS simulation) ──────────────────────────
let vehicleMarker: any = null
const vehiclePos  = { lat: 0, lng: 0 }
let vehicleTarget: { lat: number; lng: number } | null = null
let vehicleAngle  = 0   // current rotation in degrees (screen-space)
let rafId: number | null = null
let lastFrame    = 0

const VEHICLE_SPEED       = 220 // pixels per second
const VEHICLE_REACH_PX    = 0.5 // distance below which vehicle is considered "arrived"
const VEHICLE_ROT_SMOOTH  = 9   // higher = snappier rotation

// Strip any width/height attributes from the root <svg> so our CSS can size it,
// and inject a CSS class on the root element for sizing/rotation.
const vehicleSvgInline = veiculoSvgRaw
  .replace(/\swidth="\d+"/i,  '')
  .replace(/\sheight="\d+"/i, '')
  .replace('<svg', '<svg class="vehicle-marker__svg" preserveAspectRatio="xMidYMid meet"')

function vehicleHtml() {
  // SVG is inlined: the bus body's long axis already points roughly east in the
  // viewBox, so applying screen-space atan2(dy, dx) as rotation works directly.
  return `<div class="vehicle-marker">${vehicleSvgInline}</div>`
}

function startVehicle() {
  if (!mapInstance || !L) return
  const center = mapInstance.getCenter()
  vehiclePos.lat = center.lat
  vehiclePos.lng = center.lng

  const icon = L.divIcon({
    html:       vehicleHtml(),
    className:  'vehicle-divicon',
    iconSize:   [56, 36],
    iconAnchor: [28, 18],
  })

  vehicleMarker = L.marker([vehiclePos.lat, vehiclePos.lng], {
    icon,
    interactive:  false,
    keyboard:     false,
    zIndexOffset: 1000,
  }).addTo(mapInstance)

  lastFrame = 0
  rafId = requestAnimationFrame(tickVehicle)
}

function tickVehicle(now: number) {
  if (!mapInstance || !vehicleMarker) { rafId = null; return }

  const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0
  lastFrame = now

  if (vehicleTarget) {
    const cur = mapInstance.latLngToContainerPoint([vehiclePos.lat, vehiclePos.lng])
    const tgt = mapInstance.latLngToContainerPoint([vehicleTarget.lat, vehicleTarget.lng])
    const dx  = tgt.x - cur.x
    const dy  = tgt.y - cur.y
    const dist = Math.hypot(dx, dy)

    if (dist > VEHICLE_REACH_PX) {
      // Move toward target at constant pixel speed
      const step = Math.min(dist, VEHICLE_SPEED * dt)
      const nx   = cur.x + (dx / dist) * step
      const ny   = cur.y + (dy / dist) * step
      const np   = mapInstance.containerPointToLatLng([nx, ny])
      vehiclePos.lat = np.lat
      vehiclePos.lng = np.lng
      vehicleMarker.setLatLng([vehiclePos.lat, vehiclePos.lng])

      // Rotate toward heading (shortest-arc lerp)
      const targetDeg = Math.atan2(dy, dx) * 180 / Math.PI
      let diff = targetDeg - vehicleAngle
      while (diff >  180) diff -= 360
      while (diff < -180) diff += 360
      vehicleAngle += diff * Math.min(1, dt * VEHICLE_ROT_SMOOTH)

      const el = vehicleMarker.getElement()
      if (el) {
        const svg = el.querySelector('.vehicle-marker__svg') as HTMLElement | null
        if (svg) svg.style.transform = `rotate(${vehicleAngle}deg)`
      }
    }
  }

  rafId = requestAnimationFrame(tickVehicle)
}

function onMapMouseMove(e: any) {
  vehicleTarget = { lat: e.latlng.lat, lng: e.latlng.lng }
}

function onMapMouseOut() {
  vehicleTarget = null
}

// ── Map ───────────────────────────────────────────────
const mapContainer = ref<HTMLDivElement | null>(null)

onMounted(async () => {
  if (!mapContainer.value) return

  L = (await import('leaflet')).default

  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })

  mapInstance = L.map(mapContainer.value, {
    center: [-3.7172, -38.5432],
    zoom: 13,
    zoomControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapInstance)

  mapInstance.on('contextmenu', (e: any) => {
    e.originalEvent.preventDefault()
    ctxMenu.x       = e.containerPoint.x
    ctxMenu.y       = e.containerPoint.y
    ctxMenu.latlng  = { lat: e.latlng.lat, lng: e.latlng.lng }
    ctxMenu.visible = true
  })

  mapInstance.on('click',     hideCtxMenu)
  mapInstance.on('movestart', hideCtxMenu)

  // Vehicle GPS simulation — mouse drives the target
  startVehicle()
  mapInstance.on('mousemove', onMapMouseMove)
  mapInstance.on('mouseout',  onMapMouseOut)

  onUnmounted(() => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
    mapInstance?.remove()
    mapInstance = null
    vehicleMarker = null
    L = null
  })
})
</script>

<template>
  <div class="pontos">

    <!-- ── Page Header ── -->
    <PageHeader title="Planejamento" :tabs="tabs">
      <template #toolbar>
        <button class="ph-btn-icon" title="Importar">
          <Upload :size="16" />
        </button>
      </template>
    </PageHeader>

    <!-- ── Body ── -->
    <div class="pontos__body">

      <!-- ── Map ── -->
      <div class="pontos__map-wrapper">
        <div ref="mapContainer" class="pontos__map" />

        <!-- Context menu -->
        <Transition name="ctx">
          <div
            v-if="ctxMenu.visible"
            class="pp-ctx"
            :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
          >
            <button class="pp-ctx__btn" @click="addPonto">
              Adicionar ponto aqui
            </button>
          </div>
        </Transition>
      </div>

      <!-- ── Edit panel ── -->
      <Transition name="panel-slide">
        <aside v-if="editingPonto" class="pontos__panel">

          <!-- Header -->
          <div class="pp-panel__header">
            <div class="pp-panel__title">
              <!-- location pin icon (2 vectors from Figma) -->
              <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
                <path d="M7 0C3.13 0 0 3.13 0 7c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5C5.62 9.5 4.5 8.38 4.5 7S5.62 4.5 7 4.5 9.5 5.62 9.5 7 8.38 9.5 7 9.5z" fill="#39434F"/>
              </svg>
              <span class="pp-panel__title-text">Editar ponto</span>
            </div>
            <button class="pp-panel__trash" title="Excluir ponto" @click="cancelar">
              <Trash2 :size="16" />
            </button>
          </div>

          <!-- Tipo de ponto -->
          <div class="pp-field-row">
            <div class="pp-field-row__select">
              <label class="pp-label">Tipo de ponto</label>
              <PontoTipoSelect
                v-model="pontoForm.tipo"
                :options="tipoOptions"
              />
            </div>
            <!-- Pin preview circle (Figma: Ellipse 42 — 40×40, blue, shadow) -->
            <div
              class="pp-tipo-pin"
              :style="selectedTipo ? { background: selectedTipo.balloonColor } : {}"
              :title="selectedTipo ? selectedTipo.label : 'Selecione um tipo'"
            >
              <component
                v-if="selectedTipo"
                :is="selectedTipo.icon"
                :size="16"
                color="white"
              />
              <span v-else class="pp-tipo-pin__q">?</span>
            </div>
          </div>

          <!-- Form inputs -->
          <UiInput
            v-model="pontoForm.nome"
            label="Nome do ponto:*"
            placeholder="Digite aqui"
            class="pp-input"
          />
          <UiInput
            v-model="pontoForm.codigo"
            label="Código de referência:"
            placeholder="Digite aqui"
            class="pp-input"
          />
          <UiInput
            v-model="pontoForm.endereco"
            label="Endereço:"
            placeholder="Digite aqui"
            class="pp-input"
          />
          <UiInput
            v-model="pontoForm.lat"
            label="Latitude:"
            placeholder="Digite aqui"
            class="pp-input"
          />
          <UiInput
            v-model="pontoForm.lng"
            label="Longitude:"
            placeholder="Digite aqui"
            class="pp-input"
          />

          <!-- Cerca -->
          <div class="pp-cerca">
            <div class="pp-cerca__header">
              <label class="pp-label">Cerca</label>
              <button
                type="button"
                class="pp-cerca__toggle"
                :class="{ 'pp-cerca__toggle--active': cerca.mode === 'radius' }"
                title="Cerca por raio"
                @click="setCercaMode('radius')"
              >
                <Crosshair :size="14" />
              </button>
              <button
                type="button"
                class="pp-cerca__toggle"
                :class="{ 'pp-cerca__toggle--active': cerca.mode === 'polygon' }"
                title="Cerca por polígono (desenhar ao redor)"
                @click="setCercaMode('polygon')"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 5 L20 4 L19 19 L4 18 Z" />
                  <circle cx="5"  cy="5"  r="2" fill="currentColor" stroke="none"/>
                  <circle cx="20" cy="4"  r="2" fill="currentColor" stroke="none"/>
                  <circle cx="19" cy="19" r="2" fill="currentColor" stroke="none"/>
                  <circle cx="4"  cy="18" r="2" fill="currentColor" stroke="none"/>
                </svg>
              </button>
            </div>
            <div class="pp-cerca__param">
              <span class="pp-cerca__value">
                {{ cerca.mode === 'radius' ? cerca.radius : cerca.polygon.length }}
              </span>
              <span class="pp-cerca__unit">
                {{ cerca.mode === 'radius' ? 'metros' : 'vértices' }}
              </span>
            </div>
          </div>

          <!-- Spacer -->
          <div class="pp-panel__spacer" />

          <!-- Buttons -->
          <div class="pp-panel__buttons">
            <button class="pp-btn pp-btn--cancel" @click="cancelar">Cancelar</button>
            <button class="pp-btn pp-btn--save"   @click="salvar">Salvar</button>
          </div>

        </aside>
      </Transition>

    </div><!-- /pontos__body -->
  </div>
</template>

<style scoped>
/* ── Shell ────────────────────────────────────────── */
.pontos {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-neutral-50);
}

/* ── Body ─────────────────────────────────────────── */
.pontos__body {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 10px;
  overflow: hidden;
  padding: 0;
}

/* ── Map wrapper ──────────────────────────────────── */
.pontos__map-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.pontos__map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* ── Context menu ─────────────────────────────────── */
.pp-ctx {
  position: absolute;
  z-index: 1000;
  transform: translateY(-50%);
  pointer-events: none;
}

.pp-ctx__btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding: 0 18px 0 22px;
  background: #2D6BFF;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  border: 1.5px solid rgba(255, 255, 255, 0.55);
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  pointer-events: auto;
  box-shadow: 0 4px 12px rgba(45, 107, 255, 0.35), 0 1px 3px rgba(0, 0, 0, 0.20);
  transition: background var(--transition-fast), transform var(--transition-fast);
  user-select: none;
}
.pp-ctx__btn:hover  { background: #1A5AED; transform: scale(1.02); }
.pp-ctx__btn:active { transform: scale(0.98); }
.pp-ctx__btn::before {
  content: '';
  position: absolute;
  left: -9px;
  top: 50%;
  transform: translateY(-50%);
  border-top:    9px solid transparent;
  border-bottom: 9px solid transparent;
  border-right:  9px solid #2D6BFF;
}

/* ── Edit panel ───────────────────────────────────── */
.pontos__panel {
  width: 331px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: #FFFFFF;
  border: 1px solid #E8E8E8;
  border-radius: var(--radius-md);
  margin: 10px 10px 10px 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ── Panel header ─────────────────────────────────── */
.pp-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  flex-shrink: 0;
}

.pp-panel__title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pp-panel__title-text {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #39434F;
  line-height: 1;
}

.pp-panel__trash {
  width: 30px;
  height: 30px;
  border-radius: 5px;
  border: none;
  background: #2D6BFF;
  color: #FFFFFF;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
  flex-shrink: 0;
}
.pp-panel__trash:hover { background: #1A5AED; }

/* ── Tipo de ponto row ────────────────────────────── */
.pp-field-row {
  display: flex;
  align-items: flex-end;
  gap: 7px;
}

.pp-field-row__select {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

/* Pin preview circle — Figma: Ellipse 42 (40×40, blue #2D6BFF, border #E8E8E8 2px, shadow) */
.pp-tipo-pin {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #2D6BFF;
  border: 2px solid #E8E8E8;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background var(--transition-base);
}

.pp-tipo-pin__q {
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  line-height: 1;
}

/* ── Labels ───────────────────────────────────────── */
.pp-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1F1F1F;
  line-height: 20px;
}

/* ── Input overrides ──────────────────────────────── */
.pp-input {
  width: 100%;
}
:deep(.pp-input .ui-input__field) {
  border-color: #E6E6E6;
  height: 40px;
}

/* ── Cerca section ────────────────────────────────── */
.pp-cerca {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pp-cerca__header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pp-cerca__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 5px;
  border: 1px solid #E6E6E6;
  background: #FFFFFF;
  color: #6B7280;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}
.pp-cerca__toggle:hover {
  background: #F5F5F5;
  color: #2D6BFF;
}
.pp-cerca__toggle--active {
  background: #2D6BFF;
  border-color: #2D6BFF;
  color: #FFFFFF;
}
.pp-cerca__toggle--active:hover {
  background: #1A5AED;
  color: #FFFFFF;
}

.pp-cerca__param {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border-radius: 4px;
  background: #F5F5F5;
  border: 1px solid #E6E6E6;
  width: 100%;
}

.pp-cerca__value {
  flex: 1;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #1F1F1F;
  text-align: left;
}

.pp-cerca__unit {
  font-size: 12px;
  color: #A3A3A3;
  flex-shrink: 0;
}

/* ── Spacer ───────────────────────────────────────── */
.pp-panel__spacer { flex: 1; }

/* ── Action buttons ───────────────────────────────── */
.pp-panel__buttons {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.pp-btn {
  flex: 1;
  height: 36px;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.pp-btn--cancel {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  color: #171717;
}
.pp-btn--cancel:hover {
  background: var(--color-neutral-50);
  border-color: var(--color-neutral-300);
}

.pp-btn--save {
  background: #2D6BFF;
  border: none;
  color: #FFFFFF;
}
.pp-btn--save:hover { background: #1A5AED; }

/* ── Transitions ──────────────────────────────────── */
.ctx-enter-active { transition: opacity 120ms ease, transform 120ms ease; }
.ctx-leave-active { transition: opacity 80ms ease, transform 80ms ease; }
.ctx-enter-from,
.ctx-leave-to { opacity: 0; transform: translateY(-50%) scale(0.92); }

.panel-slide-enter-active { transition: opacity 220ms ease, transform 220ms cubic-bezier(0.2, 0, 0, 1); }
.panel-slide-leave-active { transition: opacity 150ms ease, transform 150ms ease; }
.panel-slide-enter-from,
.panel-slide-leave-to { opacity: 0; transform: translateX(20px); }
</style>

<!-- Custom marker icon — global so Leaflet's DOM can render it -->
<style>
.pp-marker-icon {
  background: transparent !important;
  border: none !important;
}

/* ── Cerca handle (drag dots) ─────────────────────── */
.cerca-handle-icon {
  background: transparent !important;
  border: none !important;
}
.cerca-handle {
  width: 16px;
  height: 16px;
  background: #2D6BFF;
  border: 2px solid #FFFFFF;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  cursor: grab;
}
.cerca-handle:active { cursor: grabbing; }

/* Midpoint "ghost" handle — click to insert a new vertex */
.cerca-handle--mid {
  width: 14px;
  height: 14px;
  background: rgba(45, 107, 255, 0.55);
  border: 1.5px dashed #FFFFFF;
  color: #FFFFFF;
  font: 700 11px/1 'Inter', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 120ms ease, transform 120ms ease;
}
.cerca-handle--mid:hover {
  background: #2D6BFF;
  transform: scale(1.18);
}

/* ── Vehicle marker (GPS sim) ─────────────────────── */
.vehicle-divicon {
  background: transparent !important;
  border: none !important;
}
.vehicle-marker {
  width: 56px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.vehicle-marker__svg {
  width: 100%;
  height: 100%;
  display: block;
  transform-origin: 50% 50%;
  transform: rotate(0deg);
  will-change: transform;
  user-select: none;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
  overflow: visible;
}
</style>
