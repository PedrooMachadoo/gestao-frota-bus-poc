<script setup lang="ts">
/**
 * Resumo de frota — card horizontal posicionado no topo do mapa Ao vivo.
 * Mostra quantidade absoluta e percentual por status operacional:
 *   • Ligado    → FleetStatus 'active'    (verde)
 *   • Desligado → FleetStatus 'attention' (amarelo)
 *   • Off       → FleetStatus 'inactive'  (cinza)
 */
import veiculoSvgRaw from '~/components/ui/veiculo.svg?raw'
import { mockFleet, type FleetStatus } from '~/data/uos.mock'

const props = defineProps<{
  selectedIds: string[]
}>()

const STATUS_COLORS: Record<FleetStatus, { body: string; shadow: string }> = {
  active:    { body: '#84CB33', shadow: '#5F981F' },
  attention: { body: '#F5C518', shadow: '#C48A00' },
  inactive:  { body: '#9CA3AF', shadow: '#6B7280' },
}

const STATUS_LABELS: Record<FleetStatus, string> = {
  active:    'Ligado',
  attention: 'Desligado',
  inactive:  'Off',
}

const vehicleSvgBase = veiculoSvgRaw
  .replace(/\swidth="\d+"/i,  '')
  .replace(/\sheight="\d+"/i, '')
  .replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"')

function vehicleSvg(status: FleetStatus): string {
  const c = STATUS_COLORS[status]
  return vehicleSvgBase
    .replaceAll('#84CB33', c.body)
    .replaceAll('#5F981F', c.shadow)
}

const counts = computed(() => {
  const visible = new Set(props.selectedIds)
  const total = visible.size
  const buckets: Record<FleetStatus, number> = { active: 0, attention: 0, inactive: 0 }
  for (const v of mockFleet) {
    if (visible.has(v.id)) buckets[v.status]++
  }
  return { total, buckets }
})

function format(count: number, total: number): string {
  const pct = total === 0 ? 0 : (count / total) * 100
  const pctStr = pct.toFixed(2).replace('.', ',') + '%'
  const countStr = String(count).padStart(4, '0')
  return `${countStr} - ${pctStr}`
}

const items = computed<{ status: FleetStatus; label: string; text: string }[]>(() =>
  (Object.keys(STATUS_LABELS) as FleetStatus[]).map(status => ({
    status,
    label: STATUS_LABELS[status],
    text:  format(counts.value.buckets[status], counts.value.total),
  })),
)
</script>

<template>
  <div class="lfs">
    <div
      v-for="item in items"
      :key="item.status"
      class="lfs__item"
    >
      <span class="lfs__svg" v-html="vehicleSvg(item.status)" />
      <div class="lfs__text">
        <h4 class="lfs__label">{{ item.label }}</h4>
        <p class="lfs__count">{{ item.text }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lfs {
  display: inline-flex;
  align-items: center;
  gap: 18px;                     /* espaço entre os 3 status — mais compacto */
  padding: 8px 14px;
  background: #FFFFFF;
  border: 1px solid var(--color-neutral-200, #E8E8E8);
  border-radius: 8px;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.18), 1px 1px 6px rgba(0, 0, 0, 0.08);
  font-family: 'Inter', sans-serif;
  color: #394A4F;
  max-width: calc(100vw - 24px); /* nunca ultrapassa a viewport */
  width: max-content;            /* tamanho natural, sem esticar */
}

.lfs__item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.lfs__svg {
  width: 38px;
  height: 24px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.lfs__svg :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}

.lfs__text {
  display: flex;
  flex-direction: column;
}

.lfs__label {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  color: #394A4F;
  white-space: nowrap;       /* uma linha, sem truncamento */
}

.lfs__count {
  margin: 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 15px;
  color: #394A4F;
  white-space: nowrap;       /* uma linha, sem truncamento */
  font-variant-numeric: tabular-nums;  /* dígitos alinhados, sem "respiração" */
}
</style>
