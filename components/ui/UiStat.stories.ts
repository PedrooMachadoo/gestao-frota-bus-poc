import type { Meta, StoryObj } from '@storybook/vue3'
import UiStat from './UiStat.vue'
import UiCard from './UiCard.vue'

const meta: Meta<typeof UiStat> = {
  title: 'UI / UiStat',
  component: UiStat,

  argTypes: {
    label: { control: 'text', description: 'Rótulo da métrica' },
    value: { control: 'text', description: 'Valor principal' },
    delta: { control: 'text', description: 'Indicador de variação (omitir para ocultar)' },
    deltaType: {
      control: 'inline-radio',
      options: ['positive', 'negative', 'neutral'],
    },
  },
  args: {
    label: 'Total de Linhas',
    value: '16',
    delta: '+2 este mês',
    deltaType: 'positive',
  },
  decorators: [
    () => ({
      template: `<div style="padding: 20px; max-width: 220px"><story /></div>`,
    }),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Positive: Story = {
  name: 'Delta positivo',
  args: { label: 'Veículos Ativos', value: '42', delta: '+5 hoje', deltaType: 'positive' },
}

export const Negative: Story = {
  name: 'Delta negativo',
  args: { label: 'Alertas Críticos', value: '3', delta: '-1 vs ontem', deltaType: 'negative' },
}

export const Neutral: Story = {
  name: 'Delta neutro',
  args: { label: 'Motoristas', value: '28', delta: 'sem variação', deltaType: 'neutral' },
}

export const NoDelta: Story = {
  name: 'Sem delta',
  args: { label: 'Quilometragem Total', value: '148.302 km', delta: undefined },
}

export const DashboardRow: Story = {
  name: 'Linha de dashboard (4 stats)',
  parameters: { controls: { disable: true } },
  decorators: [() => ({ template: `<div style="padding: 20px"><story /></div>` })],
  render: () => ({
    components: { UiStat, UiCard },
    template: `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px">
        <UiCard padding="md"><UiStat label="Linhas Ativas"    value="16" delta="+2"          deltaType="positive" /></UiCard>
        <UiCard padding="md"><UiStat label="Veículos"         value="42" delta="+5 hoje"     deltaType="positive" /></UiCard>
        <UiCard padding="md"><UiStat label="Alertas Críticos" value="3"  delta="-1 vs ontem" deltaType="negative" /></UiCard>
        <UiCard padding="md"><UiStat label="Motoristas"       value="28" delta="estável"     deltaType="neutral"  /></UiCard>
      </div>
    `,
  }),
}
