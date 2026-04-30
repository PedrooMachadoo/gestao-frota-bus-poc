<script setup lang="ts">
import { FilterX, Plus, MoreVertical, FileText } from 'lucide-vue-next'
import { mockLines } from '~/data/lines.mock'
import type { Line } from '~/types'

definePageMeta({ title: 'Planejamento' })

// ── Tabs ──────────────────────────────────────────────
const tabs = [{ label: 'Linha', to: '/linhas' }]

// ── Loading ───────────────────────────────────────────
const isLoading = ref(false)

// ── Search state — true após o usuário selecionar qualquer filtro ──
const hasSearched = ref(false)

// ── Filters ───────────────────────────────────────────
const filterLinha      = ref<string | null>(null)
const filterTipo       = ref<string | null>(null)
const filterStatus     = ref<string | null>(null)

const linhaOptions = [
  { label: 'Todas as linhas', value: '' },
  ...mockLines.map(l => ({ label: l.name, value: l.id })),
]

const tipoOptions = [
  { label: 'Todos os tipos',    value: '' },
  { label: 'Urbano',            value: 'Urbano' },
  { label: 'Metropolitano',     value: 'Metropolitano' },
  { label: 'Intermunicipal',    value: 'Intermunicipal' },
]

const statusOptions = [
  { label: 'Todos',   value: '' },
  { label: 'Ativo',   value: 'active' },
  { label: 'Inativo', value: 'inactive' },
]

const hasFilters = computed(() => filterLinha.value || filterTipo.value || filterStatus.value)

function clearFilters() {
  filterLinha.value  = null
  filterTipo.value   = null
  filterStatus.value = null
  hasSearched.value  = false
}

// Marca como "pesquisado" apenas quando o usuário seleciona algo (não ao limpar)
watch([filterLinha, filterTipo, filterStatus], ([linha, tipo, status]) => {
  if (linha !== null || tipo !== null || status !== null) {
    hasSearched.value = true
  }
})

// ── Data ──────────────────────────────────────────────
const filtered = computed<Line[]>(() => {
  return mockLines.filter(l => {
    if (filterLinha.value  && l.id !== filterLinha.value)           return false
    if (filterTipo.value   && l.tipoOperacao !== filterTipo.value)  return false
    if (filterStatus.value && l.status !== filterStatus.value)      return false
    return true
  })
})

// ── Pagination ────────────────────────────────────────
const PAGE_SIZE   = 10
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const paginated = computed<Line[]>(() =>
  filtered.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
)

const visiblePages = computed<(number | '...')[]>(() => {
  const total = totalPages.value
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (currentPage.value > 3) pages.push('...')
  for (let i = Math.max(2, currentPage.value - 1); i <= Math.min(total - 1, currentPage.value + 1); i++) {
    pages.push(i)
  }
  if (currentPage.value < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

watch(filtered, () => { currentPage.value = 1 })
</script>

<template>
  <div class="planejamento">

    <!-- ── Page Header ── -->
    <PageHeader title="Planejamento" :tabs="tabs">
      <template #toolbar>
        <!-- Filter clear button -->
        <button
          class="ph-btn-icon filter-btn"
          :class="{ 'filter-btn--active': hasSearched }"
          :disabled="!hasSearched"
          :title="hasSearched ? 'Limpar filtros' : ''"
          @click="clearFilters"
        >
          <FilterX :size="16" />
        </button>

        <!-- Filter selects -->
        <UiSelect v-model="filterLinha"  placeholder="Linha"            :options="linhaOptions" />
        <UiSelect v-model="filterTipo"   placeholder="Tipo de operação" :options="tipoOptions" />
        <UiSelect v-model="filterStatus" placeholder="Status"           :options="statusOptions" />

        <!-- Spacer -->
        <span class="ph-divider" />

        <!-- Add button -->
        <NuxtLink to="/linhas/adicionar" class="ph-btn-icon" title="Nova linha">
          <Plus :size="18" />
        </NuxtLink>
      </template>
    </PageHeader>

    <!-- ── Page content ── -->
    <div class="planejamento__content">

      <!-- ── Skeleton loading state ── -->
      <div v-if="isLoading" class="planejamento__table-wrapper">
        <table class="planejamento__table planejamento__table--skeleton">
          <!-- Skeleton header -->
          <thead>
            <tr class="skel-header-row">
              <th><span class="skel-bar skel-bar--header" style="width:60px" /></th>
              <th><span class="skel-bar skel-bar--header" style="width:120px" /></th>
              <th><span class="skel-bar skel-bar--header" style="width:140px" /></th>
              <th class="col-acoes"><span class="skel-bar skel-bar--header" style="width:40px" /></th>
            </tr>
          </thead>
          <!-- 5 skeleton rows -->
          <tbody>
            <tr v-for="n in 5" :key="n" class="skel-row">
              <td><span class="skel-bar" style="width:60px" /></td>
              <td><span class="skel-bar" style="width:117px" /></td>
              <td><span class="skel-bar" style="width:117px" /></td>
              <td class="col-acoes"><span class="skel-bar" style="width:28px" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── Empty state ── -->
      <div v-else-if="!hasSearched || filtered.length === 0" class="planejamento__empty">
        <div class="planejamento__empty-icon">
          <FileText :size="28" />
        </div>
        <p class="planejamento__empty-title">
          {{ hasSearched ? 'Nenhum resultado encontrado' : 'Nenhuma linha encontrada' }}
        </p>
        <p class="planejamento__empty-sub">
          {{ hasSearched
            ? 'Tente ajustar os filtros para encontrar o que procura.'
            : 'Selecione os filtros acima para visualizar as linhas.' }}
        </p>
        <button v-if="hasSearched && filtered.length === 0" class="planejamento__empty-clear" @click="clearFilters">
          Limpar filtros
        </button>
      </div>

      <!-- ── Table ── -->
      <template v-else>
        <div class="planejamento__table-wrapper">
          <table class="planejamento__table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Linha</th>
                <th>Tipo de Operação</th>
                <th class="col-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="line in paginated"
                :key="line.id"
                :class="{ 'row--inactive': line.status === 'inactive' }"
              >
                <td class="col-code">{{ line.code }}</td>
                <td>{{ line.name }}</td>
                <td>{{ line.tipoOperacao }}</td>
                <td class="col-acoes">
                  <button class="action-menu-btn">
                    <MoreVertical :size="16" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="planejamento__pagination">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage = 1">«</button>
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹</button>

          <template v-for="(p, i) in visiblePages" :key="i">
            <span v-if="p === '...'" class="page-ellipsis">…</span>
            <button
              v-else
              class="page-btn"
              :class="{ 'page-btn--active': p === currentPage }"
              @click="currentPage = p as number"
            >{{ p }}</button>
          </template>

          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">»</button>
        </div>
      </template>

    </div>
  </div>
</template>

<style scoped>
/* ── Shell ────────────────────────────────────────── */
.planejamento {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: var(--color-neutral-50);
}

/* ── Content area ─────────────────────────────────── */
.planejamento__content {
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

/* ── Empty state ──────────────────────────────────── */
.planejamento__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 24px;
  text-align: center;
}

.planejamento__empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #F4F4F5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #A1A1AA;
  flex-shrink: 0;
}

.planejamento__empty-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1E1E1E;
  line-height: 28px;
}

.planejamento__empty-sub {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: #7A7A7A;
  line-height: 20px;
  max-width: 340px;
}

.planejamento__empty-clear {
  margin-top: 4px;
  padding: 8px 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-neutral-300);
  background: var(--color-neutral-0);
  color: var(--color-neutral-700);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}
