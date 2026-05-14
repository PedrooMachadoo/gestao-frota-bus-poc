<script setup lang="ts">
import veiculoSvgRaw from '~/components/ui/veiculo.svg?raw'
import { mockFleet, type FleetStatus, type FleetVehicle } from '~/data/uos.mock'
import { createRouteOverlayManager } from '~/composables/useRouteOverlay'

const FOCUS_ZOOM = 17  // nível "rua" — coincide com a referência do scale dos ícones

// Limiares do auto-zoom ao destacar um item na lista
const HIGHLIGHT_ZOOM_THRESHOLD = 14   // se zoom < 14 (bairro/distrito), o callout fica "flutuando"
const HIGHLIGHT_TARGET_ZOOM    = 15   // zoom-alvo quando o auto-zoom é acionado

definePageMeta({ layout: 'default' })

let L: any = null
let map: any = null
let fleetLayer: any = null
let codePopup: any = null     // callout do veículo em destaque
const markers = new Map<string, any>()
const routeOverlay = createRouteOverlayManager()

const selectedIds   = ref<string[]>([])
const highlightedId = ref<string | null>(null)
const filterMode    = ref<'uo' | 'linha'>('uo')

// Veículo em destaque (resolvido a partir do id) — alimenta o InfoBox
const highlightedVehicle = computed<FleetVehicle | null>(() => {
  if (!highlightedId.value) return null
  return mockFleet.find(v => v.id === highlightedId.value) ?? null
})

// Toggles do painel flutuante (canto sup. dir. dos toggles)
const showPontosParada = ref(false)
const showRaio         = ref(false)
const showTransito     = ref(false)

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
  // Click no marker → mesmo comportamento de destaque do item da lista:
  // abre callout (código) sobre o marker + slide do InfoBox no rodapé.
  // Toggle: clicar de novo no mesmo marker desseleciona.
  m.on('click', () => {
    highlightedId.value = highlightedId.value === v.id ? null : v.id
  })
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

watch(selectedIds, (ids) => {
  syncMarkers(ids)
  // Se o callout aponta para um veículo que não está mais visível, fecha
  if (highlightedId.value && !ids.includes(highlightedId.value)) {
    clearCallout()
  }
})

function focusVehicle(v: FleetVehicle) {
  if (!map) return
  const targetZoom = Math.max(map.getZoom(), FOCUS_ZOOM)
  // setView é mais determinístico que flyTo e dispara zoomend imediatamente.
  map.setView(v.pos, targetZoom, { animate: true, duration: 0.6 })
}

// ── Callout do veículo em destaque ───────────────────
function buildCodeHtml(code: string): string {
  return `
    <div class="lfp-code">
      <span class="lfp-code__value">${code}</span>
      <button class="lfp-code__close" type="button" data-lfp-deselect aria-label="Fechar">×</button>
    </div>`
}

function clearCallout() {
  if (codePopup && map) {
    map.closePopup(codePopup)
    codePopup = null
  }
}

// ── Trânsito ─────────────────────────────────────────
// O toggle "Trânsito" existe na UI mas ainda NÃO tem efeito visual.
// Aguardando integração com API real de tráfego (Google Maps / TomTom /
// HERE / Mapbox). A tentativa de mock determinístico foi descartada por
// produzir resultado artificial — quando a API estiver disponível, criar
// drawTransito() consumindo dados reais (escopados aos bounds visíveis).
// Ver project_fleet_poc.md → "Feature pendente: Trânsito".

function showCallout(v: FleetVehicle) {
  if (!L || !map) return
  clearCallout()
  codePopup = L.popup({
    className:    'lfp-code-popup',
    closeButton:  false,
    autoClose:    false,
    closeOnClick: false,
    offset:       [0, -8],
  })
    .setLatLng(v.pos)
    .setContent(buildCodeHtml(v.codigo))
    .openOn(map)
  // Liga o X do callout ao deselect
  setTimeout(() => {
    const el = (codePopup as any)._contentNode as HTMLElement | undefined
    el?.querySelector('[data-lfp-deselect]')?.addEventListener('click', () => {
      highlightedId.value = null
    })
  }, 0)
}

function onHighlight(id: string | null) {
  highlightedId.value = id
}

function onFilterMode(mode: 'uo' | 'linha') {
  filterMode.value = mode
}

