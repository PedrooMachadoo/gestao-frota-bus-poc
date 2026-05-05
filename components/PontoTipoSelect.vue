<script setup lang="ts">
/**
 * PontoTipoSelect — Select customizado para "Tipo de ponto"
 *
 * Cada opção tem:
 *   - dotBg: cor do círculo no dropdown e no campo quando selecionado
 *   - balloonColor: cor do balão no mapa
 *   - icon: componente Lucide a renderizar dentro do círculo
 *
 * Figma: node 2150:105820
 *   Field: 261px, border 2px #2457D1 (open), bg white
 *   Dropdown: bg white, border 1px #E6E6E6, radius 8px, shadow
 *   Item: 36px, padding 8px 7px, gap 11px, radius 4px
 *   Selected item: bg #1B45A3, text white
 *   Icon circle: 24×24, rounded, fills specific to each type
 *   Preview circle (next to field): 40×40, bg #2D6BFF, border 2px #E8E8E8, shadow
 */

import { Search, ChevronDown, Home, Bus, MapPin, Users, HelpCircle } from 'lucide-vue-next'

export interface TipoPontoOption {
  value:        string
  label:        string
  dotBg:        string   // cor do círculo no dropdown
  balloonColor: string   // cor do balão no mapa
  icon:         ReturnType<typeof defineComponent> | any
}

const props = defineProps<{
  modelValue: string | null
  options:    TipoPontoOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

// ── State ─────────────────────────────────────────────
const isOpen      = ref(false)
const searchQuery = ref('')
const fieldRef    = ref<HTMLElement | null>(null)
const dropStyle   = ref<Record<string, string>>({})

// ── Computed ──────────────────────────────────────────
const selected = computed(() =>
  props.options.find(o => o.value === props.modelValue) ?? null
)

const filtered = computed(() => {
  if (!searchQuery.value) return props.options
  const q = searchQuery.value.toLowerCase()
  return props.options.filter(o => o.label.toLowerCase().includes(q))
})

// ── Methods ───────────────────────────────────────────
function open() {
  isOpen.value = true
  searchQuery.value = ''
  nextTick(() => {
    if (!fieldRef.value) return
    const r = fieldRef.value.getBoundingClientRect()
    dropStyle.value = {
      top:   `${r.bottom + 4}px`,
      left:  `${r.left}px`,
      width: `${r.width}px`,
    }
  })
}

function close() {
  isOpen.value = false
  searchQuery.value = ''
}

function toggle() {
  isOpen.value ? close() : open()
}

function pick(value: string) {
  emit('update:modelValue', value)
  close()
}

function onOutside(e: MouseEvent) {
  if (!isOpen.value) return
  const t = e.target as HTMLElement
  if (!t.closest('.pts-field') && !t.closest('.pts-dropdown')) close()
}

function onScroll(e: Event) {
  if (!isOpen.value) return
  const t = e.target as HTMLElement
  if (t.closest?.('.pts-dropdown')) return
  close()
}

onMounted(() => {
  document.addEventListener('mousedown', onOutside)
  window.addEventListener('scroll', onScroll, true)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onOutside)
  window.removeEventListener('scroll', onScroll, true)
})
</script>

