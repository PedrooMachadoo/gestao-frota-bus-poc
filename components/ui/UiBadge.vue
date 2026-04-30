<script setup lang="ts">
interface Props {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default'
  solid?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  solid: false,
})
</script>

<template>
  <span
    class="ui-badge"
    :class="[`ui-badge--${variant}`, { 'ui-badge--solid': solid }]"
  >
    <slot />
  </span>
</template>

<style scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: 2px var(--spacing-2);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  border: 1px solid transparent;
}

/* default */
.ui-badge--default {
  background: var(--color-neutral-100);
  color: var(--color-neutral-700);
  border-color: var(--color-neutral-200);
}

/* success */
.ui-badge--success {
  background: var(--color-success-soft-bg);
  color: var(--color-success-soft-text);
  border-color: var(--color-success-soft-border);
}
.ui-badge--success.ui-badge--solid {
  background: var(--color-success-solid-bg);
  color: var(--color-success-solid-text);
  border-color: transparent;
}

/* warning */
.ui-badge--warning {
  background: var(--color-warning-soft-bg);
  color: var(--color-warning-soft-text);
  border-color: var(--color-warning-soft-border);
}
.ui-badge--warning.ui-badge--solid {
  background: var(--color-warning-solid-bg);
  color: var(--color-warning-solid-text);
  border-color: transparent;
}

/* danger */
.ui-badge--danger {
  background: var(--color-danger-soft-bg);
  color: var(--color-danger-soft-text);
  border-color: var(--color-danger-soft-border);
}
.ui-badge--danger.ui-badge--solid {
  background: var(--color-danger-solid-bg);
  color: var(--color-danger-solid-text);
  border-color: transparent;
}

/* info */
.ui-badge--info {
  background: var(--color-info-soft-bg);
  color: var(--color-info-soft-text);
  border-color: var(--color-info-soft-border);
}
.ui-badge--info.ui-badge--solid {
  background: var(--color-info-solid-bg);
  color: var(--color-info-solid-text);
  border-color: transparent;
}
</style>
