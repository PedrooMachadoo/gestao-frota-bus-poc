<script setup lang="ts">
import { onMounted, onUnmounted, nextTick } from 'vue'
import { Upload, ChevronDown, Trash2, Home, Bus, MapPin, Users } from 'lucide-vue-next'
import type { TipoPontoOption } from '~/components/PontoTipoSelect.vue'

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

// SVG for the custom pin marker — color based on selected tipo
function markerSvg(balloonColor = '#2D6BFF', dotBg = '#EF3E4A') {
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
      <circle cx="15" cy="12.5" r="2.5" fill="white"/>
      <line x1="15" y1="15.5" x2="15" y2="19" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  `
}

function addPonto() {
  if (!ctxMenu.latlng || !mapInstance || !L) return

  const tipo = tipoOptions.find(t => t.value === pontoForm.tipo)
  const icon = L.divIcon({
    html:        markerSvg(tipo?.balloonColor, tipo?.dotBg),
    className:   'pp-marker-icon',
    iconSize:    [30, 34],
    iconAnchor:  [15, 34],
    popupAnchor: [0, -34],
  })

  // Remove previous uncommitted marker if exists
  if (currentMarker) {
    currentMarker.remove()
  }

  currentMarker = L.marker([ctxMenu.latlng.lat, ctxMenu.latlng.lng], { icon }).addTo(mapInstance)

  // Pre-fill lat/lng
  pontoForm.lat = ctxMenu.latlng.lat.toFixed(6)
  pontoForm.lng = ctxMenu.latlng.lng.toFixed(6)

  ctxMenu.visible = false
  editingPonto.value = true

  // Invalidate map size after layout shift
  setTimeout(() => mapInstance?.invalidateSize(), 260)
}

function cancelar() {
  if (currentMarker) {
    currentMarker.remove()
    currentMarker = null
  }
  resetForm()
  editingPonto.value = false
  setTimeout(() => mapInstance?.invalidateSize(), 260)
}

function salvar() {
  // Marker stays on the map
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

  onUnmounted(() => {
    mapInstance?.remove()
    mapInstance = null
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
            </div>
            <div class="pp-cerca__param">
              <span class="pp-cerca__dash">--</span>
              <ChevronDown :size="14" class="pp-cerca__chevron" />
              <span class="pp-cerca__unit">%</span>
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
  gap: 3px;
}

.pp-cerca__header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pp-cerca__param {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 8px;
  border-radius: 4px;
  background: #F5F5F5;
  border: 1px solid #E6E6E6;
  width: 100%;
}

.pp-cerca__dash {
  flex: 1;
  font-size: 14px;
  color: #A3A3A3;
  text-align: center;
}

.pp-cerca__chevron {
  color: #A3A3A3;
  flex-shrink: 0;
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
</style>
