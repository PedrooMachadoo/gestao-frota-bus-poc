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

// ── Layout responsivo do summary (Ligado/Desligado/Off) ─────────
// O card sempre fica centralizado no espaço livre entre o filtro (esquerda) e
// os toggles (direita). Filtro expandido = 360px, recolhido = 48px; toggles
// variam de altura conforme o modo (UO mostra 1 toggle, Linha mostra 3) — a
// largura é medida com ResizeObserver pra cobrir qualquer mudança futura.
const filterCollapsed = ref(false)
const filterWidth = computed(() => filterCollapsed.value ? 48 : 360)

const togglesEl = ref<HTMLElement | null>(null)
const togglesWidth = ref(180)
let togglesObserver: ResizeObserver | null = null

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

/** Atualiza posição + ícone (heading) de um marker existente, sem recriar. */
function updateMarker(v: FleetVehicle) {
  const m = markers.get(v.id)
  if (!m || !L) return
  m.setLatLng(v.pos)
  m.setIcon(L.divIcon({
    html:       vehicleHtml(v),
    className:  'ao-vivo-divicon',
    iconSize:   [48, 30],
    iconAnchor: [24, 15],
  }))
}

/**
 * Tick de atualização da frota (chamado quando o LiveRefreshIndicator
 * dispara 'refresh', a cada REFRESH_INTERVAL segundos).
 *
 * Mock: jittera posição (~150–400 m) e heading (±30°) dos veículos visíveis,
 * simulando movimento em tempo real. Quando houver fonte real (websocket /
 * poll API), substituir pelo fetch dos dados de telemetria.
 */
function onTickRefresh() {
  if (!L || !map) return
  for (const v of mockFleet) {
    if (!markers.has(v.id)) continue
    // Jitter de ~150–400m em qualquer direção
    const dLat = (Math.random() - 0.5) * 0.004
    const dLng = (Math.random() - 0.5) * 0.004
    v.pos = [v.pos[0] + dLat, v.pos[1] + dLng]
    // Rotaciona heading em até 30° (qualquer direção)
    v.heading = (v.heading + (Math.random() - 0.5) * 60 + 360) % 360
    updateMarker(v)
  }
  // Se há ativo destacado, recoloca o callout na nova posição do veículo
  if (highlightedId.value) {
    const v = mockFleet.find(x => x.id === highlightedId.value)
    if (v) showCallout(v)
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

// Sincroniza overlays com o set de linhas ativas + estado dos toggles.
// Mantém modo rich (com badges IDA/VOLTA + setas) — quando há várias
// linhas ativas, cada uma tem suas próprias badges em posições distintas
// (origem da Ida/Volta de cada linha).
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

  // Observa mudanças de largura do painel de toggles pra recentralizar o
  // summary quando o número de toggles muda (UO ↔ Linha) ou em viewports
  // variáveis.
  if (togglesEl.value && typeof ResizeObserver !== 'undefined') {
    togglesObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        togglesWidth.value = Math.ceil(entry.contentRect.width)
      }
    })
    togglesObserver.observe(togglesEl.value)
  }
})

onUnmounted(() => {
  clearCallout()
  routeOverlay.destroy()
  fleetLayer = null
  markers.clear()
  document.documentElement.style.removeProperty('--ao-vivo-icon-scale')
  togglesObserver?.disconnect()
  togglesObserver = null
  map?.remove()
  map = null
})
</script>

<template>
  <div class="ao-vivo-page">
    <PageHeader
      title="Monitoramento"
      :tabs="[{ label: 'Ao vivo', to: '/ao-vivo' }, { label: 'Replay', to: '/replay' }, { label: 'Sinótico', to: '/sinotico' }]"
    >
      <template #title-right>
        <LiveRefreshIndicator @refresh="onTickRefresh" />
      </template>
    </PageHeader>

    <div
      class="ao-vivo__body"
      :style="{
        '--filter-w':  filterWidth + 'px',
        '--toggles-w': togglesWidth + 'px',
      }"
    >
      <div id="ao-vivo-map" class="ao-vivo__map" />
      <LiveFleetFilter
        v-model:collapsed="filterCollapsed"
        class="ao-vivo__filter"
        @update:selected="selectedIds = $event"
        @focus="focusVehicle"
        @highlight="onHighlight"
        @mode="onFilterMode"
      />

      <!-- Wrapper que ocupa o "vão" entre filtro e toggles e centraliza o
           summary nesse espaço. As CSS vars `--filter-w` / `--toggles-w`
           são atualizadas reativamente (filtro recolhido, mudança de modo
           dos toggles, etc.), e o flex re-centra o card automaticamente. -->
      <div class="ao-vivo__summary-wrap">
        <LiveFleetSummary class="ao-vivo__summary" :selected-ids="selectedIds" />
      </div>

      <!-- InfoBox do veículo em destaque (rodapé do mapa)
           Wrapper externo gerencia posicionamento absoluto; o componente
           cuida apenas do seu próprio layout interno (concerns separados). -->
      <div class="ao-vivo__infobox">
        <LiveFleetInfoBox :vehicle="highlightedVehicle" />
      </div>

      <!-- ── Painel de toggles do mapa (canto inf. dir.) ──────────
           Mesmo estilo gradiente do Replay. Pontos/Raio só em modo Linha;
           Trânsito sempre visível. -->
      <div ref="togglesEl" class="ao-vivo__toggles">
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

