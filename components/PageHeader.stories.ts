import type { Meta, StoryObj } from '@storybook/vue3'
import { Plus, Filter } from 'lucide-vue-next'
import PageHeader from './PageHeader.vue'

const TAB_EXAMPLES = [
  { label: 'Linhas',     to: '/linhas'     },
  { label: 'Veículos',   to: '/veiculos'   },
  { label: 'Motoristas', to: '/motoristas' },
]

const meta: Meta<typeof PageHeader> = {
  title: 'Feature / PageHeader',
  component: PageHeader,

  argTypes: {
    title: { control: 'text', description: 'Título da página (h1)' },
    tabs: {
      control: 'object',
      description: 'Array de abas { label, to }',
    },
  },
  args: {
    title: 'Gestão de Linhas',
    tabs: [],
  },
  decorators: [
    () => ({
      template: `
        <div style="background: var(--color-neutral-100); padding-bottom: 40px">
          <story />
        </div>
      `,
    }),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const TitleOnly: Story = {
  name: 'Só título',
  args: { title: 'Gestão de Linhas', tabs: [] },
}

export const WithTabs: Story = {
  name: 'Com abas de navegação',
  args: {
    title: 'Gestão de Frota',
    tabs: TAB_EXAMPLES,
  },
}

export const WithToolbar: Story = {
  name: 'Com slot toolbar',
  args: { title: 'Gestão de Linhas', tabs: [] },
  render: (args) => ({
    components: { PageHeader, Plus, Filter },
    setup: () => ({ args }),
    template: `
      <PageHeader v-bind="args">
        <template #toolbar>
          <input
            style="height:36px;padding:0 12px;border:1px solid var(--color-neutral-300);border-radius:4px;font-size:14px;min-width:200px"
            placeholder="Buscar linha..."
          />
          <select style="height:36px;padding:0 8px;border:1px solid var(--color-neutral-300);border-radius:4px;font-size:14px">
            <option>Todos os tipos</option>
            <option>Urbano</option>
            <option>Metropolitano</option>
          </select>
          <button
            style="height:36px;padding:0 16px;background:#2D6BFF;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:6px"
          >
            <Plus :size="16" />
            Nova Linha
          </button>
        </template>
      </PageHeader>
    `,
  }),
}

export const FullExample: Story = {
  name: 'Completo — abas + toolbar',
  args: { title: 'Gestão de Frota', tabs: TAB_EXAMPLES },
  render: (args) => ({
    components: { PageHeader, Plus },
    setup: () => ({ args }),
    template: `
      <PageHeader v-bind="args">
        <template #toolbar>
          <button
            style="height:36px;padding:0 16px;background:#2D6BFF;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:6px"
          >
            <Plus :size="16" />
            Adicionar
          </button>
        </template>
      </PageHeader>
    `,
  }),
}

export const Playground: Story = {
  render: (args) => ({
    components: { PageHeader },
    setup: () => ({ args }),
    template: `<PageHeader v-bind="args" />`,
  }),
}
