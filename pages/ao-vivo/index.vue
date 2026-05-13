<script setup lang="ts">
import veiculoSvgRaw from '~/components/ui/veiculo.svg?raw'
import { mockFleet, type FleetStatus, type FleetVehicle } from '~/data/uos.mock'

const FOCUS_ZOOM = 17  // nível "rua" — coincide com a referência do scale dos ícones

definePageMeta({ layout: 'default' })

let L: any = null
let map: any = null
let fleetLayer: any = null
const markers = new Map<string, any>()

const selectedIds = ref<string[]>([])

// SVG base: remove tamanhos fixos, injeta classe pra CSS controlar tamanho.
const vehicleSvgBase = veiculoSvgRaw
  .replace(/\swidth="\d+"/i,  '')
  .replace(/\sheight="\d+"/i, '')
  .replace('<svg', '<svg class="ao-vivo-marker__svg" preserveAspectRatio="xMidYMid meet"')

const STATUS_COLORS: Record<FleetStatus, { body: string; shadow: string }> = {
  active:    { body: '#84CB33', shadow: '#5F981F' },
  attention: { body: '#F5C518', shadow: '#C48A00' },
  inactive:  { body: '#9CA3AF', shadow: '#6B7280' },
}

function vehicleHtml(v: FleetVehicle): string {
  // Mesma regra do módulo Pontos: o corpo do ônibus aponta para LESTE no viewBox,
  // então aplicar a rotação em CSS gira corretamente. heading=0 → leste.
  const c = STATUS_COLORS[v.status]
  const svg = vehicleSvgBase
    .replaceAll('#84CB33', c.body)
    .replaceAll('#5F981F', c.shadow)
  return `<div class="ao-vivo-marker"><div class="ao-vivo-marker__rot" style="transform: rotate(${v.heading}deg)">${svg}</div></div>`
}

function addMarker(v: FleetVehicle) {
  if (!L || !map) return
  const icon = L.divIcon({
    html:       vehicleHtml(v),
    className:  'ao-vivo-divicon',
    iconSize:   [48, 30],
    iconAnchor: [24, 15],
  })
  const m = L.marker(v.pos, { icon, zIndexOffset: 300, title: `${v.codigo} | ${v.plate}` })
  m.addTo(fleetLayer)
  markers.set(v.id, m)
}

function removeMarker(id: string) {
  const m = markers.get(id)
  if (m) {
    fleetLayer?.removeLayer(m)
    markers.delete(id)
  }
}

function syncMarkers(ids: string[]) {
  if (!L || !map) return
  if (!fleetLayer) fleetLayer = L.layerGroup().addTo(map)
  const wanted = new Set(ids)

  // Remove os que não estão mais selecionados
  for (const id of [...markers.keys()]) {
    if (!wanted.has(id)) removeMarker(id)
  }
  // Adiciona os novos
  for (const id of ids) {
    if (markers.has(id)) continue
    const v = mockFleet.find(x => x.id === id)
    if (v) addMarker(v)
  }
}

watch(selectedIds, (ids) => syncMarkers(ids))

function focusVehicle(v: FleetVehicle) {
  if (!map) return
  const targetZoom = Math.max(map.getZoom(), FOCUS_ZOOM)
  // setView é mais determinístico que flyTo e dispara zoomend imediatamente.
  map.setView(v.pos, targetZoom, { animate: true, duration: 0.6 })
}

// Escala dos ícones em função do zoom — simula tamanho real do veículo na via.
// Em zoom 17 (≈ nível de rua) o ícone tem tamanho natural (scale=1).
// Quanto mais longe, menor, dobrando/halving a cada nível de zoom, clampado.
function updateIconScale() {
  if (!map) return
  const zoom = map.getZoom()
  let scale = Math.pow(2, zoom - 17)
  scale = Math.max(0.25, Math.min(1.5, scale))
  document.documentElement.style.setProperty('--ao-vivo-icon-scale', String(scale))
}

onMounted(async () => {
  const leaflet = await import('leaflet')
  await import('leaflet/dist/leaflet.css')
  L = leaflet.default ?? leaflet

  map = L.map('ao-vivo-map', {
    center: [-8.0476, -34.8770],
    zoom: 13,
    zoomControl: false,
  })
  L.control.zoom({ position: 'bottomleft' }).addTo(map)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  map.on('zoomend', updateIconScale)
  updateIconScale()

  setTimeout(() => {
    map?.invalidateSize()
    // Renderiza qualquer seleção inicial (emit immediate do filtro já populou selectedIds).
    syncMarkers(selectedIds.value)
  }, 150)
})

onUnmounted(() => {
  fleetLayer = null
  markers.clear()
  document.documentElement.style.removeProperty('--ao-vivo-icon-scale')
  map?.remove()
  map = null
})
</script>

<template>
  <div class="ao-vivo-page">
    <PageHeader
      title="Monitoramento"
      :tabs="[{ label: 'Ao vivo', to: '/ao-vivo' }, { label: 'Replay', to: '/replay' }]"
    />

    <div class="ao-vivo__body">
      <div id="ao-vivo-map" class="ao-vivo__map" />
      <LiveFleetFilter
        class="ao-vivo__filter"
        @update:selected="selectedIds = $event"
        @focus="focusVehicle"
      />
      <LiveFleetSummary class="ao-vivo__summary" :selected-ids="selectedIds" />
    </div>
  </div>
</template>

<style scoped>
.ao-vivo-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.ao-vivo__body {
  flex: 1;
  min-height: 0;
  display: flex;
  position: relative;
}

.ao-vivo__map {
  flex: 1;
  min-width: 0;
  height: 100%;
}

.ao-vivo__filter {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 500;
}

.ao-vivo__summary {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
}
</style>

<!-- divIcon HTML é renderizado fora do escopo Vue → estilos globais -->
<style>
.ao-vivo-divicon {
  background: transparent !important;
  border: none !important;
}
.ao-vivo-marker {
  width: 48px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.25));
  transform: scale(var(--ao-vivo-icon-scale, 1));
  transform-origin: center;
  transition: transform 180ms ease;
}
.ao-vivo-marker__rot {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center;
}
.ao-vivo-marker__svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
