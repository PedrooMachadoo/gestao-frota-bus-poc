<script setup lang="ts">
import { X, ChevronDown } from 'lucide-vue-next'
import { mockLines } from '~/data/lines.mock'
import type { Line } from '~/types'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'add', line: Line): void
}>()

// ── Form state ─────────────────────────────────────────
const form = reactive({
  codigo:            '',
  nomeLinha:         '',
  tipoOperacao:      null as string | null,
  substituirInicio1: 'nao',
  substituirInicio2: 'sim',
})

// ── Tipo de operação options ───────────────────────────
const tipoOptions = [
  { label: 'Urbano',         value: 'Urbano' },
  { label: 'Metropolitano',  value: 'Metropolitano' },
  { label: 'Intermunicipal', value: 'Intermunicipal' },
]

// ── Criticidade options ────────────────────────────────
const criticidadeOptions = [
  { label: 'Baixa', value: 'baixa' },
  { label: 'Média', value: 'media' },
  { label: 'Alta',  value: 'alta'  },
]

const defaultAlertas = [
  { id: 1, label: 'Regular',               ativo: 'nao', parametro: '',   unidade: '',  criticidade: 'baixa' },
  { id: 2, label: 'Comboio',               ativo: 'sim', parametro: '',   unidade: '',  criticidade: 'media' },
  { id: 3, label: 'Checagem',              ativo: 'nao', parametro: '00', unidade: '%', criticidade: 'alta'  },
  { id: 4, label: 'Regularidade',          ativo: 'nao', parametro: '',   unidade: '',  criticidade: 'baixa' },
  { id: 5, label: 'Desvio de intinerário', ativo: 'sim', parametro: '',   unidade: '',  criticidade: 'media' },
]

// ── Alert rows ─────────────────────────────────────────
const alertas = reactive(JSON.parse(JSON.stringify(defaultAlertas)))

function resetState() {
  form.codigo = ''
  form.nomeLinha = ''
  form.tipoOperacao = null
  form.substituirInicio1 = 'nao'
  form.substituirInicio2 = 'sim'

  alertas.splice(0, alertas.length, ...JSON.parse(JSON.stringify(defaultAlertas)))
}

watch(() => props.open, (isOpen) => {
  if (isOpen) resetState()
})

const isFormValid = computed(() => {
  return form.codigo.trim() !== '' &&
         form.nomeLinha.trim() !== '' &&
         form.tipoOperacao !== null &&
         form.tipoOperacao !== ''
})

function handleAdd() {
  if (!isFormValid.value) return

  const newLine: Line = {
    id: String(Date.now()),
    code: form.codigo,
    name: form.nomeLinha,
    tipoOperacao: form.tipoOperacao!,
    origin: 'Não definido',
    destination: 'Não definido',
    status: 'active',
    vehicleCount: 0,
    frequency: '—',
  }

  emit('add', newLine)
  emit('close')
}

