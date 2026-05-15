<script setup lang="ts">
/**
 * Filtro lateral da tela /ao-vivo.
 * Permite organizar os veículos da frota por:
 *   • Unidade Organizacional (UO)
 *   • Linha
 * Lista grupos colapsáveis com checkboxes individuais por veículo.
 * Usa o mesmo SVG de veículo do módulo Pontos (veiculo.svg).
 */
import {
  Filter,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Building2,
  Route,
  FilterX,
  MapPin,
  User,
  UserX,
} from 'lucide-vue-next'
import veiculoSvgRaw from '~/components/ui/veiculo.svg?raw'
import { mockUOs, mockFleet, type FleetVehicle, type FleetStatus } from '~/data/uos.mock'
import { mockLines } from '~/data/lines.mock'

type Mode = 'uo' | 'linha'

const emit = defineEmits<{
  (e: 'update:selected', ids: string[]): void
  (e: 'focus',     vehicle: FleetVehicle): void
  (e: 'highlight', id: string | null): void   // item em destaque (1 por vez)
  (e: 'mode',      mode: Mode): void          // 'uo' | 'linha' — tab atual
}>()

function focusVehicle(v: FleetVehicle) {
  if (!selectedVehicles.value.includes(v.id)) {
    selectedVehicles.value = [...selectedVehicles.value, v.id]
  }
  emit('focus', v)
}

const mode = ref<Mode>('uo')
const search = ref('')
// `collapsed` é exposto como v-model para o parent reagir (ex.: recentralizar
// o summary do mapa em função do espaço disponível à esquerda).
const collapsed = defineModel<boolean>('collapsed', { default: false })

watch(mode, (m) => emit('mode', m), { immediate: true })

// Veículos selecionados (visíveis no mapa) — array reativo
const selectedVehicles = ref<string[]>(mockFleet.map(v => v.id))
const selectedSet = computed(() => new Set(selectedVehicles.value))

watch(selectedVehicles, (ids) => emit('update:selected', [...ids]), { immediate: true })

// Item EM DESTAQUE (1 por vez — diferente de "selecionado", que é a visibilidade no mapa)
const highlightedId = ref<string | null>(null)

function toggleHighlight(id: string) {
  highlightedId.value = highlightedId.value === id ? null : id
}

// Emite a mudança pro parent (ao-vivo page) renderizar o callout no mapa
watch(highlightedId, (id) => emit('highlight', id), { immediate: true })

// Se o item em destaque for des-selecionado (some do mapa), limpa o destaque
watch(selectedVehicles, (ids) => {
  if (highlightedId.value && !ids.includes(highlightedId.value)) {
    highlightedId.value = null
  }
})

// Grupos expandidos (reactive Set — Vue 3 rastreia mutações via proxy)
const expandedGroups = reactive(new Set<string>())

function toggleGroup(id: string) {
  if (expandedGroups.has(id)) expandedGroups.delete(id)
  else                        expandedGroups.add(id)
}

function toggleVehicle(id: string) {
  if (selectedVehicles.value.includes(id)) {
    selectedVehicles.value = selectedVehicles.value.filter(x => x !== id)
  } else {
    selectedVehicles.value = [...selectedVehicles.value, id]
  }
}

type CheckState = 'none' | 'some' | 'all'
function groupCheckState(vehicles: FleetVehicle[]): CheckState {
  if (vehicles.length === 0) return 'none'
  let selected = 0
  for (const v of vehicles) if (selectedSet.value.has(v.id)) selected++
  if (selected === 0)               return 'none'
  if (selected === vehicles.length) return 'all'
  return 'some'
}

function toggleGroupAll(vehicles: FleetVehicle[]) {
  const state = groupCheckState(vehicles)
  if (state === 'all') {
    const ids = new Set(vehicles.map(v => v.id))
    selectedVehicles.value = selectedVehicles.value.filter(id => !ids.has(id))
  } else {
    const current = new Set(selectedVehicles.value)
    for (const v of vehicles) current.add(v.id)
    selectedVehicles.value = Array.from(current)
  }
}

const hasActiveFilters = computed(() =>
  selectedVehicles.value.length > 0 || search.value.trim() !== ''
)

function clearFilters() {
  if (!hasActiveFilters.value) return
  selectedVehicles.value = []
  expandedGroups.clear()
  search.value = ''
  highlightedId.value = null
}

interface Group {
  id:       string
  label:    string
  vehicles: FleetVehicle[]
}

