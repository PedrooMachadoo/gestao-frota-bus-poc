<script setup lang="ts">
/**
 * InfoBox de veículo em destaque (tela Ao vivo).
 * Aparece no rodapé do mapa quando o usuário clica num item da lista para
 * destacar — mostra info detalhada do veículo selecionado.
 *
 * Figma: node 1:364319
 *
 * Campos exibidos:
 *  • Avatar do motorista (foto se identificado / ícone vermelho se não)
 *  • Código + Nome do funcionário
 *  • ID Viagem
 *  • Badge de status (Ligado / Desligado / Off)
 *  • Data e Hora · Hodômetro · Horímetro · Velocidade
 *  • Endereço atual
 *
 * Para o POC os campos sem dado real (ID Viagem, Hodômetro, Horímetro,
 * Velocidade, Endereço) usam placeholders idênticos ao Figma.
 */
import { User, UserX } from 'lucide-vue-next'
import type { FleetStatus, FleetVehicle } from '~/data/uos.mock'

defineProps<{
  vehicle: FleetVehicle | null
}>()

const STATUS_LABELS: Record<FleetStatus, string> = {
  active:    'Ligado',
  attention: 'Desligado',
  inactive:  'Off',
}
</script>

<template>
  <Transition name="lfib-fade">
    <div v-if="vehicle" class="lfib" role="dialog" aria-label="Informações do veículo">

      <!-- ── Header: avatar + nome/viagem + status ── -->
      <header class="lfib__head">
        <div
          class="lfib__avatar"
          :class="{ 'lfib__avatar--unknown': !vehicle.driverIdentified }"
        >
          <component :is="vehicle.driverIdentified ? User : UserX" :size="22" />
        </div>

        <div class="lfib__title-block">
          <h3 class="lfib__name">
            <template v-if="vehicle.driverIdentified">
              {{ vehicle.codigo }} - [Nome do Funcionário]
            </template>
            <template v-else>
              Motorista desconhecido
            </template>
          </h3>
          <p class="lfib__trip">ID Viagem: 0000000</p>
        </div>

        <span class="lfib__badge" :class="`lfib__badge--${vehicle.status}`">
          {{ STATUS_LABELS[vehicle.status] }}
        </span>
      </header>

      <!-- ── Grid: 4 colunas com indicadores ── -->
      <div class="lfib__grid">
        <div class="lfib__col">
          <div class="lfib__label">Data e Hora</div>
          <div class="lfib__value">00/00/00 - 00:00</div>
        </div>
        <div class="lfib__col">
          <div class="lfib__label">Hodômetro</div>
          <div class="lfib__value">000000</div>
        </div>
        <div class="lfib__col">
          <div class="lfib__label">Horímetro</div>
          <div class="lfib__value">000000</div>
        </div>
        <div class="lfib__col">
          <div class="lfib__label">Velocidade</div>
          <div class="lfib__value">00km/h</div>
        </div>
      </div>

      <!-- ── Endereço (linha cheia) ── -->
      <div class="lfib__address">
        <div class="lfib__label">Endereço</div>
        <div class="lfib__value">[Nome da endereço], [Cidade] - [Estado], [Cep], [País]</div>
      </div>

    </div>
  </Transition>
</template>

<style scoped>
.lfib {
  /* EXPLÍCITO: flex column garante stacking vertical das 3 seções
     (head / grid / address) independente do contexto pai. */
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #FFFFFF;
  border-radius: 14px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.14),
    0 2px 6px rgba(0, 0, 0, 0.06);
  padding: 16px 24px 18px;
  font-family: 'Inter', sans-serif;
  color: var(--color-neutral-900, #1F1F1F);
  /* Sem limites de largura — o card preenche o container do pai. */
  width: 100%;
  box-sizing: border-box;
}

/* ── Header ────────────────────────────────────── */
.lfib__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lfib__avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #EEF2FF;
  border: 2px solid #FFFFFF;
  box-shadow: 0 0 0 1px var(--color-neutral-200, #E5E7EB);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #4F46E5;
  flex-shrink: 0;
}
.lfib__avatar--unknown {
  background: #FFFFFF;
  color: #DC2626;
  box-shadow: 0 0 0 2px #DC2626;
  border-color: #FFFFFF;
}

.lfib__title-block {
  flex: 1;
  min-width: 0;
}
.lfib__name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-neutral-900, #1F1F1F);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lfib__trip {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--color-neutral-500, #6B7280);
}

/* ── Badge de status ───────────────────────────── */
.lfib__badge {
  padding: 8px 22px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
  align-self: flex-start;
}
.lfib__badge--active {
  background: #DCFCE7;
  color: #166534;
}
.lfib__badge--attention {
  background: #FEF3C7;
  color: #92400E;
}
.lfib__badge--inactive {
  background: #F3F4F6;
  color: #4B5563;
}

/* ── Grid de indicadores ───────────────────────── */
.lfib__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.lfib__col,
.lfib__address {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.lfib__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-neutral-500, #6B7280);
}

.lfib__value {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-neutral-900, #1F1F1F);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Endereço (linha extra) ────────────────────── */
.lfib__address {
  /* gap do .lfib pai já dá o espaçamento — sem padding redundante */
}

/* ── Transição de entrada/saída ────────────────── */
.lfib-fade-enter-active,
.lfib-fade-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.lfib-fade-enter-from,
.lfib-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