// ── Linhas ATIVAS — set de linhas com pelo menos 1 veículo selecionado ───
// Usado pra desenhar Ida/Volta no mapa quando o usuário está no modo "Linha".
// Em modo UO a feature de linha-preview fica oculta (princípio: cada modo
// foca no que está agrupando — UOs ≠ linhas).
const activeLinhaIds = computed<string[]>(() => {
  if (filterMode.value !== 'linha') return []
  const set = new Set<string>()
  for (const vId of selectedIds.value) {
    const v = mockFleet.find(x => x.id === vId)
    if (v) set.add(v.linhaId)
  }
  return Array.from(set)
})

// Toggles "Ponto de parada" / "Raio" só fazem sentido em modo Linha
// (estão presos ao itinerário da linha). Em modo UO ficam desligados.
watch(filterMode, (m) => {
  if (m !== 'linha') {
    showPontosParada.value = false
    showRaio.value         = false
  }
})

// Sincroniza overlays com o set de linhas ativas + estado dos toggles
watch(activeLinhaIds, (ids) => {
  routeOverlay.syncLinhas(ids)
  if (showPontosParada.value) routeOverlay.syncStops(ids)
  if (showRaio.value)         routeOverlay.syncFences(ids)
})
watch(showPontosParada, (on) => routeOverlay.syncStops(on ? activeLinhaIds.value : []))
watch(showRaio,         (on) => routeOverlay.syncFences(on ? activeLinhaIds.value : []))

// Toggle "Trânsito" — pendente de API real. O state é mantido (showTransito)
// e o checkbox aparece no painel, mas não há renderização ainda. Quando
// a API for integrada, adicionar aqui o watcher (drawTransito / clearTransito).

/**
 * Auto-zoom inteligente:
 *  • Se o zoom atual já estiver bom (≥ threshold), só centraliza no veículo
 *    de forma suave (pan).
 *  • Se estiver muito baixo, anima zoom-in até HIGHLIGHT_TARGET_ZOOM e
 *    centraliza no veículo. Evita o "callout flutuando sem veículo".
 *
 * Retorna uma Promise que resolve quando o movimento termina, pra abrir
 * o callout só depois da animação (sem tremida).
 */
function smartFocus(v: FleetVehicle): Promise<void> {
  return new Promise(resolve => {
    if (!map) return resolve()
    const currentZoom = map.getZoom()
    const targetZoom  = currentZoom < HIGHLIGHT_ZOOM_THRESHOLD ? HIGHLIGHT_TARGET_ZOOM : currentZoom
    const center      = map.getCenter()
    const sameView    = currentZoom === targetZoom &&
                        Math.abs(center.lat - v.pos[0]) < 0.0001 &&
                        Math.abs(center.lng - v.pos[1]) < 0.0001
    if (sameView) return resolve()
    map.once('moveend', () => resolve())
    map.setView(v.pos, targetZoom, { animate: true, duration: 0.4 })
  })
}

// Sincroniza o callout com a seleção
watch(highlightedId, async (id) => {
  if (!id) { clearCallout(); return }
  const v = mockFleet.find(x => x.id === id)
  if (!v) { clearCallout(); return }
  // Só mostra o callout se o veículo estiver visível no mapa
  if (!markers.has(id)) { clearCallout(); return }
  // 1) Garante que o veículo esteja em zoom razoável e centralizado
  await smartFocus(v)
  // 2) A seleção pode ter mudado durante a animação — confere antes de abrir
  if (highlightedId.value !== id) return
  showCallout(v)
})

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
  // Zoom no canto SUPERIOR direito — fica num "rail lateral" abaixo dos
  // toggles. Bottom-right está reservado pro InfoBox (full-width no rodapé).
  L.control.zoom({ position: 'topright' }).addTo(map)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  map.on('zoomend', updateIconScale)
  updateIconScale()

  // Conecta o manager de overlays de itinerário ao Leaflet
  routeOverlay.init(L, map)

  setTimeout(() => {
    map?.invalidateSize()
    // Renderiza qualquer seleção inicial (emit immediate do filtro já populou selectedIds).
    syncMarkers(selectedIds.value)
    // Re-aplica overlays caso já estejam ativos (ex.: HMR)
    routeOverlay.syncLinhas(activeLinhaIds.value)
  }, 150)
})

