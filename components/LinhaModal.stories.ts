import type { Meta, StoryObj } from '@storybook/vue3'
import LinhaModal from './LinhaModal.vue'

const meta: Meta<typeof LinhaModal> = {
  title: 'Feature / LinhaModal',
  component: LinhaModal,

  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controla a visibilidade do modal',
    },
    onClose: { action: 'close' },
    onAdd:   { action: 'add'   },
  },
  args: {
    open: true,
  },
  decorators: [
    () => ({
      template: `
        <div style="position: relative; width: 100%; min-height: 600px; background: var(--color-neutral-100)">
          <story />
        </div>
      `,
    }),
  ],
  render: (args) => ({
    components: { LinhaModal },
    setup: () => ({ args }),
    template: `
      <LinhaModal
        :open="args.open"
        @close="args.onClose()"
        @add="(line) => args.onAdd(line)"
      />
    `,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  name: 'Aberto (interativo)',
  args: { open: true },
}

export const Closed: Story = {
  name: 'Fechado',
  args: { open: false },
  render: (args) => ({
    components: { LinhaModal },
    setup: () => ({ args }),
    template: `
      <div style="padding: 20px; color: var(--color-neutral-500)">
        <p>Modal está fechado (open: false). Alterne o controle "open" para abrir.</p>
        <LinhaModal :open="args.open" @close="args.onClose()" @add="args.onAdd($event)" />
      </div>
    `,
  }),
}
