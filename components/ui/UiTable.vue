<template>
  <div class="ui-table-wrapper">
    <table class="ui-table">
      <slot />
    </table>
  </div>
</template>

<style scoped>
.ui-table-wrapper {
  overflow-x: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-neutral-200);
}

.ui-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.ui-table :deep(thead) {
  background: var(--color-neutral-50);
}

.ui-table :deep(th) {
  padding: var(--spacing-3) var(--spacing-4);
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-neutral-200);
  white-space: nowrap;
}

.ui-table :deep(td) {
  padding: var(--spacing-3) var(--spacing-4);
  color: var(--color-neutral-700);
  border-bottom: 1px solid var(--color-neutral-100);
  vertical-align: middle;
}

.ui-table :deep(tbody tr:last-child td) {
  border-bottom: none;
}

.ui-table :deep(tbody tr:hover td) {
  background: var(--color-neutral-50);
}
</style>
