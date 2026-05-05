<script setup lang="ts">
/**
 * UiTable — Design System Bus · Table (7009:2725)
 *
 * Wrapper de tabela. Os estilos de thead/th/td/tr vivem em global.css
 * (namespace .ui-table-wrapper) para garantir que alcancem o slot content.
 *
 * ── Estados de linha (DS Table/Row — classe na <tr>): ──────────────────
 *   .row--selected   → State=Selected (bg azul #1B45A3, texto branco)
 *   .row--disabled   → State=Disabled (bg cinza #F2F2F2, texto muted)
 *   .row--inactive   → alias de row--disabled (mesmo visual)
 *   .row--danger     → alerta de perigo                    [futuro]
 *   Hover é automático via :hover (bg azul #2457D1, texto branco)
 *
 * ── Classes para células: ───────────────────────────────────────────────
 *   .col-checkbox    → coluna de checkbox (40px)           [futuro]
 *   .col-actions     → coluna de ações (60px)
 *   .col-badge       → célula com badge                    [futuro]
 *   .cell--mono      → fonte monospace (código / ID)
 *   .cell--muted     → texto atenuado                      [futuro]
 *   .th--sortable    → cabeçalho ordenável                 [futuro]
 *   .th--sorted-asc  → ordenado crescente                  [futuro]
 *   .th--sorted-desc → ordenado decrescente                [futuro]
 */

withDefaults(defineProps<{
  scrollable?: boolean
}>(), {
  scrollable: true,
})
</script>

<template>
  <div class="ui-table-wrapper" :class="{ 'ui-table-wrapper--scroll': scrollable }">
    <table>
      <slot />
    </table>
  </div>
</template>

<style scoped>
.ui-table-wrapper {
  border: 1px solid var(--color-neutral-150);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-neutral-0);
  box-shadow: var(--shadow-sm);
}

.ui-table-wrapper--scroll {
  overflow-x: auto;
}
</style>
