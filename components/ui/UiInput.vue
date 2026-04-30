<script setup lang="ts">
interface Props {
  modelValue?: string | number
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
  type?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="ui-input" :class="{ 'ui-input--error': error, 'ui-input--disabled': disabled }">
    <label v-if="label" class="ui-input__label">
      {{ label }}
      <span v-if="required" class="ui-input__required">*</span>
    </label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      class="ui-input__field"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="error" class="ui-input__error">{{ error }}</span>
  </div>
</template>

<style scoped>
.ui-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.ui-input__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-neutral-700);
}

.ui-input__required {
  color: var(--color-danger-solid-bg);
  margin-left: 2px;
}

.ui-input__field {
  height: 38px;
  padding: 0 var(--spacing-3);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-neutral-900);
  background: var(--color-neutral-0);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  outline: none;
  width: 100%;
}

.ui-input__field::placeholder {
  color: var(--color-neutral-400);
}

.ui-input__field:focus {
  border-color: var(--color-action-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-action-primary) 15%, transparent);
}

.ui-input--error .ui-input__field {
  border-color: var(--color-danger-solid-bg);
}

.ui-input--disabled .ui-input__field {
  background: var(--color-neutral-100);
  color: var(--color-neutral-400);
  cursor: not-allowed;
}

.ui-input__error {
  font-size: 12px;
  color: var(--color-danger-soft-text);
}
</style>
