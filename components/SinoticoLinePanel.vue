<script setup lang="ts">
/**
 * Painel lateral do Sinótico (Figma node 2056:110691).
 *
 * Layout vertical:
 *   1. Header     — título "Tipo de Linha" + chevron expand/collapse
 *   2. Cards 3×   — Normal / Média / Crítica (com contagem)
 *   3. Sub-header — "Lista de Linhas"
 *   4. Toolbar    — botão filtro + input de busca
 *   5. Lista      — checkbox + ícone de rota + texto, scrollável
 */
import { ArrowDownUp, ChevronLeft, ListFilter, Search } from 'lucide-vue-next'
import { mockLines } from '~/data/lines.mock'
import type { Line } from '~/types'

type TipoLinha = 'normal' | 'media' | 'critica'

interface LineItem extends Line {
  tipo: TipoLinha
}

// ── Classifica as linhas em normal/média/crítica (mock) ──
const classified: LineItem[] = mockLines.map((l, i) => ({
  ...l,
  tipo: (['normal', 'media', 'critica'] as TipoLinha[])[i % 3],
}))

const counts = computed(() => ({
  normal:  classified.filter(l => l.tipo === 'normal').length,
  media:   classified.filter(l => l.tipo === 'media').length,
  critica: classified.filter(l => l.tipo === 'critica').length,
}))

// ── Collapse do painel inteiro (mesmo padrão do LiveFleetFilter no Ao Vivo)
// Quando colapsado, o painel vira um "rail" estreito (48px) e esconde
// o cabeçalho "Tipo de Linha", os cards e a seção "Lista de Linhas". */
const collapsed = ref(false)

// ── Tipo selecionado (no Figma "Normal" aparece selecionado) ──
const tipoSel = ref<TipoLinha | null>('normal')
function toggleTipo(t: TipoLinha) {
  tipoSel.value = tipoSel.value === t ? null : t
}

// ── Busca ──
const search = ref('')

