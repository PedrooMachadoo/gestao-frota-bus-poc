<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  size: 'md',
})
</script>

<template>
  <span class="ui-spinner" :class="`ui-spinner--${size}`" aria-label="Carregando" />
</template>

<style scoped>
.ui-spinner {
  display: inline-block;
  border-radius: var(--radius-full);
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.ui-spinner--sm { width: 14px; height: 14px; }
.ui-spinner--md { width: 20px; height: 20px; }
.ui-spinner--lg { width: 32px; height: 32px; border-width: 3px; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
