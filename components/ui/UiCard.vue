<script setup lang="ts">
interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  padding: 'md',
})
</script>

<template>
  <div class="ui-card" :class="`ui-card--${padding}`">
    <slot />
  </div>
</template>

<style scoped>
.ui-card {
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
}

.ui-card--none  { padding: 0; }
.ui-card--sm    { padding: var(--spacing-3); }
.ui-card--md    { padding: var(--spacing-5); }
.ui-card--lg    { padding: var(--spacing-6); }
</style>
