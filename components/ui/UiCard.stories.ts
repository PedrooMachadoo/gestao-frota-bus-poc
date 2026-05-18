import type { Meta, StoryObj } from '@storybook/vue3'
import UiCard from './UiCard.vue'

const meta: Meta<typeof UiCard> = {
  title: 'UI / UiCard',
  component: UiCard,

  argTypes: {
    padding: {
      control: 'inline-radio',
      options: ['none', 'sm', 'md', 'lg'],
    },
  },
  args: { padding: 'md' },
  render: (args) => ({
    components: { UiCard },
    setup: () => ({ args }),
    template: `
      <UiCard v-bind="args">
        <p style="color: var(--color-neutral-700); margin: 0">
          Conteúdo do card — qualquer elemento filho pode ser inserido via slot default.
        </p>
      </UiCard>
    `,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const PaddingNone: Story = {
  name: 'Sem padding (full-bleed)',
  args: { padding: 'none' },
  render: (args) => ({
    components: { UiCard },
    setup: () => ({ args }),
    template: `
      <UiCard v-bind="args">
        <div style="background: var(--color-neutral-100); padding: 20px; border-radius: 8px">
          Útil para tabelas full-bleed dentro do card
        </div>
      </UiCard>
    `,
  }),
}

export const AllPaddingSizes: Story = {
  name: 'Todos os tamanhos de padding',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { UiCard },
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px">
        <UiCard padding="sm"><p style="margin:0">padding sm (12px)</p></UiCard>
        <UiCard padding="md"><p style="margin:0">padding md (20px)</p></UiCard>
        <UiCard padding="lg"><p style="margin:0">padding lg (24px)</p></UiCard>
      </div>
    `,
  }),
}

export const WithStats: Story = {
  name: 'Uso real — container de estatística',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { UiCard },
    template: `
      <UiCard padding="md" style="max-width: 220px">
        <div style="display:flex;flex-direction:column;gap:4px">
          <span style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--color-neutral-500);letter-spacing:.06em">Total de Linhas</span>
          <span style="font-size:20px;font-weight:600;color:var(--color-neutral-900)">16</span>
          <span style="font-size:12px;color:var(--color-success-soft-text)">+2 este mês</span>
        </div>
      </UiCard>
    `,
  }),
}
