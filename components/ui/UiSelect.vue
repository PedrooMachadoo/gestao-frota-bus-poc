<script setup lang="ts">
/**
 * UiSelect — Select / Ready (Figma node 7025:5773)
 *
 * Figma specs — stored for future use:
 *
 * CONTAINER (gap: 4px between label → field → helper):
 *   Full component: 264×88px (with label + helper)
 *   Toolbar usage:  264×40px (field only — no label/helper props)
 *
 * FIELD (always 40px tall):
 *   padding: 10px 12px | gap: 8px | border-radius: 4px | border: 2px
 *   States:
 *     Default:   border #E6E6E6  | bg #FFFFFF
 *     Focus:     border #2457D1  | bg #FFFFFF
 *     Open:      border #2457D1  | bg #FFFFFF  (chevron rotates 180°)
 *     Error:     border #B91C1C  | bg #FFFFFF
 *     Disabled:  border #E6E6E6  | bg #F2F2F2
 *
 * VALUE TEXT: 16px / 400 | placeholder #A3A3A3 | filled #1F1F1F | disabled #7A7A7A
 * CHEVRON: 16×16px icon frame
 *
 * LABEL (optional prop, shown above field):
 *   14px / 500 | color #1F1F1F | disabled #7A7A7A
 *
 * HELPER (optional prop, shown below field):
 *   12px / 400 | default #7A7A7A | error #B91C1C
 *
 * DROPDOWN (Select / Menu):
 *   bg #FFFFFF | border 1px #E6E6E6 | radius 8px | padding 8px | gap 4px
 *   z-index: 9998 | position: fixed (Teleport to body)
 *   min-width: matches field width
 *
 *   SEARCH BAR (Select / Search):
 *     height 32px | bg #FFFFFF | border 2px #E6E6E6 | radius 4px | padding 6px 10px | gap 8px
 *     icon: 14×14px | placeholder: 14px / 400 / #A3A3A3 "Buscar..."
 *
 *   DIVIDER: 1px / #E6E6E6
 *
 *   ITEM (Select / Item):
 *     height 36px | radius 4px | padding 8px 7px | gap 11px
 *     RADIO (Select / Single): 16×16px circle | bg #FFFFFF | border 1px #404040 | radius 8
 *     LABEL: 16px / 400 | color #1F1F1F
 *     States:
 *       Default:   bg transparent | text #1F1F1F | radio unselected
 *       Hover:     bg #F2F2F2
 *       Selected:  bg #1B45A3    | text #FFFFFF  | shows Check icon instead of radio
 *       Disabled:  bg #F2F2F2    | text #7A7A7A  | radio opacity 0.4
 *
 * MULTI-SELECT MODE (Mode=Multi) — stored for later:
 *   Same field + dropdown, but items use a checkbox instead of radio,
 *   and multiple values can be selected. Field shows count badge when >1 selected.
 *   Interface change: modelValue becomes string[] | v-model:modelValue[]
 */

import { Search, ChevronDown } from 'lucide-vue-next'

interface Option {
  label: string
  value: string
  disabled?: boolean
}

interface Props {
  modelValue?: string | null
  label?: string
  placeholder?: string
  helper?: string
  error?: string
  options?: Option[]
  disabled?: boolean
  // multi?: boolean  — stored for later (Multi-select mode)
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Selecione...',
  options: () => [],
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// ── State ─────────────────────────────────────────────
const isOpen       = ref(false)
const searchQuery  = ref('')
const fieldRef     = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})
const placement     = ref<'top' | 'bottom'>('bottom')

// ── Computed ──────────────────────────────────────────
const selectedOption = computed(() =>
  props.options.find(o => o.value === props.modelValue) ?? null
)

// filled = valor explicitamente selecionado (inclusive '' para "Todas as linhas")
const isFilled = computed(() => props.modelValue !== null && props.modelValue !== undefined)

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  const q = searchQuery.value.toLowerCase()
  return props.options.filter(o => o.label.toLowerCase().includes(q))
})

// ── Methods ───────────────────────────────────────────
function open() {
  if (props.disabled) return
  isOpen.value = true
  searchQuery.value = ''
  nextTick(() => {
    if (!fieldRef.value) return
    const r = fieldRef.value.getBoundingClientRect()
    dropdownStyle.value = {
      top: `${r.bottom + 4}px`,
      left: `${r.left}px`,
      width: `${Math.max(r.width, 200)}px`
    }
  })
}

function close() {
  isOpen.value = false
}

function toggle() {
  isOpen.value ? close() : open()
}