const groups = computed<Group[]>(() => {
  const term = search.value.trim().toLowerCase()
  const matchesSearch = (v: FleetVehicle) =>
    !term ||
    v.codigo.toLowerCase().includes(term) ||
    v.plate.toLowerCase().includes(term) ||
    v.model.toLowerCase().includes(term)

  if (mode.value === 'uo') {
    return mockUOs.map(uo => ({
      id:       uo.id,
      label:    uo.name,
      vehicles: mockFleet.filter(v => v.uoId === uo.id && matchesSearch(v)),
    }))
  }
  return mockLines.map(l => ({
    id:       l.id,
    label:    `${l.code} – ${l.origin} → ${l.destination}`,
    vehicles: mockFleet.filter(v => v.linhaId === l.id && matchesSearch(v)),
  }))
})

// ── Vehicle SVG: limpa width/height fixos do <svg> raiz para CSS controlar tamanho.
const vehicleSvgBase = veiculoSvgRaw
  .replace(/\swidth="\d+"/i,  '')
  .replace(/\sheight="\d+"/i, '')
  .replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"')

// Mapa status → par de cores (corpo, sombra) usado para tingir o SVG.
const STATUS_COLORS: Record<FleetStatus, { body: string; shadow: string }> = {
  active:    { body: '#84CB33', shadow: '#5F981F' },
  attention: { body: '#F5C518', shadow: '#C48A00' },
  inactive:  { body: '#9CA3AF', shadow: '#6B7280' },
}

function vehicleSvg(status: FleetStatus): string {
  const c = STATUS_COLORS[status]
  return vehicleSvgBase
    .replaceAll('#84CB33', c.body)
    .replaceAll('#5F981F', c.shadow)
}
</script>

<template>
  <aside class="lff" :class="{ 'lff--collapsed': collapsed }">

    <!-- ── Cabeçalho (filtro + collapse) ───────────────── -->
    <header class="lff__head">
      <Filter :size="16" class="lff__head-icon" />
      <span class="lff__head-title">{{ mode === 'uo' ? 'Filtro' : 'Tipo' }}</span>
      <button class="lff__collapse" :title="collapsed ? 'Expandir' : 'Recolher'" @click="collapsed = !collapsed">
        <ChevronLeft :size="18" :style="{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }" />
      </button>
    </header>

    <!-- Conteúdo (some quando recolhido) -->
    <div v-show="!collapsed" class="lff__body">

      <!-- ── Toggle de modo ──────────────────────────── -->
      <div class="lff__modes">
        <button
          class="lff__mode"
          :class="{ 'lff__mode--active': mode === 'uo' }"
          @click="mode = 'uo'"
        >
          <Building2 :size="16" />
          <span>Unidade Organizacional</span>
        </button>
        <button
          class="lff__mode"
          :class="{ 'lff__mode--active': mode === 'linha' }"
          @click="mode = 'linha'"
        >
          <Route :size="16" />
          <span>Linha</span>
        </button>
      </div>

      <!-- ── Título da seção ─────────────────────────── -->
      <div class="lff__section-title">
        <component :is="mode === 'uo' ? Building2 : Route" :size="18" />
        <h3>{{ mode === 'uo' ? 'Lista de Unidades Organizacionais' : 'Lista de Rotas' }}</h3>
      </div>

      <!-- ── Busca + filtro ─────────────────────────── -->
      <div class="lff__search-row">
        <button
          class="lff__filter-btn"
          :class="{ 'lff__filter-btn--disabled': !hasActiveFilters }"
          :disabled="!hasActiveFilters"
          :title="hasActiveFilters ? 'Limpar filtros' : 'Sem filtros ativos'"
          @click="clearFilters"
        >
          <FilterX :size="16" />
        </button>
        <label class="lff__search">
          <Search :size="14" class="lff__search-icon" />
          <input v-model="search" type="text" placeholder="Buscar..." />
        </label>
      </div>

      <!-- ── Lista de grupos ────────────────────────── -->
      <div class="lff__list">
        <div v-for="g in groups" :key="g.id" class="lff__group">

          <!-- Header do grupo -->
          <button class="lff__group-head" @click="toggleGroup(g.id)">
            <span
              class="lff__check"
              :data-state="groupCheckState(g.vehicles)"
              role="checkbox"
              :aria-checked="groupCheckState(g.vehicles) === 'all' ? 'true' : groupCheckState(g.vehicles) === 'some' ? 'mixed' : 'false'"
              @click.stop="toggleGroupAll(g.vehicles)"
            >
              <svg v-if="groupCheckState(g.vehicles) === 'all'" viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
                <path d="M3 8.5 L7 12 L13 4" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else-if="groupCheckState(g.vehicles) === 'some'" viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
                <path d="M4 8 L12 8" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              </svg>
            </span>
            <component :is="mode === 'uo' ? Building2 : Route" :size="14" class="lff__group-icon" />
            <span class="lff__group-label" :title="g.label">{{ g.label }}</span>
            <component :is="expandedGroups.has(g.id) ? ChevronUp : ChevronDown" :size="16" />
          </button>

          <!-- Veículos do grupo -->
          <div v-if="expandedGroups.has(g.id)" class="lff__items">
            <div
              v-for="v in g.vehicles"
              :key="v.id"
              class="lff__item"
              :class="{
                'lff__item--selected':    selectedSet.has(v.id),
                'lff__item--highlighted': v.id === highlightedId,
              }"
              role="button"
              :aria-pressed="v.id === highlightedId"
              @click="toggleHighlight(v.id)"
            >
              <button class="lff__item-check" @click.stop="toggleVehicle(v.id)">
                <span class="lff__check" :class="{ 'lff__check--on': selectedSet.has(v.id) }">
                  <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
                    <path d="M3 8.5 L7 12 L13 4" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </button>
              <span class="lff__item-svg" v-html="vehicleSvg(v.status)" />
              <span class="lff__item-text" :title="`${v.codigo} | ${v.plate} | ${v.model}`">
                {{ v.codigo }} | {{ v.plate }} | {{ v.model }}
              </span>
              <span
                class="lff__item-driver"
                :class="{ 'lff__item-driver--off': !v.driverIdentified }"
                :title="v.driverIdentified ? 'Motorista identificado' : 'Motorista não identificado'"
              >
                <component :is="v.driverIdentified ? User : UserX" :size="14" />
              </span>
              <button class="lff__item-pin" title="Centralizar no mapa" @click.stop="focusVehicle(v)">
                <MapPin :size="16" />
              </button>
            </div>
            <div v-if="g.vehicles.length === 0" class="lff__empty">
              Nenhum veículo encontrado.
            </div>
          </div>
        </div>
      </div>

    </div>
  </aside>
