import type { Meta, StoryObj } from '@storybook/vue3'
import UiTable from './UiTable.vue'
import UiBadge from './UiBadge.vue'

const meta: Meta<typeof UiTable> = {
  title: 'UI / UiTable',
  component: UiTable,

  argTypes: {
    scrollable: {
      control: 'boolean',
      description: 'Habilita scroll horizontal',
    },
  },
  args: { scrollable: true },
}

export default meta
type Story = StoryObj<typeof meta>

export const AllRowStates: Story = {
  name: 'Todos os estados de linha',
  render: (args) => ({
    components: { UiTable, UiBadge },
    setup: () => ({ args }),
    template: `
      <UiTable v-bind="args">
        <thead>
          <tr>
            <th>Código</th>
            <th>Linha</th>
            <th>Tipo</th>
            <th>Veículos</th>
            <th>Frequência</th>
            <th>Status</th>
            <th class="col-actions">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="cell--mono">0A0A00AA000</td>
            <td>Centro – Terminal Norte</td>
            <td>Urbano</td>
            <td>8</td>
            <td>15 min</td>
            <td><UiBadge variant="success">Ativo</UiBadge></td>
            <td class="col-actions">···</td>
          </tr>
          <tr class="row--selected">
            <td class="cell--mono">0A0A00AA001</td>
            <td>Bairro Sul – Aeroporto <em style="font-size:11px;opacity:.7">(selecionada)</em></td>
            <td>Metropolitano</td>
            <td>5</td>
            <td>30 min</td>
            <td><UiBadge variant="success">Ativo</UiBadge></td>
            <td class="col-actions">···</td>
          </tr>
          <tr>
            <td class="cell--mono">0A0A00AA002</td>
            <td>Terminal Leste – Shopping</td>
            <td>Urbano</td>
            <td>6</td>
            <td>20 min</td>
            <td><UiBadge variant="success">Ativo</UiBadge></td>
            <td class="col-actions">···</td>
          </tr>
          <tr class="row--disabled">
            <td class="cell--mono">0A0A00AA003</td>
            <td>Vila Nova – Hospital <em style="font-size:11px;opacity:.7">(disabled)</em></td>
            <td>Intermunicipal</td>
            <td>0</td>
            <td>—</td>
            <td><UiBadge variant="danger">Inativo</UiBadge></td>
            <td class="col-actions">···</td>
          </tr>
          <tr class="row--inactive">
            <td class="cell--mono">0A0A00AA004</td>
            <td>Praça Central – Periferia <em style="font-size:11px;opacity:.7">(inactive)</em></td>
            <td>Urbano</td>
            <td>0</td>
            <td>—</td>
            <td><UiBadge variant="warning">Manutenção</UiBadge></td>
            <td class="col-actions">···</td>
          </tr>
          <tr>
            <td class="cell--mono">0A0A00AA005</td>
            <td>Circular – Centro Histórico</td>
            <td>Urbano</td>
            <td>4</td>
            <td>25 min</td>
            <td><UiBadge variant="success">Ativo</UiBadge></td>
            <td class="col-actions">···</td>
          </tr>
        </tbody>
      </UiTable>
    `,
  }),
}

export const NonScrollable: Story = {
  name: 'Sem scroll horizontal',
  args: { scrollable: false },
  render: (args) => ({
    components: { UiTable },
    setup: () => ({ args }),
    template: `
      <UiTable v-bind="args">
        <thead><tr><th>Linha</th><th>Tipo</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Centro – Terminal Norte</td><td>Urbano</td><td>Ativo</td></tr>
          <tr><td>Bairro Sul – Aeroporto</td><td>Metropolitano</td><td>Ativo</td></tr>
        </tbody>
      </UiTable>
    `,
  }),
}

export const EmptyState: Story = {
  name: 'Estado vazio',
  render: (args) => ({
    components: { UiTable },
    setup: () => ({ args }),
    template: `
      <UiTable v-bind="args">
        <thead><tr><th>Código</th><th>Linha</th><th>Tipo</th><th>Status</th></tr></thead>
        <tbody>
          <tr>
            <td colspan="4" style="text-align:center;color:var(--color-neutral-400);padding:40px 0;height:auto">
              Nenhuma linha encontrada
            </td>
          </tr>
        </tbody>
      </UiTable>
    `,
  }),
}

export const HorizontalScroll: Story = {
  name: 'Scroll horizontal (mobile)',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { UiTable },
    template: `
      <div style="max-width: 480px; overflow: hidden">
        <UiTable :scrollable="true">
          <thead>
            <tr>
              <th>Código</th><th>Linha</th><th>Origem</th><th>Destino</th>
              <th>Tipo</th><th>Veículos</th><th>Freq.</th><th>Status</th>
              <th class="col-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="cell--mono">0A0A00AA000</td>
              <td>Centro – Terminal Norte</td>
              <td>Centro</td><td>Terminal Norte</td>
              <td>Urbano</td><td>8</td><td>15 min</td><td>Ativo</td>
              <td class="col-actions">···</td>
            </tr>
          </tbody>
        </UiTable>
      </div>
    `,
  }),
}
