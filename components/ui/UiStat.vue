<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  delta?: string | number
  deltaType?: 'positive' | 'negative' | 'neutral'
}

withDefaults(defineProps<Props>(), {
  deltaType: 'neutral',
})
</script>

<template>
  <div class="ui-stat">
    <span class="ui-stat__label text-caption">{{ label }}</span>
    <span class="ui-stat__value text-h3">{{ value }}</span>
    <span
      v-if="delta !== undefined"
      class="ui-stat__delta text-label-sm"
      :class="`ui-stat__delta--${deltaType}`"
    >
      {{ delta }}
    </span>
  </div>
</template>

<style scoped>
.ui-stat {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.ui-stat__label {
  color: var(--color-neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 11px;
}

.ui-stat__value {
  color: var(--color-neutral-900);
}

.ui-stat__delta {
  font-size: 12px;
}

.ui-stat__delta--positive { color: var(--color-success-soft-text); }
.ui-stat__delta--negative { color: var(--color-danger-soft-text); }
.ui-stat__delta--neutral  { color: var(--color-neutral-500); }
</style>