</template>

<style scoped>
.lff {
  width: 360px;
  /* Sempre vai até o rodapé do mapa, tendo conteúdo ou não. */
  height: calc(100% - 24px);
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 13px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.16),
    0 2px 6px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  color: var(--color-neutral-900, #1F1F1F);
}
.lff--collapsed {
  width: 48px;
  /* Sem altura cheia quando recolhido — vira apenas um "rail" compacto,
     deixando o mapa respirar atrás. */
  height: auto;
  border-bottom-left-radius: 13px;
  border-bottom-right-radius: 13px;
  transition: width 200ms ease;
}

/* ── Cabeçalho ──────────────────────────────────── */
.lff__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-neutral-150, #EFEFEF);
  flex-shrink: 0;
  transition: padding 200ms ease, gap 200ms ease;
}
.lff__head-icon { color: var(--color-neutral-700, #4B5563); flex-shrink: 0; }
.lff__head-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-neutral-900, #1F1F1F);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Estado recolhido: header vira um "rail" minimalista. Esconde título e
   ícone-rótulo (redundantes em 48px) e centraliza só o chevron. */
.lff--collapsed .lff__head {
  padding: 10px 0;
  gap: 0;
  justify-content: center;
  border-bottom: none;
}
.lff--collapsed .lff__head-title,
.lff--collapsed .lff__head-icon { display: none; }
.lff__collapse {
  width: 28px; height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  color: var(--color-neutral-700, #4B5563);
  flex-shrink: 0;
  transition: background 120ms ease, color 120ms ease;
}
.lff__collapse:hover {
  background: var(--color-neutral-100, #F4F4F5);
  color: var(--color-action-primary-active, #1A043B);
}
.lff--collapsed .lff__collapse { width: 32px; height: 32px; }
.lff--collapsed .lff__collapse svg { transition: transform 200ms ease; }

/* ── Body ───────────────────────────────────────── */
.lff__body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* ── Toggle de modo ─────────────────────────────── */
.lff__modes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 12px 12px 8px;
  flex-shrink: 0;
}
.lff__mode {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 38px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid var(--color-neutral-200, #E5E7EB);
  background: #FFFFFF;
  color: var(--color-neutral-800, #1F2937);
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
}
.lff__mode span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lff__mode:hover { background: var(--color-neutral-50, #F9FAFB); }
.lff__mode--active,
.lff__mode--active:hover {
  background: var(--color-action-primary-active, #1A043B);
  border-color: var(--color-action-primary-active, #1A043B);
  color: #FFFFFF;
}

/* ── Título da seção ───────────────────────────── */
.lff__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 8px;
  color: var(--color-neutral-900, #1F1F1F);
  flex-shrink: 0;
}
.lff__section-title h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Busca ──────────────────────────────────────── */
.lff__search-row {
  display: flex;
  gap: 8px;
  padding: 0 12px 10px;
  flex-shrink: 0;
}
.lff__filter-btn {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  border: none;
  background: var(--color-action-primary, #5D37F5);
  color: #FFFFFF;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.lff__filter-btn:hover:not(:disabled) {
  background: var(--color-action-primary-hover, #7152E0);
}
.lff__filter-btn--disabled,
.lff__filter-btn:disabled {
  background: #FFFFFF;
  border: 1px solid var(--color-neutral-200, #E5E7EB);
  color: var(--color-neutral-400, #9CA3AF);
  cursor: not-allowed;
}
.lff__search {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 10px;
  border-radius: 4px;
  border: 1px solid var(--color-neutral-200, #E5E7EB);
  background: #FFFFFF;
  min-width: 0;
}
.lff__search-icon { color: var(--color-neutral-400, #9CA3AF); flex-shrink: 0; }
.lff__search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  color: var(--color-neutral-900, #1F1F1F);
  min-width: 0;
}
.lff__search input::placeholder { color: var(--color-neutral-400, #9CA3AF); }

/* ── Lista ──────────────────────────────────────── */
.lff__list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 12px;
  scrollbar-width: thin;
  scrollbar-color: #BFBFEF #F1F1F4;
}
.lff__list::-webkit-scrollbar { width: 6px; }
.lff__list::-webkit-scrollbar-track { background: #F1F1F4; border-radius: 4px; }
.lff__list::-webkit-scrollbar-thumb { background: #BFBFEF; border-radius: 4px; }

.lff__group { margin: 4px 0; }

.lff__group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-neutral-900, #1F1F1F);
  text-align: left;
  transition: background 120ms ease;
}
.lff__group-head:hover { background: var(--color-neutral-100, #F4F4F5); }
.lff__group-icon { color: var(--color-neutral-700, #4B5563); flex-shrink: 0; }
.lff__group-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Items ──────────────────────────────────────── */
.lff__items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0 6px 4px;
}
.lff__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.lff__item:hover:not(.lff__item--highlighted) {
  background: var(--color-neutral-50, #F9FAFB);
}
.lff__item--selected:not(.lff__item--highlighted) {
  background: rgba(26, 4, 59, 0.06);
}

/* ── Item EM DESTAQUE (clicado para inspecionar) ───────
   Bg azul-escuro + checkbox accent cyan + texto/ícones brancos.
   Distinto do --selected (que é só "visível no mapa"). */
.lff__item--highlighted {
  background: var(--color-action-primary-active, #1A043B);
}
.lff__item--highlighted .lff__item-text {
  color: #FFFFFF;
}
.lff__item--highlighted .lff__check--on {
  background: #3FE7FF !important;
  border-color: #3FE7FF !important;
}
.lff__item--highlighted .lff__check--on svg path {
  stroke: var(--color-action-primary-active, #1A043B) !important;
}
.lff__item--highlighted .lff__item-pin {
  color: rgba(255, 255, 255, 0.85);
}
.lff__item--highlighted .lff__item-pin:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #FFFFFF;
}

.lff__item-check {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.lff__item-svg {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 20px;
  flex-shrink: 0;
}
.lff__item-svg :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
.lff__item-text {
  flex: 1;
  font-size: 12px;
  color: var(--color-neutral-800, #1F2937);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.lff__item-driver {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #1F2A57;
  color: #FFFFFF;
  border: 1.5px solid #FFFFFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
}
.lff__item-driver--off {
  background: #FFFFFF;
  color: #DC2626;
  border-color: #DC2626;
}

.lff__item-pin {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  color: var(--color-neutral-700, #4B5563);
  flex-shrink: 0;
}
.lff__item-pin:hover {
  background: var(--color-neutral-100, #F4F4F5);
  color: var(--color-action-primary-active, #1A043B);
}

.lff__empty {
  font-size: 12px;
  color: var(--color-neutral-500, #6B7280);
  padding: 6px 12px 8px;
  font-style: italic;
}

/* ── Checkbox custom ───────────────────────────── */
.lff__check {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1.5px solid var(--color-neutral-400, #9CA3AF);
  background: #FFFFFF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 120ms ease, border-color 120ms ease;
  cursor: pointer;
}
.lff__check[data-state='all'],
.lff__check[data-state='some'],
.lff__check--on {
  background: var(--color-action-primary-active, #1A043B);
  border-color: var(--color-action-primary-active, #1A043B);
}
</style>
