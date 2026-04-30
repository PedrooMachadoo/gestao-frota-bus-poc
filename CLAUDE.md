# CLAUDE.md — Fleet POC

## O que é este projeto

POC de sistema de gestão de frota construído com Nuxt 3 + Vue 3 + TypeScript.
O design vem do Figma (Design System Mobs2) e cada tela é implementada via MCP do Figma.

## Workflow de trabalho

Para cada nova tela ou componente, o processo é:
1. Usuário fornece o link/node do Figma com a tela específica
2. Claude Code puxa os dados do componente via MCP do Figma
3. Claude Code implementa o componente com fidelidade ao design

**Nunca invente estilos.** Sempre use os tokens do design system (`tokens.css`) ou extraia via MCP.

## Stack

- **Framework:** Nuxt 3 (`ssr: false`)
- **UI:** Vue 3 Composition API + `<script setup>`
- **Linguagem:** TypeScript strict
- **Estado:** Pinia
- **Estilo:** CSS custom properties (tokens) + `<style scoped>` por componente
- **Mapa:** Leaflet.js
- **Gráficos:** Chart.js + vue-chartjs
- **Ícones:** lucide-vue-next

## Design System — Mobs2

Figma: https://www.figma.com/design/r900Rn5Aw7twPAUZVspwSz

### Tokens disponíveis (assets/css/tokens.css)

Todos os valores do DS estão em CSS custom properties. Sempre use os tokens, nunca valores hardcoded.

**Cores principais:**
- `--color-action-primary: #5D37F5` — cor de ação/CTA
- `--color-action-primary-hover: #7152E0`
- `--color-action-primary-active: #1A043B`
- `--color-brand-accent-50: #C6EF54`

**Neutros:** `--color-neutral-{0|50|100|150|200|300|400|500|600|700|800|900|950}`

**Feedback:**
- Success: `--color-success-soft-{bg|border|text}` / `--color-success-solid-{bg|text}`
- Warning: `--color-warning-soft-{bg|border|text}` / `--color-warning-solid-{bg|text}`
- Danger: `--color-danger-soft-{bg|border|text}` / `--color-danger-solid-{bg|text}`

**Layout:**
- `--sidebar-width: 240px`
- `--header-height: 60px`

### Tipografia (Inter)

Classes utilitárias disponíveis em `global.css`:
- `.text-h1` a `.text-h4`
- `.text-body-lg`, `.text-body-lg-strong`, `.text-body-md`, `.text-body-sm`
- `.text-label-md`, `.text-label-sm`, `.text-caption`, `.text-overline`

### Componentes UI base

Todos em `components/ui/` — são auto-importados pelo Nuxt:

| Componente | Props principais |
|---|---|
| `UiButton` | `variant` (primary\|secondary\|ghost\|danger), `size` (sm\|md\|lg), `loading`, `disabled` |
| `UiBadge` | `variant` (success\|warning\|danger\|default), `solid` |
| `UiCard` | `padding` (none\|sm\|md\|lg) |
| `UiInput` | `v-model`, `label`, `placeholder`, `error`, `disabled`, `required` |
| `UiStat` | `label`, `value`, `delta`, `deltaType` (positive\|negative\|neutral) |
| `UiTable` | slots: conteúdo da tabela diretamente |
| `UiSpinner` | `size` (sm\|md\|lg) |

## Estrutura de pastas

```
assets/css/       → tokens.css + global.css
components/ui/    → componentes base (auto-importados)
components/       → componentes específicos de cada módulo
pages/            → rotas (auto-geradas pelo Nuxt)
stores/           → Pinia stores
composables/      → lógica reutilizável
types/            → interfaces TypeScript
data/             → mock data
layouts/          → layout padrão (sidebar + header)
```

## Convenções

- Sempre `<script setup lang="ts">` com interfaces tipadas
- Nomes de componentes em PascalCase
- Props com `withDefaults(defineProps<Props>(), {...})`
- Emits tipados com `defineEmits<{...}>()`
- Estilos sempre em `<style scoped>` usando tokens CSS
- Nunca usar valores de cor hardcoded no CSS
- Dados mockados em `data/*.mock.ts`
- Nenhuma UI lib externa (só o que está no stack acima)

## Módulos planejados

1. **Veículos** — `/veiculos` — listagem + detalhe
2. **Motoristas** — `/motoristas` — listagem + detalhe
3. **Rastreamento** — `/rastreamento` — mapa Leaflet
4. **Relatórios** — `/relatorios` — gráficos + export CSV
5. **Linhas** — `/linhas` — listagem + adicionar linha

## Planejamento - Linhas

### Tela de listagem (`/linhas`)
Figma: https://www.figma.com/design/hoKaXxVU7mFI4a97HGnn5m/SGF-Bus?node-id=2336-241467&m=dev

### Tela de adicionar linha (`/linhas/adicionar`)
Figma: https://www.figma.com/design/hoKaXxVU7mFI4a97HGnn5m/SGF-Bus?node-id=1-8085&m=dev