onUnmounted(() => {
  clearCallout()
  routeOverlay.destroy()
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
        @highlight="onHighlight"
        @mode="onFilterMode"
      />
      <LiveFleetSummary class="ao-vivo__summary" :selected-ids="selectedIds" />

      <!-- InfoBox do veículo em destaque (rodapé do mapa)
           Wrapper externo gerencia posicionamento absoluto; o componente
           cuida apenas do seu próprio layout interno (concerns separados). -->
      <div class="ao-vivo__infobox">
        <LiveFleetInfoBox :vehicle="highlightedVehicle" />
      </div>

      <!-- ── Painel de toggles do mapa (canto inf. dir.) ──────────
           Mesmo estilo gradiente do Replay. Pontos/Raio só em modo Linha;
           Trânsito sempre visível. -->
      <div class="ao-vivo__toggles">
        <label v-if="filterMode === 'linha'" class="rp-toggle">
          <input type="checkbox" v-model="showPontosParada" />
          <span class="rp-toggle__box"></span>
          <span class="rp-toggle__label">Pontos de parada</span>
        </label>
        <label v-if="filterMode === 'linha'" class="rp-toggle">
          <input type="checkbox" v-model="showRaio" />
          <span class="rp-toggle__box"></span>
          <span class="rp-toggle__label">Raio</span>
        </label>
        <label class="rp-toggle">
          <input type="checkbox" v-model="showTransito" />
          <span class="rp-toggle__box"></span>
          <span class="rp-toggle__label">Trânsito</span>
        </label>
      </div>
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

/* ── Top row ─────────────────────────────────────────
   Filtro à esquerda (full-height), Summary centralizado no espaço útil
   (entre filtro e toggles), Toggles no canto sup. direito.
   Constantes-âncora: filtro = 360 + 12 (margem) + 12 (gap) = 384px;
                      toggles + margem ≈ 192px.                  */
.ao-vivo__summary {
  position: absolute;
  top: 12px;
  /* Centro do espaço entre filtro (384px da esquerda) e toggles (192px da direita) */
  left: calc(384px + (100vw - 384px - 192px) / 2);
  transform: translateX(-50%);
  z-index: 500;
}

/* Toggles flutuantes — canto SUPERIOR direito, alinhado com summary.
   (estilo interno do cartão vem de assets/css/map-toggles.css) */
.ao-vivo__toggles {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 500;
}

/* InfoBox do veículo em destaque — RODAPÉ full-width após o filtro.
   Encosta nas duas pontas (do filtro até a borda direita do mapa) com
   pequena margem.

   `pointer-events: none` no wrapper + `auto` no card permite que cliques
   nos espaços vazios passem pro mapa (mesmo com o wrapper esticado). */
.ao-vivo__infobox {
  position: absolute;
  bottom: 18px;
  left: 384px;       /* após filtro + gap */
  right: 12px;
  z-index: 500;
  pointer-events: none;
}
.ao-vivo__infobox > * {
  pointer-events: auto;
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

/* ── Zoom control do Leaflet — empurrado para baixo do painel de toggles ──
   Toggles ocupam:
     • Modo UO    → 1 toggle    ~50px
     • Modo Linha → 3 toggles  ~120px
   Reservar 132px (top 12 + 120 toggles max) deixa margem confortável nos
   2 modos. Em modo UO sobra espaço — aceitável (não polui visualmente). */
.leaflet-top.leaflet-right .leaflet-control-zoom {
  margin-top: 132px;
}

/* ── Callout (código do veículo em destaque) ───────── */
.leaflet-popup.lfp-code-popup .leaflet-popup-content-wrapper {
  background: transparent;
  box-shadow: none;
  padding: 0;
  border-radius: 8px;
  overflow: visible;
}
.leaflet-popup.lfp-code-popup .leaflet-popup-content {
  margin: 0;
  padding: 0;
  width: auto !important;
}
.leaflet-popup.lfp-code-popup .leaflet-popup-tip {
  background: #1B45A3;
  box-shadow: none;
  width: 14px;
  height: 14px;
  margin: -7px auto 0;
}

.lfp-code {
  position: relative;
  padding: 12px 22px;
  background: #1B45A3;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}
.lfp-code__value {
  font-size: 18px;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 1.5px;
  line-height: 1;
}
.lfp-code__close {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 22px;
  height: 22px;
  border: 2px solid #FFFFFF;
  background: #2D6BFF;
  border-radius: 50%;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: background 120ms ease;
}
.lfp-code__close:hover { background: #1B45A3; }
</style>
