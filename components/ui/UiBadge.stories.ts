import type { Meta, StoryObj } from '@storybook/vue3'
import UiBadge from './UiBadge.vue'

const meta: Meta<typeof UiBadge> = {
  title: 'UI / UiBadge',
  component: UiBadge,

  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger', 'info'],
    },
    solid: { control: 'boolean' },
    default: {
      control: 'text',
      description: 'Conteúdo do badge (slot default)',
      table: { category: 'Slots' },
    },
  },
  args: {
    variant: 'default',
    solid: false,
    default: 'Badge',
  },
  render: (args) => ({
    components: { UiBadge },
    setup: () => ({ args }),
    template: `<UiBadge v-bind="args">{{ args.default }}</UiBadge>`,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const AllVariantsSoft: Story = {
  name: 'Todas as variantes — Soft',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { UiBadge },
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center">
        <UiBadge variant="default">Default</UiBadge>
        <UiBadge variant="success">Ativo</UiBadge>
        <UiBadge variant="warning">Atenção</UiBadge>
        <UiBadge variant="danger">Inativo</UiBadge>
        <UiBadge variant="info">Info</UiBadge>
      </div>
    `,
  }),
}

export const AllVariantsSolid: Story = {
  name: 'Todas as variantes — Solid',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { UiBadge },
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center">
        <UiBadge variant="default" :solid="true">Default</UiBadge>
        <UiBadge variant="success" :solid="true">Ativo</UiBadge>
        <UiBadge variant="warning" :solid="true">Atenção</UiBadge>
        <UiBadge variant="danger"  :solid="true">Inativo</UiBadge>
        <UiBadge variant="info"    :solid="true">Info</UiBadge>
      </div>
    `,
  }),
}

export const StatusExamples: Story = {
  name: 'Uso real — Status de linha',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { UiBadge },
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap">
        <UiBadge variant="success">Ativo</UiBadge>
        <UiBadge variant="danger">Inativo</UiBadge>
        <UiBadge variant="warning">Manutenção</UiBadge>
        <UiBadge variant="info">Férias</UiBadge>
      </div>
    `,
  }),
}
