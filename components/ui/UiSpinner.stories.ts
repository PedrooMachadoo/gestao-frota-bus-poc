import type { Meta, StoryObj } from '@storybook/vue3'
import UiSpinner from './UiSpinner.vue'

const meta: Meta<typeof UiSpinner> = {
  title: 'UI / UiSpinner',
  component: UiSpinner,

  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
    },
  },
  args: { size: 'md' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const AllSizes: Story = {
  name: 'Todos os tamanhos',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { UiSpinner },
    template: `
      <div style="display: flex; gap: 24px; align-items: center">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <UiSpinner size="sm" style="color: var(--color-action-primary)" />
          <span style="font-size:11px;color:var(--color-neutral-500)">sm — 14px</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <UiSpinner size="md" style="color: var(--color-action-primary)" />
          <span style="font-size:11px;color:var(--color-neutral-500)">md — 20px</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <UiSpinner size="lg" style="color: var(--color-action-primary)" />
          <span style="font-size:11px;color:var(--color-neutral-500)">lg — 32px</span>
        </div>
      </div>
    `,
  }),
}

export const ColorVariants: Story = {
  name: 'Variações de cor (currentColor)',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { UiSpinner },
    template: `
      <div style="display: flex; gap: 20px; align-items: center">
        <UiSpinner size="md" style="color: var(--color-action-primary)" />
        <UiSpinner size="md" style="color: var(--color-success-solid-bg)" />
        <UiSpinner size="md" style="color: var(--color-warning-solid-bg)" />
        <UiSpinner size="md" style="color: var(--color-danger-solid-bg)" />
        <UiSpinner size="md" style="color: var(--color-neutral-400)" />
      </div>
    `,
  }),
}

export const InButton: Story = {
  name: 'Dentro de um botão',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { UiSpinner },
    template: `
      <button style="
        display:inline-flex;align-items:center;gap:8px;
        height:36px;padding:0 16px;
        background:#2D6BFF;color:#fff;border:none;border-radius:6px;
        font-size:14px;font-weight:500;cursor:wait;
      ">
        <UiSpinner size="sm" />
        Salvando...
      </button>
    `,
  }),
}
