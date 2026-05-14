import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import UiSelect from './UiSelect.vue'

const tipoOptions = [
  { label: 'Urbano',         value: 'urbano' },
  { label: 'Metropolitano',  value: 'metropolitano' },
  { label: 'Intermunicipal', value: 'intermunicipal' },
]

const criticidadeOptions = [
  { label: 'Baixa',              value: 'baixa' },
  { label: 'Média',              value: 'media' },
  { label: 'Alta',               value: 'alta'  },
  { label: 'Opção desabilitada', value: 'disabled', disabled: true },
]

const meta: Meta<typeof UiSelect> = {
  title: 'UI / UiSelect',
  component: UiSelect,

  argTypes: {
    modelValue: { control: 'text', description: 'Valor selecionado (v-model)' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helper: { control: 'text', description: 'Texto auxiliar abaixo do campo' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
    options: { control: 'object', description: 'Array de { label, value, disabled? }' },
  },
  args: {
    modelValue: null,
    label: 'Tipo de Operação',
    placeholder: 'Selecione uma opção',
    helper: '',
    error: '',
    disabled: false,
    options: tipoOptions,
  },
  render: (args) => ({
    components: { UiSelect },
    setup() {
      const selected = ref(args.modelValue ?? null)
      return { args, selected }
    },
    template: `
      <div style="width: 280px; padding-bottom: 240px">
        <UiSelect v-bind="args" v-model="selected" />
        <p style="margin-top: 12px; font-size: 12px; color: var(--color-neutral-500)">
          v-model: <code>{{ selected ?? 'null' }}</code>
        </p>
      </div>
    `,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const WithPreselectedValue: Story = {
  name: 'Valor pré-selecionado',
  args: { modelValue: 'urbano' },
}

export const WithHelperText: Story = {
  name: 'Com texto auxiliar',
  args: {
    label: 'Criticidade',
    helper: 'Nível de prioridade do alerta',
    options: criticidadeOptions,
  },
}

export const ErrorState: Story = {
  name: 'Estado de erro',
  args: {
    label: 'Tipo de Operação',
    error: 'Campo obrigatório',
    options: tipoOptions,
  },
}

export const Disabled: Story = {
  name: 'Desabilitado',
  args: {
    label: 'Tipo de Operação',
    modelValue: 'urbano',
    disabled: true,
    options: tipoOptions,
  },
}

export const WithDisabledOption: Story = {
  name: 'Com opção desabilitada',
  args: {
    label: 'Criticidade',
    options: criticidadeOptions,
    placeholder: 'Selecione a criticidade',
  },
}

export const ManyOptions: Story = {
  name: 'Muitas opções (com scroll)',
  args: {
    label: 'Linha',
    placeholder: 'Selecione a linha',
    options: Array.from({ length: 20 }, (_, i) => ({
      label: `Linha ${String(i + 1).padStart(2, '0')} — Origem → Destino`,
      value: `line-${i + 1}`,
    })),
  },
}