// Close on Escape
onMounted(() => {
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') emit('close') }
  document.addEventListener('keydown', onKey)
  onUnmounted(() => document.removeEventListener('keydown', onKey))
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="modal-overlay" @click.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">

          <!-- ── Header ── -->
          <div class="modal__header">
            <span id="modal-title" class="modal__title">Adicionar Linha</span>
            <button class="modal__close" aria-label="Fechar" @click="emit('close')">
              <X :size="18" />
            </button>
          </div>

          <!-- ── Body ── -->
          <div class="modal__body">

            <!-- Row 1: Código + Nome da Linha -->
            <div class="form-row">
              <div class="field-group" style="width: 200px; flex-shrink: 0">
                <label class="field-label">Código:<span class="required">*</span></label>
                <input v-model="form.codigo" class="field-input" placeholder="Digite aqui" />
              </div>
              <div class="field-group" style="flex: 1; min-width: 0">
                <label class="field-label">Nome da Linha:<span class="required">*</span></label>
                <input v-model="form.nomeLinha" class="field-input" placeholder="Digite aqui" />
              </div>
            </div>

            <!-- Row 2: Tipo de operação + Radio groups -->
            <div class="form-row">
              <div class="field-group" style="flex: 1; min-width: 0">
                <label class="field-label">Tipo de operação:<span class="required">*</span></label>
                <UiSelect
                  v-model="form.tipoOperacao"
                  placeholder="Selecione uma opção"
                  :options="tipoOptions"
                  class="tipo-select"
                />
              </div>

              <div class="radio-section">
                <div class="radio-group">
                  <span class="field-label">Substituir Inicio:</span>
                  <div class="radio-pair">
                    <label class="radio-label">
                      <input v-model="form.substituirInicio1" type="radio" name="sub1" value="sim" class="radio-input" />
                      Sim
                    </label>
                    <label class="radio-label">
                      <input v-model="form.substituirInicio1" type="radio" name="sub1" value="nao" class="radio-input" />
                      Não
                    </label>
                  </div>
                </div>

                <div class="radio-group">
                  <span class="field-label">Substituir Inicio:</span>
                  <div class="radio-pair">
                    <label class="radio-label">
                      <input v-model="form.substituirInicio2" type="radio" name="sub2" value="sim" class="radio-input" />
                      Sim
                    </label>
                    <label class="radio-label">
                      <input v-model="form.substituirInicio2" type="radio" name="sub2" value="nao" class="radio-input" />
                      Não
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Row 3: Consolidação + Tolerância -->
            <div class="form-row">
              <div class="montar-group">
                <span class="field-label">Consolidação Viagem:</span>
                <UiButton variant="primary" style="width: 100%">Montar</UiButton>
              </div>
              <div class="montar-group">
                <span class="field-label">Tolerância / Pontualidade:</span>
                <UiButton variant="primary" style="width: 100%">Montar</UiButton>
              </div>
            </div>

            <!-- ── Configurar alertas ── -->
            <div class="alertas">
              <!-- Section header -->
              <div class="alertas__section-header">Configurar alertas</div>

              <!-- Column headers -->
              <div class="alertas__header-row">
                <div class="alertas__col alertas__col--ativar">
                  <span class="alertas__th">Ativar</span>
                </div>
                <div class="alertas__col alertas__col--alerta">
                  <span class="alertas__th">Alerta</span>
                </div>
                <div class="alertas__col alertas__col--parametro">
                  <span class="alertas__th">Parâmetro</span>
                </div>
                <div class="alertas__col alertas__col--criticidade">
                  <span class="alertas__th">Criticidade</span>
                </div>
              </div>

              <!-- Body rows -->
              <div
                v-for="alerta in alertas"
                :key="alerta.id"
                class="alertas__row"
              >
                <!-- Ativar: Sim / Não radio -->
                <div class="alertas__col alertas__col--ativar">
                  <div class="radio-pair radio-pair--sm">
                    <label class="radio-label">
                      <input
                        v-model="alerta.ativo"
                        type="radio"
                        :name="`alerta-${alerta.id}`"
                        value="sim"
                        class="radio-input"
                      />
                      Sim
                    </label>
                    <label class="radio-label">
                      <input
                        v-model="alerta.ativo"
                        type="radio"
                        :name="`alerta-${alerta.id}`"
                        value="nao"
                        class="radio-input"
                      />
                      Não
                    </label>
                  </div>
                </div>

                <!-- Alerta label -->
                <div class="alertas__col alertas__col--alerta">
                  <span class="alertas__cell-text">{{ alerta.label }}</span>
                </div>

                <!-- Parâmetro — "Table / Itens" DS pattern -->
                <div class="alertas__col alertas__col--parametro">
                  <!-- Desabilitado: mesmo container, bg cinza, texto muted -->
                  <div v-if="!alerta.unidade" class="param-cell param-cell--disabled">
                    <span class="param-cell__value">--</span>
                  </div>
                  <!-- Ativo: container branco com input inline + unidade -->
                  <div v-else class="param-cell param-cell--active">
                    <input
                      v-model="alerta.parametro"
                      type="text"
                      inputmode="numeric"
                      class="param-cell__input"
                      @input="alerta.parametro = String(alerta.parametro).replace(/[^0-9]/g, '')"
                    />
                    <span class="param-cell__unit">{{ alerta.unidade }}</span>
                  </div>
                </div>

                <!-- Criticidade — UiSelect padrão -->
                <div class="alertas__col alertas__col--criticidade">
                  <UiSelect
                    v-model="alerta.criticidade"
                    :options="criticidadeOptions"
                    class="criticidade-select"
                  />
                </div>
              </div>
            </div>

          </div>

          <!-- ── Footer ── -->
          <div class="modal__footer">
            <UiButton variant="primary" :disabled="!isFormValid" @click="handleAdd">Adicionar</UiButton>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ──────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* ── Modal shell ──────────────────────────────────── */
.modal {
  width: 100%;
  max-width: 640px;
  background: var(--color-neutral-0);
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

/* ── Header ───────────────────────────────────────── */
.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  background: #0B1F47;
  flex-shrink: 0;
  border-radius: 15px 15px 0 0;
}

.modal__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-neutral-0);
}

.modal__close {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.70);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.modal__close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--color-neutral-0);
}

/* ── Body ─────────────────────────────────────────── */
.modal__body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  flex: 1;
}