function selectOption(value: string) {
  emit('update:modelValue', value)
  close()
}

function onClickOutside(e: MouseEvent) {
  if (!isOpen.value) return
  const target = e.target as HTMLElement
  if (!target.closest('.ui-select') && !target.closest('.ui-select-dropdown')) {
    close()
  }
}

function onScroll(e: Event) {
  if (isOpen.value) {
    const target = e.target as HTMLElement
    if (target.closest && target.closest('.ui-select-dropdown')) return
    close()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
  window.addEventListener('scroll', onScroll, true)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
  window.removeEventListener('scroll', onScroll, true)
})
</script>

<template>
  <div
    class="ui-select"
    :class="{
      'ui-select--open':     isOpen,
      'ui-select--disabled': disabled,
      'ui-select--error':    !!error,
      'ui-select--filled':   isFilled,
    }"
  >
    <!-- ── Label (optional, for form context) ── -->
    <span v-if="label" class="ui-select__label">{{ label }}</span>

    <!-- ── Field ── -->
    <div
      ref="fieldRef"
      class="ui-select__field"
      tabindex="0"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-disabled="disabled"
      @click="toggle"
      @keydown.enter.space.prevent="toggle"
      @keydown.escape="close"
    >
      <span
        class="ui-select__value"
        :class="{ 'ui-select__value--placeholder': !isFilled }"
      >
        {{ selectedOption?.label ?? placeholder }}
      </span>
      <span class="ui-select__chevron" :class="{ 'ui-select__chevron--open': isOpen }">
        <ChevronDown :size="14" stroke-width="2" />
      </span>
    </div>

    <!-- ── Helper / Error (optional, for form context) ── -->
    <span v-if="error" class="ui-select__helper ui-select__helper--error">{{ error }}</span>
    <span v-else-if="helper" class="ui-select__helper">{{ helper }}</span>

    <!-- ── Dropdown (teleported to body) ── -->
    <Teleport to="body">
      <Transition name="ui-select-fade">
        <div
          v-if="isOpen"
          class="ui-select-dropdown"
          :style="dropdownStyle"
          @mousedown.stop
        >
          <!-- Search bar -->
          <div class="ui-select-dropdown__search">
            <Search :size="14" class="ui-select-dropdown__search-icon" />
            <input
              v-model="searchQuery"
              class="ui-select-dropdown__search-input"
              placeholder="Buscar..."
              @click.stop
            />
          </div>

          <!-- Divider -->
          <div class="ui-select-dropdown__divider" />

          <!-- Options list -->
          <div class="ui-select-dropdown__list">
            <button
              v-for="opt in filteredOptions"
              :key="opt.value"
              class="ui-select-dropdown__item"
              :class="{
                'ui-select-dropdown__item--selected': opt.value === modelValue,
                'ui-select-dropdown__item--disabled': opt.disabled,
              }"
              :disabled="opt.disabled"
              type="button"
              @click.stop="selectOption(opt.value)"
            >
              <!-- Radio indicator (unselected: ring ○  |  selected: radio_button_checked ◉) -->
              <span
                class="ui-select-dropdown__radio"
                :class="{ 'ui-select-dropdown__radio--selected': opt.value === modelValue }"
              />
              <span class="ui-select-dropdown__item-label">{{ opt.label }}</span>
            </button>

            <!-- Empty state -->
            <p v-if="filteredOptions.length === 0" class="ui-select-dropdown__empty">
              Nenhum resultado
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ── Outer container ──────────────────────────────── */
.ui-select {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
}

/* ── Label ────────────────────────────────────────── */
.ui-select__label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #1F1F1F;
}
.ui-select--disabled .ui-select__label {
  color: #7A7A7A;
}

/* ── Field ────────────────────────────────────────── */
.ui-select__field {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  background: #FFFFFF;
  border: 2px solid #E6E6E6;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
  transition: border-color var(--transition-fast);
  user-select: none;
}

.ui-select__field:focus,
.ui-select--open .ui-select__field {
  border-color: #2457D1;
}

.ui-select--error .ui-select__field {
  border-color: #B91C1C;
}

.ui-select--disabled .ui-select__field {
  background: #F2F2F2;
  border-color: #E6E6E6;
  cursor: not-allowed;
  pointer-events: none;
}

/* ── Value text ───────────────────────────────────── */
.ui-select__value {
  flex: 1;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #1F1F1F;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.ui-select__value--placeholder {
  color: #A3A3A3;
}
.ui-select--disabled .ui-select__value {
  color: #7A7A7A;
}

