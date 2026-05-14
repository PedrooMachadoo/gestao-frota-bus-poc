import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import UiInput from './UiInput.vue'

const meta: Meta<typeof UiInput> = {
  title: 'UI / UiInput',
  component: UiInput,

  argTypes: {
    modelValue: { control: 'text', description: 'Valor ligado via v-model' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text', description: 'Mensagem de erro (borda vermelha + helper text)' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel'],
    },
  },
  args: {
    modelValue: '',
    label: 'Código da Linha',
    placeholder: 'Digite aqui',
    error: '',
    disabled: false,
    required: false,
    type: 'text',
  },
  render: (args) => ({
    components: { UiInput },
    setup() {
      const value = ref(args.modelValue ?? '')
      return { args, value }
    },
    template: `
      <div style="width: 320px">
        <UiInput v-bind="args" v-model="value" />
      </div>
    `,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const WithLabel: Story = {
  name: 'Com label',
  args: { label: 'Nome da Linha', placeholder: 'Ex: Centro – Terminal Norte' },
}

export const Required: Story = {
  name: 'Campo obrigatório',
  args: { label: 'Código', required: true, placeholder: 'Obrigatório' },
}

export const WithError: Story = {
  name: 'Estado de erro',
  args: {
    label: 'Código da Linha',
    modelValue: 'XY',
    error: 'Código deve ter pelo menos 5 caracteres',
  },
}

export const Disabled: Story = {
  name: 'Desabilitado',
  args: {
    label: 'Código',
    modelValue: '0A0A00AA000',
    disabled: true,
  },
}

export const PasswordType: Story = {
  name: 'Tipo senha',
  args: {
    label: 'Senha',
    type: 'password',
    placeholder: 'Digite sua senha',
  },
}

export const NoLabel: Story = {
  name: 'Sem label (uso em toolbar)',
  args: { label: '', placeholder: 'Buscar linha...' },
}