/* ── Footer ───────────────────────────────────────── */
.modal__footer {
  padding: 12px 24px 20px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
  border-top: 1px solid var(--color-neutral-150);
}

/* ── Form row ─────────────────────────────────────── */
.form-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

/* ── Field group (label + field) ──────────────────── */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #1F1F1F;
  white-space: nowrap;
}

.required {
  color: var(--color-danger-solid-bg);
  margin-left: 1px;
}

/* ── Text input ───────────────────────────────────── */
.field-input {
  height: 40px;
  padding: 0 12px;
  border: 2px solid #E6E6E6;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 400;
  color: #1F1F1F;
  background: var(--color-neutral-0);
  outline: none;
  width: 100%;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.25);
  transition: border-color var(--transition-fast);
}
.field-input::placeholder { color: #A3A3A3; }
.field-input:focus { border-color: #2457D1; }

/* ── UiSelect overrides — tipo de operação ────────── */
/* Faz o componente preencher o field-group */
.tipo-select {
  width: 100%;
  min-width: 0 !important;
}
:deep(.tipo-select .ui-select__field) {
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.25);
}

/* ── UiSelect overrides — criticidade (compacto) ──── */
.criticidade-select {
  width: 100%;
  min-width: 0 !important;
}
:deep(.criticidade-select .ui-select__field) {
  height: 32px;
  font-size: 13px;
}

/* ── Radio section (Substituir Inicio) ────────────── */
.radio-section {
  display: flex;
  gap: 20px;
  flex-shrink: 0;
  align-items: flex-end;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.radio-pair {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
}

.radio-pair--sm {
  gap: 8px;
  height: auto;
}

.radio-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 400;
  color: var(--color-neutral-700);
  cursor: pointer;
  white-space: nowrap;
}

.radio-input {
  accent-color: #2D6BFF;
  width: 14px;
  height: 14px;
  cursor: pointer;
  flex-shrink: 0;
}

/* ── Montar section ───────────────────────────────── */
.montar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

/* ── Alertas table ────────────────────────────────── */
.alertas {
  display: flex;
  flex-direction: column;
}

.alertas__section-header {
  padding: 6px 12px;
  background: var(--color-neutral-100);
  border-radius: 4px;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.25);
  font-size: 14px;
  font-weight: 700;
  color: var(--color-neutral-800);
  margin-bottom: 6px;
}

.alertas__header-row,
.alertas__row {
  display: flex;
  align-items: center;
}

.alertas__header-row {
  gap: 4px;
  margin-bottom: 2px;
}

.alertas__th {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-neutral-800);
}

.alertas__row {
  border-bottom: 1px solid #E5E5E5;
  min-height: 44px;
  padding: 4px 0;
}

.alertas__row:last-child {
  border-bottom: none;
}

/* Column widths */
.alertas__col {
  display: flex;
  align-items: center;
  padding: 0 4px;
}

.alertas__col--ativar     { width: 126px; flex-shrink: 0; }
.alertas__col--alerta     { flex: 1; min-width: 0; }
.alertas__col--parametro  { width: 96px; flex-shrink: 0; }
.alertas__col--criticidade{ width: 138px; flex-shrink: 0; }

/* Header cells — card style */
.alertas__header-row .alertas__col {
  height: 28px;
  background: var(--color-neutral-100);
  border-radius: 4px;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.25);
  padding: 0 8px;
}

.alertas__cell-text {
  font-size: 14px;
  color: var(--color-neutral-700);
}

/* ── Parâmetro cell — DS "Table / Itens" pattern ─── */

/* Base cell — igual em disabled e active */
.param-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 6px 0 8px;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
}

/* Desabilitado: bg #F5F5F5, cor #A3A3A3 */
.param-cell--disabled {
  background: #F5F5F5;
  cursor: default;
}
.param-cell--disabled .param-cell__value {
  flex: 1;
  font-size: 14px;
  font-weight: 400;
  color: #A3A3A3;
  text-align: center;
}

/* Ativo: bg branco, borda sutil, texto escuro */
.param-cell--active {
  background: #FFFFFF;
  border: 1px solid #E6E6E6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}
.param-cell__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 400;
  color: #1F1F1F;
  text-align: center;
  padding: 0;
}
.param-cell__unit {
  font-size: 12px;
  font-weight: 400;
  color: #1F1F1F;
  flex-shrink: 0;
}

/* ── Transition ───────────────────────────────────── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 180ms ease;
}
.modal-fade-enter-active .modal,
.modal-fade-leave-active .modal {
  transition: transform 180ms ease, opacity 180ms ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .modal,
.modal-fade-leave-to .modal {
  transform: translateY(-12px);
  opacity: 0;
}
</style>
