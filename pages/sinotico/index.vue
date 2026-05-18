<script setup lang="ts">
import { mockLines } from '~/data/lines.mock'
import { buildSinoticoForLine, type SinoticoLinha } from '~/data/sinotico.mock'

definePageMeta({ layout: 'default', title: 'Monitoramento' })

// ── Tabs ──────────────────────────────────────────────
const tabs = [
  { label: 'Ao vivo',  to: '/ao-vivo'  },
  { label: 'Replay',   to: '/replay'   },
  { label: 'Sinótico', to: '/sinotico' },
]

// ── Classificação local (alinhada à do painel: idx%3) ──────────
// Mesma fórmula usada no SinoticoLinePanel para que tipo / cor / cenário
// fiquem coerentes entre painel e card.
type TipoLinha = 'normal' | 'media' | 'critica'
const tipoOf = (idx: number): TipoLinha =>
  (['normal', 'media', 'critica'] as TipoLinha[])[idx % 3]

// Formata "1007 - ORIGEM / DESTINO" (mesma fórmula do painel).
function fmtLineLabel(idx: number): string {
  const l = mockLines[idx]
  const code = String(1000 + Number(l.id) * 7).slice(0, 4)
  return `${code} - ${l.origin.toUpperCase()} / ${l.destination.toUpperCase()}`
}

// ── Seleção (v-model com o painel) ────────────────────
// Pré-seleção inicial = primeiras 2 linhas Normais (idx % 3 === 0),
// espelhando o estado padrão do painel.
const selectedLineIds = ref<string[]>(
  mockLines.filter((_, i) => i % 3 === 0).slice(0, 2).map(l => l.id),
)

// Cards visíveis = um por linha selecionada, gerados deterministicamente
// a partir do id (mesma linha → mesmo card, sempre).
const cards = computed<SinoticoLinha[]>(() => {
  return selectedLineIds.value
    .map(id => {
      const idx = mockLines.findIndex(l => l.id === id)
      if (idx === -1) return null
      return buildSinoticoForLine(id, fmtLineLabel(idx), tipoOf(idx))
    })
    .filter((c): c is SinoticoLinha => c !== null)
})

// Remoção pelo botão de lixeira do card → desseleciona a linha no painel.
function removeCard(sinId: string) {
  // sinId tem o formato "sin-<lineId>"
  const lineId = sinId.replace(/^sin-/, '')
  selectedLineIds.value = selectedLineIds.value.filter(id => id !== lineId)
}
</script>

<template>
  <div class="sinotico">
    <PageHeader title="Monitoramento" :tabs="tabs" />

    <!-- ── Corpo: painel lateral à esquerda + área principal ── -->
    <div class="sinotico__body">
      <SinoticoLinePanel v-model:selected="selectedLineIds" class="sinotico__panel" />

      <div class="sinotico__main">
        <SinoticoCard
          v-for="linha in cards"
          :key="linha.id"
          :linha="linha"
          @remove="removeCard"
        />

        <!-- Empty state — nenhuma linha selecionada no painel -->
        <div v-if="cards.length === 0" class="sinotico__empty">
          <p class="sinotico__empty-title">Selecione linhas no painel à esquerda</p>
          <p class="sinotico__empty-sub">
            Cada linha selecionada gera um card sinótico com a sua frota distribuída no itinerário.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sinotico {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--color-neutral-50);
}

.sinotico__body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
  padding: 16px;
}

.sinotico__panel {
  flex-shrink: 0;
}

.sinotico__main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  scrollbar-width: thin;
  padding-right: 4px;
}
.sinotico__main::-webkit-scrollbar       { width: 8px; }
.sinotico__main::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 4px; }

/* Garante que cada card preserve a altura natural e não seja comprimido
   pelo container flex — quando não couberem todos, .sinotico__main rola. */
.sinotico__main > * {
  flex-shrink: 0;
}

/* ── Empty state ─────────────────────────────────────── */
.sinotico__empty {
  margin: auto;
  max-width: 360px;
  text-align: center;
  padding: 32px 24px;
  color: var(--color-neutral-500);
}
.sinotico__empty-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-neutral-700);
}
.sinotico__empty-sub {
  margin: 0;
  font-size: 13px;
  line-height: 18px;
}
</style>