/* ── Chevron ──────────────────────────────────────── */
.ui-select__chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: #7A7A7A;
  transition: transform var(--transition-fast), color var(--transition-fast);
}
.ui-select__chevron--open {
  transform: rotate(180deg);
  color: #2457D1;
}

/* ── Helper / Error ───────────────────────────────── */
.ui-select__helper {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  color: #7A7A7A;
}
.ui-select__helper--error {
  color: #B91C1C;
}
</style>

<!-- ── Dropdown (global — rendered via Teleport to body) ── -->
<style>
.ui-select-dropdown {
  position: fixed;
  z-index: 9998;
  background: #FFFFFF;
  border: 1px solid #E6E6E6;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  max-height: 320px;
  overflow: hidden;
  transform-origin: top center;
}

.ui-select-dropdown--top {
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.12);
  transform-origin: bottom center;
}

/* ── Search bar ──────────────────────────────────── */
.ui-select-dropdown__search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px;
  background: #FFFFFF;
  border: 2px solid #E6E6E6;
  border-radius: 4px;
  flex-shrink: 0;
  transition: border-color 150ms ease;
}
.ui-select-dropdown__search:focus-within {
  border-color: #2457D1;
}

.ui-select-dropdown__search-icon {
  color: #A3A3A3;
  flex-shrink: 0;
}

.ui-select-dropdown__search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #1F1F1F;
  min-width: 0;
}
.ui-select-dropdown__search-input::placeholder {
  color: #A3A3A3;
}

/* ── Divider ──────────────────────────────────────── */
.ui-select-dropdown__divider {
  height: 1px;
  background: #E6E6E6;
  flex-shrink: 0;
  margin: 0 -8px;  /* bleed to container edges */
}

/* ── Options list ─────────────────────────────────── */
.ui-select-dropdown__list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  scrollbar-width: thin;
  scrollbar-color: #E6E6E6 transparent;
}
.ui-select-dropdown__list::-webkit-scrollbar {
  width: 4px;
}
.ui-select-dropdown__list::-webkit-scrollbar-thumb {
  background: #E6E6E6;
  border-radius: 4px;
}

/* ── Item ──────────────────────────────────────────── */
.ui-select-dropdown__item {
  display: flex;
  align-items: center;
  gap: 11px;
  height: 36px;
  min-height: 36px;
  padding: 0 7px;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #1F1F1F;
  transition: background 100ms ease;
  width: 100%;
  flex-shrink: 0;
}
.ui-select-dropdown__item:hover:not(:disabled) {
  background: #F2F2F2;
}
.ui-select-dropdown__item--selected {
  background: #1B45A3 !important;
  color: #FFFFFF;
}
.ui-select-dropdown__item--disabled {
  background: #F2F2F2;
  color: #7A7A7A;
  cursor: not-allowed;
}

/* ── Radio indicator ──────────────────────────────────
 *
 *  Figma node 7025:5828 — Select / Single
 *
 *  Unselected:
 *    16×16px circle | bg #FFFFFF | border 1px solid #404040 | radius 50%
 *
 *  Selected (on bg #1B45A3):
 *    radio_button_checked style (Material Design)
 *    - outer ring:  2px solid #3FE7FF | bg transparent | radius 50%
 *    - inner dot:   8×8px #3FE7FF  via ::after | centered
 *
 *  Disabled:
 *    opacity 0.4 on the whole indicator (applied via parent item class)
 * ────────────────────────────────────────────────── */
.ui-select-dropdown__radio {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid #404040;
  background: #FFFFFF;
  transition: border-color 120ms ease, background 120ms ease;
}

/* Selected — outer teal ring */
.ui-select-dropdown__radio--selected {
  background: transparent;
  border: 2px solid #3FE7FF;
}

/* Selected — inner teal dot */
.ui-select-dropdown__radio--selected::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3FE7FF;
}

/* ── Item label ───────────────────────────────────── */
.ui-select-dropdown__item-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Empty state ──────────────────────────────────── */
.ui-select-dropdown__empty {
  padding: 8px 7px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #A3A3A3;
  text-align: center;
  margin: 0;
}

/* ── Transition ───────────────────────────────────── */
.ui-select-fade-enter-active,
.ui-select-fade-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}
.ui-select-fade-enter-from,
.ui-select-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px) scaleY(0.98);
}
.ui-select-dropdown--top.ui-select-fade-enter-from,
.ui-select-dropdown--top.ui-select-fade-leave-to {
  transform: translateY(4px) scaleY(0.98);
}
</style>