.planejamento__empty-clear:hover {
  background: var(--color-neutral-100);
  border-color: var(--color-neutral-400);
}

/* ── Filter button — neutro/desabilitado por padrão, ativo quando há filtros ── */
.filter-btn {
  background: var(--color-neutral-0) !important;
  border: 1px solid var(--color-neutral-200) !important;
  color: var(--color-neutral-300) !important;
}
.filter-btn:disabled {
  cursor: default !important;
  opacity: 1 !important;
  pointer-events: none !important;
}
.filter-btn--active {
  background: var(--color-action-blue) !important;
  border-color: var(--color-action-blue) !important;
  color: var(--color-neutral-0) !important;
  pointer-events: auto !important;
  cursor: pointer !important;
}
.filter-btn--active:hover {
  background: var(--color-action-blue-hover) !important;
  border-color: var(--color-action-blue-hover) !important;
}

/* ── Table ────────────────────────────────────────── */
.planejamento__table-wrapper {
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-neutral-0);
}

.planejamento__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.planejamento__table thead {
  background: var(--color-neutral-50);
}

.planejamento__table th {
  padding: 10px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-neutral-700);
  border-bottom: 1px solid var(--color-neutral-200);
  white-space: nowrap;
}

.planejamento__table td {
  padding: 10px 16px;
  color: var(--color-neutral-700);
  border-bottom: 1px solid var(--color-neutral-100);
  vertical-align: middle;
}

.planejamento__table tbody tr:last-child td {
  border-bottom: none;
}

.planejamento__table tbody tr:hover td {
  background: var(--color-neutral-50);
}

.row--inactive td { color: var(--color-neutral-400); }

.col-code {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: var(--color-neutral-600);
}

.col-acoes {
  width: 60px;
  text-align: center;
}

.action-menu-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-neutral-500);
  transition: background var(--transition-fast), color var(--transition-fast);
}
.action-menu-btn:hover {
  background: var(--color-neutral-100);
  color: var(--color-neutral-700);
}

/* ── Skeleton ─────────────────────────────────────── */
@keyframes skel-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}

.skel-bar {
  display: inline-block;
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg, #F2F2F2 25%, #E8E8E8 50%, #F2F2F2 75%);
  background-size: 800px 100%;
  animation: skel-shimmer 1.4s ease-in-out infinite;
}

.skel-bar--header {
  background: linear-gradient(90deg, #F5F5F5 25%, #EBEBEB 50%, #F5F5F5 75%);
  background-size: 800px 100%;
}

.skel-header-row th {
  padding: 9px 16px;
  border-bottom: 1px solid var(--color-neutral-200);
  background: var(--color-neutral-50);
}

.skel-row td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-neutral-100);
}

.skel-row:last-child td {
  border-bottom: none;
}

/* ── Pagination ───────────────────────────────────── */
.planejamento__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-neutral-200);
  background: var(--color-neutral-0);
  color: var(--color-neutral-700);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast), border-color var(--transition-fast);
  font-family: inherit;
}
.page-btn:hover:not(:disabled) { background: var(--color-neutral-100); }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn--active {
  background: var(--color-action-primary) !important;
  border-color: var(--color-action-primary) !important;
  color: var(--color-neutral-0) !important;
}
.page-btn--active:hover:not(:disabled) { background: var(--color-action-primary-hover) !important; }

.page-ellipsis {
  min-width: 32px;
  text-align: center;
  color: var(--color-neutral-400);
  font-size: 13px;
}
</style>
