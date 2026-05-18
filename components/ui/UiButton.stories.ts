import type { Meta, StoryObj } from '@storybook/vue3'
import { Plus, ChevronRight } from 'lucide-vue-next'
import UiButton from './UiButton.vue'

const meta: Meta<typeof UiButton> = {
  title: 'UI / UiButton',
  component: UiButton,

  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
    },
  },
  args: {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    type: 'button',
  },
  render: (args) => ({
    components: { UiButton },
    setup: () => ({ args }),
    template: `<UiButton v-bind="args">Adicionar Linha</UiButton>`,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const AllVariants: Story = {
  name: 'Todas as variantes',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { UiButton },
    template: `
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap">
        <UiButton variant="primary">Primary</UiButton>
        <UiButton variant="secondary">Secondary</UiButton>
        <UiButton variant="ghost">Ghost</UiButton>
        <UiButton variant="danger">Danger</UiButton>
      </div>
    `,
  }),
}

export const AllSizes: Story = {
  name: 'Todos os tamanhos',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { UiButton },
    template: `
      <div style="display: flex; gap: 12px; align-items: center">
        <UiButton size="sm">Small</UiButton>
        <UiButton size="md">Medium</UiButton>
        <UiButton size="lg">Large</UiButton>
      </div>
    `,
  }),
}

export const Disabled: Story = {
  name: 'Estado desabilitado',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { UiButton },
    template: `
      <div style="display: flex; gap: 12px; align-items: center">
        <UiButton variant="primary"   disabled>Primary</UiButton>
        <UiButton variant="secondary" disabled>Secondary</UiButton>
        <UiButton variant="ghost"     disabled>Ghost</UiButton>
        <UiButton variant="danger"    disabled>Danger</UiButton>
      </div>
    `,
  }),
}

export const Loading: Story = {
  name: 'Estado loading',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { UiButton },
    template: `
      <div style="display: flex; gap: 12px; align-items: center">
        <UiButton variant="primary"   loading>Salvando...</UiButton>
        <UiButton variant="secondary" loading>Carregando</UiButton>
        <UiButton variant="danger"    loading>Removendo</UiButton>
      </div>
    `,
  }),
}

export const WithIconLeft: Story = {
  name: 'Com ícone à esquerda',
  render: () => ({
    components: { UiButton, Plus },
    template: `
      <UiButton variant="primary">
        <template #icon-left><Plus :size="16" /></template>
        Adicionar Linha
      </UiButton>
    `,
  }),
}

export const WithIconRight: Story = {
  name: 'Com ícone à direita',
  render: () => ({
    components: { UiButton, ChevronRight },
    template: `
      <UiButton variant="secondary">
        Próximo
        <template #icon-right><ChevronRight :size="16" /></template>
      </UiButton>
    `,
  }),
}
