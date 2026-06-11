/**
 * Design System / Tokens — galeria visual de todos os tokens do Mobs2 DS.
 *
 * Estrutura no Storybook:
 *   Design System
 *   └── Tokens
 *       ├── Docs              ← autodocs: aglutina todas as stories abaixo
 *       ├── Colors            ← Action, Brand, Neutrals, Feedback, Tabela, Sidebar
 *       ├── Typography        ← Inter — h1→h4, body, label, caption, overline
 *       ├── Spacing           ← --spacing-1 → --spacing-16
 *       ├── Radius            ← --radius-xs → --radius-full
 *       ├── Shadows           ← --shadow-xs → --shadow-xl
 *       ├── Transitions       ← --transition-fast/base/slow
 *       └── Layout            ← --sidebar-width / --header-height
 *
 * Cada swatch mostra o NOME do token (com o prefixo CSS `--`) e o VALOR atual
 * resolvido. Os valores vêm de `assets/css/tokens.css` (carregado no preview).
 *
 * Esse arquivo é self-contained — os dados estão duplicados aqui pra que ele
 * possa ser copiado pra outro projeto sem dependências internas.
 */
import type { Meta, StoryObj } from '@storybook/vue3'

const meta: Meta = {
  title: 'Design System/Tokens',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Tokens do design system **Mobs2** disponíveis como CSS custom properties (`var(--color-*)`, `var(--spacing-*)`, etc.). ' +
          'Sempre prefira o token ao valor hardcoded. ' +
          'Para usar em outro projeto, copie `assets/css/tokens.css` + `assets/css/global.css` e este arquivo de stories.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// ═════════════════════════════════════════════════════════════════
//  DATA — todos os tokens declarados em assets/css/tokens.css
// ═════════════════════════════════════════════════════════════════

const COLOR_ACTION = [
  { token: '--color-action-primary',         value: '#5D37F5' },
  { token: '--color-action-primary-hover',   value: '#7152E0' },
  { token: '--color-action-primary-active',  value: '#1A043B' },
  { token: '--color-action-primary-subtle',  value: '#EDE9FE' },
  { token: '--color-action-blue',            value: '#2D6BFF' },
  { token: '--color-action-blue-hover',      value: '#1A5AED' },
]

const COLOR_BRAND = [
  { token: '--color-brand-accent-50',   value: '#C6EF54' },
  { token: '--color-brand-accent-100',  value: '#B4DF3C' },
  { token: '--color-brand-accent-200',  value: '#9CC828' },
]

const COLOR_NEUTRALS = [
  { token: '--color-neutral-0',   value: '#FFFFFF' },
  { token: '--color-neutral-50',  value: '#F9FAFB' },
  { token: '--color-neutral-100', value: '#F3F4F6' },
  { token: '--color-neutral-150', value: '#EAECF0' },
  { token: '--color-neutral-200', value: '#E5E7EB' },
  { token: '--color-neutral-300', value: '#D1D5DB' },
  { token: '--color-neutral-400', value: '#9CA3AF' },
  { token: '--color-neutral-500', value: '#6B7280' },
  { token: '--color-neutral-600', value: '#4B5563' },
  { token: '--color-neutral-700', value: '#374151' },
  { token: '--color-neutral-800', value: '#1F2937' },
  { token: '--color-neutral-900', value: '#111827' },
  { token: '--color-neutral-950', value: '#030712' },
]

const COLOR_SUCCESS = [
  { token: '--color-success-soft-bg',     value: '#ECFDF5' },
  { token: '--color-success-soft-border', value: '#A7F3D0' },
  { token: '--color-success-soft-text',   value: '#065F46' },
  { token: '--color-success-solid-bg',    value: '#10B981' },
  { token: '--color-success-solid-text',  value: '#FFFFFF' },
]

const COLOR_WARNING = [
  { token: '--color-warning-soft-bg',     value: '#FFFBEB' },
  { token: '--color-warning-soft-border', value: '#FDE68A' },
  { token: '--color-warning-soft-text',   value: '#92400E' },
  { token: '--color-warning-solid-bg',    value: '#F59E0B' },
  { token: '--color-warning-solid-text',  value: '#FFFFFF' },
]

const COLOR_DANGER = [
  { token: '--color-danger-soft-bg',     value: '#FEF2F2' },
  { token: '--color-danger-soft-border', value: '#FECACA' },
  { token: '--color-danger-soft-text',   value: '#991B1B' },
  { token: '--color-danger-solid-bg',    value: '#EF4444' },
  { token: '--color-danger-solid-text',  value: '#FFFFFF' },
]

const COLOR_INFO = [
  { token: '--color-info-soft-bg',     value: '#EFF6FF' },
  { token: '--color-info-soft-border', value: '#BFDBFE' },
  { token: '--color-info-soft-text',   value: '#1E40AF' },
  { token: '--color-info-solid-bg',    value: '#3B82F6' },
  { token: '--color-info-solid-text',  value: '#FFFFFF' },
]

const COLOR_TABLE = [
  { token: '--color-table-row-hover-bg',      value: '#2457D1' },
  { token: '--color-table-row-hover-text',    value: '#FFFFFF' },
  { token: '--color-table-row-selected-bg',   value: '#1B45A3' },
  { token: '--color-table-row-selected-text', value: '#FFFFFF' },
  { token: '--color-table-row-disabled-bg',   value: '#F2F2F2' },
  { token: '--color-table-row-disabled-text', value: '#7A7A7A' },
]

const COLOR_SIDEBAR = [
  { token: '--sidebar-active-bg',     value: '#3DD6CF' },
  { token: '--sidebar-active-text',   value: '#091660' },
  { token: '--sidebar-logo-accent',   value: '#3DD6CF' },
  { token: '--sidebar-toggle-bg',     value: '#2D6BFF', alias: 'var(--color-action-blue)' },
]

const TYPOGRAPHY = [
  { cls: 'text-h1',              spec: '32px / 700 / -0.02em' },
  { cls: 'text-h2',              spec: '24px / 700 / -0.01em' },
  { cls: 'text-h3',              spec: '20px / 600' },
  { cls: 'text-h4',              spec: '16px / 600' },
  { cls: 'text-body-lg',         spec: '16px / 400' },
  { cls: 'text-body-lg-strong',  spec: '16px / 600' },
  { cls: 'text-body-md',         spec: '14px / 400' },
  { cls: 'text-body-md-strong',  spec: '14px / 600' },
  { cls: 'text-body-sm',         spec: '13px / 400' },
  { cls: 'text-label-md',        spec: '14px / 500' },
  { cls: 'text-label-sm',        spec: '12px / 500' },
  { cls: 'text-caption',         spec: '12px / 400' },
  { cls: 'text-overline',        spec: '11px / 600 / +0.08em / UPPER' },
]

const SPACING = [
  { token: '--spacing-1',  value: '4px'  },
  { token: '--spacing-2',  value: '8px'  },
  { token: '--spacing-3',  value: '12px' },
  { token: '--spacing-4',  value: '16px' },
  { token: '--spacing-5',  value: '20px' },
  { token: '--spacing-6',  value: '24px' },
  { token: '--spacing-8',  value: '32px' },
  { token: '--spacing-10', value: '40px' },
  { token: '--spacing-12', value: '48px' },
  { token: '--spacing-16', value: '64px' },
]

const RADIUS = [
  { token: '--radius-xs',   value: '2px'    },
  { token: '--radius-sm',   value: '4px'    },
  { token: '--radius-md',   value: '8px'    },
  { token: '--radius-lg',   value: '12px'   },
  { token: '--radius-xl',   value: '16px'   },
  { token: '--radius-2xl',  value: '24px'   },
  { token: '--radius-full', value: '9999px' },
]

const SHADOWS = [
  { token: '--shadow-xs', value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
  { token: '--shadow-sm', value: '0 1px 3px / 0 1px 2px -1px'    },
  { token: '--shadow-md', value: '0 4px 6px -1px / 0 2px 4px -2px' },
  { token: '--shadow-lg', value: '0 10px 15px -3px / 0 4px 6px -4px' },
  { token: '--shadow-xl', value: '0 20px 25px -5px / 0 8px 10px -6px' },
]

const TRANSITIONS = [
  { token: '--transition-fast', value: '150ms ease' },
  { token: '--transition-base', value: '200ms ease' },
  { token: '--transition-slow', value: '300ms ease' },
]

const LAYOUT = [
  { token: '--sidebar-width',     value: '300px',  note: 'Modo expandido' },
  { token: '--sidebar-width-min', value: '64px',   note: 'Modo mini'      },
  { token: '--header-height',     value: '60px',   note: 'Topbar global'  },
]

// ═════════════════════════════════════════════════════════════════
//  Estilos base usados por TODAS as stories
// ═════════════════════════════════════════════════════════════════

const SHEET_CSS = /* css */ `
.tk-wrap   { font-family: 'Inter', system-ui, sans-serif; color: #1F2937; }
.tk-grid   { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
.tk-group  { margin-bottom: 32px; }
.tk-group__title {
  font-size: 11px; font-weight: 700; letter-spacing: 0.10em; text-transform: uppercase;
  color: #6B7280; margin: 0 0 12px; padding-bottom: 4px; border-bottom: 1px solid #E5E7EB;
}
.tk-swatch {
  display: flex; flex-direction: column; gap: 0;
  border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; background: #fff;
  font-family: inherit;
}
.tk-swatch__chip { height: 56px; }
.tk-swatch__meta { padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; }
.tk-swatch__token {
  font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
  font-size: 11px; color: #111827; word-break: break-all;
}
.tk-swatch__value {
  font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
  font-size: 11px; color: #6B7280;
}
.tk-swatch__alias {
  font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
  font-size: 10px; color: #9CA3AF;
}
.tk-row {
  display: flex; align-items: center; gap: 16px;
  padding: 10px 12px; border: 1px solid #E5E7EB; border-radius: 8px;
  background: #fff; margin-bottom: 8px;
}
.tk-row__demo { flex-shrink: 0; }
.tk-row__text { flex: 1; }
.tk-row__token {
  font-family: 'ui-monospace', monospace; font-size: 12px; color: #111827;
}
.tk-row__value {
  font-family: 'ui-monospace', monospace; font-size: 11px; color: #6B7280; margin-top: 2px;
}
`

// Helper para injetar o stylesheet em cada story (sem repetir o <style>).
function withSheet(template: string): string {
  return `<div class="tk-wrap"><style>${SHEET_CSS}</style>${template}</div>`
}

// ═════════════════════════════════════════════════════════════════
//  STORIES
// ═════════════════════════════════════════════════════════════════

export const Colors: Story = {
  name: 'Colors',
  render: () => ({
    setup: () => ({
      groups: [
        { title: 'Action',         items: COLOR_ACTION   },
        { title: 'Brand accent',   items: COLOR_BRAND    },
        { title: 'Neutrals',       items: COLOR_NEUTRALS },
        { title: 'Success',        items: COLOR_SUCCESS  },
        { title: 'Warning',        items: COLOR_WARNING  },
        { title: 'Danger',         items: COLOR_DANGER   },
        { title: 'Info',           items: COLOR_INFO     },
        { title: 'Table row',      items: COLOR_TABLE    },
        { title: 'Sidebar',        items: COLOR_SIDEBAR  },
      ],
    }),
    template: withSheet(`
      <div v-for="g in groups" :key="g.title" class="tk-group">
        <h3 class="tk-group__title">{{ g.title }}</h3>
        <div class="tk-grid">
          <div v-for="c in g.items" :key="c.token" class="tk-swatch">
            <div class="tk-swatch__chip" :style="{ background: 'var(' + c.token + ')' }"></div>
            <div class="tk-swatch__meta">
              <span class="tk-swatch__token">{{ c.token }}</span>
              <span class="tk-swatch__value">{{ c.value }}</span>
              <span v-if="c.alias" class="tk-swatch__alias">→ {{ c.alias }}</span>
            </div>
          </div>
        </div>
      </div>
    `),
  }),
}

export const Typography: Story = {
  name: 'Typography',
  render: () => ({
    setup: () => ({ items: TYPOGRAPHY }),
    template: withSheet(`
      <div class="tk-group">
        <h3 class="tk-group__title">Inter — escala tipográfica</h3>
        <div v-for="t in items" :key="t.cls" class="tk-row">
          <div class="tk-row__demo" style="min-width: 240px;">
            <span :class="t.cls">{{ t.cls }}</span>
          </div>
          <div class="tk-row__text">
            <div class="tk-row__token">.{{ t.cls }}</div>
            <div class="tk-row__value">{{ t.spec }}</div>
          </div>
        </div>
      </div>
    `),
  }),
}

export const Spacing: Story = {
  name: 'Spacing',
  render: () => ({
    setup: () => ({ items: SPACING }),
    template: withSheet(`
      <div class="tk-group">
        <h3 class="tk-group__title">Escala de espaçamento</h3>
        <div v-for="s in items" :key="s.token" class="tk-row">
          <div class="tk-row__demo" style="width: 200px;">
            <div :style="{
              height: 'var(' + s.token + ')',
              width: 'var(' + s.token + ')',
              background: 'var(--color-action-primary)',
              borderRadius: '2px',
            }"></div>
          </div>
          <div class="tk-row__text">
            <div class="tk-row__token">{{ s.token }}</div>
            <div class="tk-row__value">{{ s.value }}</div>
          </div>
        </div>
      </div>
    `),
  }),
}

export const Radius: Story = {
  name: 'Radius',
  render: () => ({
    setup: () => ({ items: RADIUS }),
    template: withSheet(`
      <div class="tk-group">
        <h3 class="tk-group__title">Border radius</h3>
        <div class="tk-grid">
          <div v-for="r in items" :key="r.token" class="tk-swatch">
            <div
              class="tk-swatch__chip"
              :style="{
                background: 'var(--color-action-primary-subtle)',
                borderRadius: 'var(' + r.token + ')',
                margin: '12px',
                height: '72px',
                border: '2px solid var(--color-action-primary)',
              }"
            ></div>
            <div class="tk-swatch__meta">
              <span class="tk-swatch__token">{{ r.token }}</span>
              <span class="tk-swatch__value">{{ r.value }}</span>
            </div>
          </div>
        </div>
      </div>
    `),
  }),
}

export const Shadows: Story = {
  name: 'Shadows',
  render: () => ({
    setup: () => ({ items: SHADOWS }),
    template: withSheet(`
      <div class="tk-group">
        <h3 class="tk-group__title">Elevations</h3>
        <div class="tk-grid" style="gap: 24px; padding-top: 8px;">
          <div v-for="sh in items" :key="sh.token" class="tk-swatch" :style="{
            boxShadow: 'var(' + sh.token + ')',
            border: '1px solid #F3F4F6',
          }">
            <div class="tk-swatch__chip" style="background: #fff;"></div>
            <div class="tk-swatch__meta">
              <span class="tk-swatch__token">{{ sh.token }}</span>
              <span class="tk-swatch__value">{{ sh.value }}</span>
            </div>
          </div>
        </div>
      </div>
    `),
  }),
}

export const Transitions: Story = {
  name: 'Transitions',
  parameters: {
    docs: {
      description: {
        story: 'Passe o mouse sobre cada caixa pra ver a duração da transição. O hover muda a escala e a cor.',
      },
    },
  },
  render: () => ({
    setup: () => ({ items: TRANSITIONS }),
    template: withSheet(`
      <div class="tk-group">
        <h3 class="tk-group__title">Transitions (hover nos blocos)</h3>
        <style>
          .tk-tr {
            width: 120px; height: 80px; border-radius: 8px;
            background: var(--color-action-primary-subtle);
            color: var(--color-action-primary-active);
            display: flex; align-items: center; justify-content: center;
            font-family: ui-monospace, monospace; font-size: 12px;
            cursor: pointer; user-select: none;
            transition: background var(--transition-fast),
                        transform var(--transition-fast);
          }
          .tk-tr--fast { transition-duration: 150ms; }
          .tk-tr--base { transition-duration: 200ms; }
          .tk-tr--slow { transition-duration: 300ms; }
          .tk-tr:hover {
            background: var(--color-action-primary);
            color: #fff;
            transform: scale(1.06);
          }
        </style>
        <div class="tk-grid">
          <div v-for="t in items" :key="t.token" class="tk-swatch">
            <div style="padding: 16px; display: flex; justify-content: center;">
              <div
                class="tk-tr"
                :class="'tk-tr--' + t.token.replace('--transition-', '')"
              >{{ t.value }}</div>
            </div>
            <div class="tk-swatch__meta">
              <span class="tk-swatch__token">{{ t.token }}</span>
              <span class="tk-swatch__value">{{ t.value }}</span>
            </div>
          </div>
        </div>
      </div>
    `),
  }),
}

export const Layout: Story = {
  name: 'Layout',
  render: () => ({
    setup: () => ({ items: LAYOUT }),
    template: withSheet(`
      <div class="tk-group">
        <h3 class="tk-group__title">Dimensões de layout</h3>
        <div v-for="l in items" :key="l.token" class="tk-row">
          <div class="tk-row__demo">
            <div :style="{
              width: 'var(' + l.token + ')',
              height: '36px',
              background: 'linear-gradient(90deg, var(--color-action-primary-subtle), var(--color-action-primary))',
              borderRadius: '4px',
              maxWidth: '300px',
            }"></div>
          </div>
          <div class="tk-row__text">
            <div class="tk-row__token">{{ l.token }}</div>
            <div class="tk-row__value">{{ l.value }} — {{ l.note }}</div>
          </div>
        </div>
      </div>
    `),
  }),
}