/* ── Top row — Summary centralizado dinamicamente ────
   Wrapper ocupa o "vão" entre filtro (esquerda) e toggles (direita), com
   margens de respiro de 16px de cada lado. As CSS vars `--filter-w` e
   `--toggles-w` são atualizadas reativamente (collapse do filtro, mudança
   de modo dos toggles) e o flex re-centra o card sem JS adicional.

   `pointer-events: none` no wrapper deixa cliques no espaço vazio
   passarem para o mapa; o card interno restaura `auto`. */
.ao-vivo__summary-wrap {
  position: absolute;
  top: 12px;
  left:  calc(12px + var(--filter-w, 360px)  + 16px);
  right: calc(12px + var(--toggles-w, 180px) + 16px);
  z-index: 500;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  pointer-events: none;
  transition: left 220ms ease, right 220ms ease;
}
.ao-vivo__summary-wrap > * {
  pointer-events: auto;
  max-width: 100%;
}

/* ── Toggles flutuantes (Pontos de parada / Raio / Trânsito) ──
   Estilos completos aqui pra garantir o visual mesmo se o CSS global
   estiver com cache/HMR quebrado. Mesmas regras vivem em
   assets/css/map-toggles.css para compartilhar com o Replay. */
.ao-vivo__toggles {
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
  font-family: 'Inter', sans-serif;
}
.ao-vivo__toggles .rp-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}
.ao-vivo__toggles .rp-toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.ao-vivo__toggles .rp-toggle__box {
  width: 18px;
  height: 18px;
  border: 2px solid #FFFFFF;
  border-radius: 4px;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 150ms ease;
}
.ao-vivo__toggles .rp-toggle input:checked + .rp-toggle__box {
  background: #FFFFFF;
}
.ao-vivo__toggles .rp-toggle input:checked + .rp-toggle__box::after {
  content: '';
  width: 10px;
  height: 6px;
  border-left: 2px solid #1F3A8A;
  border-bottom: 2px solid #1F3A8A;
  transform: rotate(-45deg) translate(1px, -1px);
}
.ao-vivo__toggles .rp-toggle__label {
  font-size: 13px;
  font-weight: 500;
  color: #FFFFFF;
  white-space: nowrap;
}
.ao-vivo__toggles .rp-toggle:hover .rp-toggle__box {
  border-color: rgba(255, 255, 255, 0.85);
}

/* InfoBox do veículo em destaque — RODAPÉ full-width após o filtro.
   Encosta nas duas pontas (do filtro até a borda direita do mapa) com
   pequena margem.

   `pointer-events: none` no wrapper + `auto` no card permite que cliques
   nos espaços vazios passem pro mapa (mesmo com o wrapper esticado). */
.ao-vivo__infobox {
  position: absolute;
  bottom: 18px;
  /* Encosta no filtro (qualquer largura — expandido/recolhido) + gap. */
  left: calc(12px + var(--filter-w, 360px) + 12px);
  right: 12px;
  z-index: 500;
  pointer-events: none;
  transition: left 220ms ease;
}
.ao-vivo__infobox > * {
  pointer-events: auto;
}
</style>

<!-- divIcon HTML é renderizado fora do escopo Vue → estilos globais.
     Inclui aqui os estilos dos overlays de itinerário (badges IDA/VOLTA,
     setas, pinos de parada) como fallback caso o assets/css/route-overlay.css
     não esteja sendo carregado pelo dev server (HMR bug observado em local). -->
<style>
/* ── Badge "IDA" / "VOLTA" no início de cada rota ──────── */
.route-badge-wrap { background: transparent !important; border: none !important; }
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

/* ── Seta de ponta das polylines de Ida/Volta ────────── */
.arrow-tip-wrap { background: transparent !important; border: none !important; }
.arrow-tip {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
}

/* ── Pinos de ponto de parada (estilo do módulo Pontos) ── */
.rp-stop-pin-wrap { background: transparent !important; border: none !important; }

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