<template>
  <div class="pts-wrap">
    <!-- ── Field ── -->
    <div
      ref="fieldRef"
      class="pts-field"
      :class="{ 'pts-field--open': isOpen }"
      tabindex="0"
      role="combobox"
      :aria-expanded="isOpen"
      @click="toggle"
      @keydown.enter.space.prevent="toggle"
      @keydown.escape="close"
    >
      <!-- Icon of selected tipo (or empty slot) -->
      <span
        v-if="selected"
        class="pts-field__dot"
        :style="{ background: selected.dotBg }"
      >
        <component :is="selected.icon" :size="12" color="white" />
      </span>

      <!-- Value / placeholder -->
      <span
        class="pts-field__value"
        :class="{ 'pts-field__value--placeholder': !selected }"
      >
        {{ selected?.label ?? 'Selecione uma opção' }}
      </span>

      <!-- Chevron -->
      <span class="pts-field__chevron" :class="{ 'pts-field__chevron--open': isOpen }">
        <ChevronDown :size="14" stroke-width="2" />
      </span>
    </div>

    <!-- ── Dropdown (Teleport to body) ── -->
    <Teleport to="body">
      <Transition name="pts-fade">
        <div
          v-if="isOpen"
          class="pts-dropdown"
          :style="dropStyle"
          @mousedown.stop
        >
          <!-- Search -->
          <div class="pts-dropdown__search">
            <Search :size="13" class="pts-dropdown__search-icon" />
            <input
              v-model="searchQuery"
              class="pts-dropdown__search-input"
              placeholder="Buscar..."
              @click.stop
            />
          </div>

          <!-- Divider -->
          <div class="pts-dropdown__divider" />

          <!-- Items -->
          <div class="pts-dropdown__list">
            <button
              v-for="opt in filtered"
              :key="opt.value"
              class="pts-dropdown__item"
              :class="{ 'pts-dropdown__item--selected': opt.value === modelValue }"
              type="button"
              @click.stop="pick(opt.value)"
            >
              <!-- Colored icon circle -->
              <span
                class="pts-dropdown__icon"
                :style="{ background: opt.dotBg }"
              >
                <component :is="opt.icon" :size="13" color="white" />
              </span>

              <!-- Label -->
              <span class="pts-dropdown__label">{{ opt.label }}</span>
            </button>

            <p v-if="filtered.length === 0" class="pts-dropdown__empty">
              Nenhum resultado
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ── Wrap ─────────────────────────────────────────── */
.pts-wrap {
  position: relative;
  width: 100%;
}

/* ── Field ────────────────────────────────────────── */
.pts-field {
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
  width: 100%;
}
.pts-field:focus,
.pts-field--open {
  border-color: #2457D1;
}

/* ── Dot/icon inside field ─────────────────────────── */
.pts-field__dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Value text ───────────────────────────────────── */
.pts-field__value {
  flex: 1;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #1F1F1F;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.pts-field__value--placeholder { color: #A3A3A3; }

/* ── Chevron ──────────────────────────────────────── */
.pts-field__chevron {
  color: #A3A3A3;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  transition: transform var(--transition-fast);
}
.pts-field__chevron--open { transform: rotate(180deg); }
</style>

<!-- Dropdown styles — global so Teleport funciona fora do scoped -->
<style>
/* ── Dropdown container ───────────────────────────── */
.pts-dropdown {
  position: fixed;
  z-index: 9999;
  background: #FFFFFF;
  border: 1px solid #E6E6E6;
  border-radius: 8px;
  padding: 8px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

/* ── Search ───────────────────────────────────────── */
.pts-dropdown__search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px;
  background: #FFFFFF;
  border: 2px solid #E6E6E6;
  border-radius: 4px;
}
.pts-dropdown__search-icon { color: #A3A3A3; flex-shrink: 0; }
.pts-dropdown__search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #1F1F1F;
  min-width: 0;
}
.pts-dropdown__search-input::placeholder { color: #A3A3A3; }

/* ── Divider ──────────────────────────────────────── */
.pts-dropdown__divider {
  height: 1px;
  background: #E6E6E6;
  margin: 4px 0;
}

/* ── List ─────────────────────────────────────────── */
.pts-dropdown__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ── Item ─────────────────────────────────────────── */
.pts-dropdown__item {
  display: flex;
  align-items: center;
  gap: 11px;
  height: 36px;
  padding: 0 7px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  text-align: left;
  width: 100%;
  transition: background var(--transition-fast);
}
.pts-dropdown__item:hover:not(.pts-dropdown__item--selected) {
  background: #F2F2F2;
}
.pts-dropdown__item--selected {
  background: #1B45A3;
}
.pts-dropdown__item--selected .pts-dropdown__label { color: #FFFFFF; }

/* ── Icon circle inside item ──────────────────────── */
.pts-dropdown__icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Label ────────────────────────────────────────── */
.pts-dropdown__label {
  font-size: 14px;
  font-weight: 400;
  color: #1F1F1F;
  white-space: nowrap;
}

/* ── Empty state ──────────────────────────────────── */
.pts-dropdown__empty {
  padding: 8px 7px;
  font-size: 13px;
  color: #A3A3A3;
  text-align: center;
}

/* ── Transition ───────────────────────────────────── */
.pts-fade-enter-active { transition: opacity 120ms ease, transform 120ms ease; }
.pts-fade-leave-active { transition: opacity 80ms ease, transform 80ms ease; }
.pts-fade-enter-from,
.pts-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
