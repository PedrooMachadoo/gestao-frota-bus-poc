<script setup lang="ts">
import { mockSinotico, type SinoticoLinha } from '~/data/sinotico.mock'

definePageMeta({ layout: 'default', title: 'Monitoramento' })

// ── Tabs ──────────────────────────────────────────────
const tabs = [
  { label: 'Ao vivo',  to: '/ao-vivo'  },
  { label: 'Replay',   to: '/replay'   },
  { label: 'Sinótico', to: '/sinotico' },
]

// ── Lista de linhas no corpo ──────────────────────────
const cards = ref<SinoticoLinha[]>([...mockSinotico])

function removeCard(id: string) {
  cards.value = cards.value.filter(c => c.id !== id)
}
</script>

<template>
  <div class="sinotico">
    <PageHeader title="Monitoramento" :tabs="tabs" />

    <!-- ── Corpo: painel lateral à esquerda + área principal ── -->
    <div class="sinotico__body">
      <SinoticoLinePanel class="sinotico__panel" />

      <div class="sinotico__main">
        <SinoticoCard
          v-for="linha in cards"
          :key="linha.id"
          :linha="linha"
          @remove="removeCard"
        />
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
</style>