// ── Seleção ──
const selectedIds = ref<Set<string>>(new Set(
  // pré-seleciona algumas para refletir o screenshot
  classified.filter(l => l.tipo === 'normal').slice(0, 3).map(l => l.id),
))
function toggleLine(id: string) {
  const next = new Set(selectedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selectedIds.value = next
}

// ── Lista filtrada ──
const filtered = computed<LineItem[]>(() => {
  const q = search.value.trim().toLowerCase()
  return classified.filter(l => {
    if (tipoSel.value && l.tipo !== tipoSel.value) return false
    if (q) {
      const hay = `${l.code} ${l.name} ${l.origin} ${l.destination}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

// ── Format helpers ──
function fmtCount(n: number): string {
  return `(${n.toString().padStart(3, '0')})`
}
function fmtLabel(l: LineItem): string {
  // "1998 - CAETÉS III / TI ABREU E LIMA"
  const codigo = String(1000 + Number(l.id) * 7).slice(0, 4) // mock 4-dígitos
  return `${codigo} - ${l.origin.toUpperCase()} / ${l.destination.toUpperCase()}`
}
</script>

<template>
  <aside class="slp" :class="{ 'slp--collapsed': collapsed }">
    <!-- ── Header / Tipo de Linha ─────────────────────────────── -->
    <header class="slp__header">
      <div class="slp__title-row">
        <ArrowDownUp v-show="!collapsed" :size="16" class="slp__title-icon" />
        <h2 v-show="!collapsed" class="slp__title">Tipo de Linha</h2>
        <button
          class="slp__chevron"
          :title="collapsed ? 'Expandir' : 'Recolher'"
          @click="collapsed = !collapsed"
        >
          <ChevronLeft :size="18" :style="{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }" />
        </button>
      </div>

      <div v-show="!collapsed" class="slp__cards">
        <button
          class="slp-card"
          :class="{ 'slp-card--active': tipoSel === 'normal' }"
          @click="toggleTipo('normal')"
        >
          <span class="slp-card__value">{{ fmtCount(counts.normal) }}</span>
          <span class="slp-card__label">Normal</span>
        </button>
        <button
          class="slp-card"
          :class="{ 'slp-card--active': tipoSel === 'media' }"
          @click="toggleTipo('media')"
        >
          <span class="slp-card__value">{{ fmtCount(counts.media) }}</span>
          <span class="slp-card__label">Média</span>
        </button>
        <button
          class="slp-card"
          :class="{ 'slp-card--active': tipoSel === 'critica' }"
          @click="toggleTipo('critica')"
        >
          <span class="slp-card__value">{{ fmtCount(counts.critica) }}</span>
          <span class="slp-card__label">Crítica</span>
        </button>
      </div>
    </header>

    <!-- ── Lista de Linhas ─────────────────────────────────────── -->
    <section v-show="!collapsed" class="slp__list">
      <div class="slp__title-row slp__title-row--sub">
        <ArrowDownUp :size="16" class="slp__title-icon" />
        <h3 class="slp__subtitle">Lista de Linhas</h3>
      </div>

      <div class="slp__search-row">
        <button class="slp__filter-btn" title="Filtrar">
          <ListFilter :size="14" />
        </button>
        <div class="slp__search">
          <input
            v-model="search"
            type="text"
            class="slp__search-input"
            placeholder="Pesquisar linhas"
          />
          <Search :size="16" class="slp__search-icon" />
        </div>
      </div>

      <ul class="slp__items">
        <li
          v-for="line in filtered"
          :key="line.id"
          class="slp-item"
          :class="{ 'slp-item--checked': selectedIds.has(line.id) }"
          @click="toggleLine(line.id)"
        >
          <span class="slp-item__check" :class="{ 'slp-item__check--on': selectedIds.has(line.id) }">
            <svg v-if="selectedIds.has(line.id)" width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6.5L4.8 9L10 3.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <ArrowDownUp :size="14" class="slp-item__route" />
          <span class="slp-item__label">{{ fmtLabel(line) }}</span>
        </li>
        <li v-if="filtered.length === 0" class="slp-empty">Nenhuma linha encontrada</li>
      </ul>
    </section>
  </aside>
</template>

<style scoped>
/* ── Container (Figma 379 / glass) ───────────────────────────── */
.slp {
  width: 320px;
  height: 100%;
  display: flex;
  flex-direction: column;
  /* Fundo sólido (era glass com backdrop-filter blur 15px — caro de
     renderizar continuamente). O painel agora "pesa" muito menos. */
  background: #FFFFFF;
  border: 1px solid var(--color-neutral-200, #E5E7EB);
  border-radius: 13px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.10),
    0 2px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: width 200ms ease;
}
/* Painel colapsado: vira um "rail" estreito de 48px, mesmo padrão do
   LiveFleetFilter do Ao Vivo. Conteúdo escondido via v-show; só o
   botão chevron centralizado fica visível pra reabrir. */
.slp--collapsed {
  width: 48px;
  height: auto;
}
.slp--collapsed .slp__header {
  padding: 10px 0;
  border-bottom: none;
}
.slp--collapsed .slp__title-row {
  justify-content: center;
  margin-bottom: 0;
  gap: 0;
}

/* ── Header / Tipo de Linha ─────────────────────────────────── */
.slp__header {
  flex-shrink: 0;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(232, 232, 232, 0.60);
}

.slp__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.slp__title-row--sub { margin-bottom: 10px; }

.slp__title-icon {
  color: var(--color-neutral-900);
  flex-shrink: 0;
}

.slp__title {
  flex: 1;
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-neutral-900);
  line-height: 22px;
}
.slp__subtitle {
  flex: 1;
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-neutral-900);
  line-height: 20px;
}

.slp__chevron {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-neutral-700);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}
.slp__chevron:hover { background: rgba(0, 0, 0, 0.05); }

/* ── Cards row ──────────────────────────────────────────────── */
.slp__cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.slp-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 10px 6px;
  border: 1.5px solid var(--color-neutral-300);
  border-radius: 8px;
  background: var(--color-neutral-0);
  color: var(--color-neutral-900);
  cursor: pointer;
  font-family: inherit;
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}
.slp-card:hover { border-color: var(--color-neutral-400); }

.slp-card__value {
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
}
.slp-card__label {
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
}

/* Estado SELECIONADO: usa o token `primary-active` (mesmo padrão do
   Ao vivo — tab de modo selecionada, checkboxes marcados, etc.). */
.slp-card--active,
.slp-card--active:hover {
  background: var(--color-action-primary-active);
  border-color: var(--color-action-primary-active);
  color: var(--color-neutral-0);
}

/* ── Lista section ──────────────────────────────────────────── */
.slp__list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px 16px;
}

.slp__search-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

/* Botão de ação (selecionável) → token `primary` + hover `primary-hover`,
   mesmo padrão do FilterX no Ao vivo. */
.slp__filter-btn {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border: none;
  border-radius: 4px;
  background: var(--color-action-primary);
  color: var(--color-neutral-0);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}
.slp__filter-btn:hover { background: var(--color-action-primary-hover); }

.slp__search {
  position: relative;
  flex: 1;
}
.slp__search-input {
  width: 100%;
  height: 28px;
  padding: 4px 30px 4px 10px;
  border: 1px solid var(--color-neutral-200);
  border-radius: 4px;
  background: var(--color-neutral-0);
  font-family: inherit;
  font-size: 12px;
  font-weight: 400;
  color: var(--color-neutral-900);
  outline: none;
  transition: border-color var(--transition-fast);
}
.slp__search-input::placeholder { color: var(--color-neutral-400); }
.slp__search-input:focus { border-color: var(--color-action-primary); }
.slp__search-icon {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  color: var(--color-neutral-400);
  pointer-events: none;
}

/* ── Items ──────────────────────────────────────────────────── */
.slp__items {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
}
.slp__items::-webkit-scrollbar { width: 6px; }
.slp__items::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.20);
  border-radius: 3px;
}

.slp-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.slp-item:hover { background: rgba(0, 0, 0, 0.04); }

.slp-item__check {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 1.5px solid var(--color-neutral-400);
  border-radius: 3px;
  background: var(--color-neutral-0);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}
/* Checkbox marcado → mesmo navy do Ao vivo (selecionado = primary-active). */
.slp-item__check--on {
  background: var(--color-action-primary-active);
  border-color: var(--color-action-primary-active);
}

.slp-item__route {
  flex-shrink: 0;
  color: var(--color-neutral-700);
}

.slp-item__label {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-neutral-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 16px;
}

.slp-empty {
  padding: 20px 4px;
  text-align: center;
  font-size: 13px;
  color: var(--color-neutral-500);
}

</style>
