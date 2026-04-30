<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  iconLeft?: boolean
  iconRight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
})

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <button
    :type="type"
    class="ui-btn"
    :class="[`ui-btn--${variant}`, `ui-btn--${size}`, { 'ui-btn--loading': loading }]"
    :disabled="disabled || loading"
  >
    <!-- Left icon slot -->
    <span v-if="$slots['icon-left'] && !loading" class="ui-btn__icon">
      <slot name="icon-left" />
    </span>

    <!-- Spinner (loading state) -->
    <UiSpinner v-if="loading" size="sm" />

    <!-- Label -->
    <span v-if="!loading" class="ui-btn__label">
      <slot />
    </span>

    <!-- Right icon slot -->
    <span v-if="$slots['icon-right'] && !loading" class="ui-btn__icon">
      <slot name="icon-right" />
    </span>
  </button>
</template>

<style scoped>
/* ── Base ─────────────────────────────────────────── */
.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
  white-space: nowrap;
  line-height: 1;
  outline: none;
  flex-shrink: 0;
}

.ui-btn__icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.ui-btn__label {
  display: inline-flex;
  align-items: center;
}

/* ── Sizes ────────────────────────────────────────── */
.ui-btn--sm { height: 28px; padding: 0 12px; font-size: 13px; }
.ui-btn--md { height: 36px; padding: 0 16px; font-size: 14px; }
.ui-btn--lg { height: 44px; padding: 0 20px; font-size: 15px; }

/* ── Primary ──────────────────────────────────────── */
.ui-btn--primary {
  background: #2D6BFF;
  color: #FFFFFF;
  border-color: transparent;
}
.ui-btn--primary:hover:not(:disabled):not(.ui-btn--loading) {
  background: #2457D1;
}
.ui-btn--primary:active:not(:disabled):not(.ui-btn--loading) {
  background: #1B45A3;
}
.ui-btn--primary:focus-visible:not(:disabled) {
  background: #2FC2D6;
  box-shadow: 0 0 0 3px rgba(93, 55, 245, 0.40);
}
.ui-btn--primary:disabled {
  background: #F5F5F5;
  border-color: #E5E5E5;
  color: #A3A3A3;
  cursor: not-allowed;
}

/* ── Secondary ────────────────────────────────────── */
.ui-btn--secondary {
  background: #FFFFFF;
  color: #171717;
  border-color: #E5E5E5;
}
.ui-btn--secondary:hover:not(:disabled):not(.ui-btn--loading) {
  background: #F5F5F5;
  border-color: #E5E5E5;
}
.ui-btn--secondary:active:not(:disabled):not(.ui-btn--loading) {
  background: #E5E5E5;
  border-color: #E5E5E5;
}
.ui-btn--secondary:focus-visible:not(:disabled) {
  background: #2D6BFF;
  border-color: #1F1F1F;
  color: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(93, 55, 245, 0.40);
}
.ui-btn--secondary:disabled {
  background: #F5F5F5;
  border-color: #E5E5E5;
  color: #A3A3A3;
  cursor: not-allowed;
}

/* ── Ghost ────────────────────────────────────────── */
.ui-btn--ghost {
  background: transparent;
  color: var(--color-neutral-700);
  border-color: transparent;
}
.ui-btn--ghost:hover:not(:disabled) {
  background: var(--color-neutral-100);
}
.ui-btn--ghost:active:not(:disabled) {
  background: var(--color-neutral-200);
}
.ui-btn--ghost:focus-visible:not(:disabled) {
  box-shadow: 0 0 0 3px rgba(93, 55, 245, 0.40);
}
.ui-btn--ghost:disabled {
  color: #A3A3A3;
  cursor: not-allowed;
}

/* ── Danger ───────────────────────────────────────── */
.ui-btn--danger {
  background: var(--color-danger-solid-bg);
  color: var(--color-danger-solid-text);
  border-color: transparent;
}
.ui-btn--danger:hover:not(:disabled) {
  background: #DC2626;
}
.ui-btn--danger:active:not(:disabled) {
  background: #B91C1C;
}
.ui-btn--danger:focus-visible:not(:disabled) {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.40);
}
.ui-btn--danger:disabled {
  background: #F5F5F5;
  border-color: #E5E5E5;
  color: #A3A3A3;
  cursor: not-allowed;
}

/* ── Loading ──────────────────────────────────────── */
.ui-btn--loading {
  cursor: wait;
  pointer-events: none;
}
</style>
