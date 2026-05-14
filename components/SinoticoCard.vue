<script setup lang="ts">
/**
 * Card de uma linha no Sinótico (Figma node 2056:111852).
 *
 * Estrutura vertical:
 *   1. Cabeçalho (faixa azul escuro) — nome da linha + métricas + lixeira
 *   2. Corpo horizontal: [off garage L] [TP] [timeline] [TS] [off garage R]
 *      Timeline mostra dois trilhos paralelos:
 *        - superior (volta): seta verde
 *        - inferior (ida):   seta azul
 *      Cada veículo é um SVG de ônibus tingido pelo status + chip "9999" acima.
 *   3. Rodapé: dois pills de alerta (Desvio de itinerário / Comboio)
 *
 * Regras de cor por status do veículo:
 *   ok        → verde   #84CB33
 *   adiantado → azul    #4D6AFE
 *   atrasado  → vermelho #FF3B3B
 *   off       → cinza   #9CA3AF
 */
import { ArrowDownUp, Trash2, CloudOff, Bus } from 'lucide-vue-next'
import veiculoSvgRaw from '~/components/ui/veiculo.svg?raw'
import type {
  SinoticoLinha,
  VehicleStatus,
  AlertLevel,
} from '~/data/sinotico.mock'

defineProps<{ linha: SinoticoLinha }>()
const emit = defineEmits<{ remove: [id: string] }>()

// Cores por status do veículo
const STATUS: Record<VehicleStatus, { body: string; shadow: string; chip: string }> = {
  ok:        { body: '#84CB33', shadow: '#5F981F', chip: '#84CB33' },
  adiantado: { body: '#4D6AFE', shadow: '#2C46C8', chip: '#4D6AFE' },
  atrasado:  { body: '#FF3B3B', shadow: '#B62525', chip: '#FF3B3B' },
  off:       { body: '#9CA3AF', shadow: '#6B7280', chip: '#9CA3AF' },
}

// SVG base — remove tamanhos e injeta classe para o CSS controlar
const svgBase = veiculoSvgRaw
  .replace(/\swidth="\d+"/i,  '')
  .replace(/\sheight="\d+"/i, '')
  .replace('<svg', '<svg class="sin-bus__svg" preserveAspectRatio="xMidYMid meet"')

function vehicleSvg(status: VehicleStatus): string {
  const c = STATUS[status]
  return svgBase.replaceAll('#84CB33', c.body).replaceAll('#5F981F', c.shadow)
}

// Cor do dot de alerta
const ALERT_COLOR: Record<AlertLevel, string> = {
  ok:      '#84CB33',
  warning: '#F5C518',
  danger:  '#FF0000',
}
function alertDotStyle(level: AlertLevel) {
  return { backgroundColor: ALERT_COLOR[level] }
}

// Helpers
function pad3(n: number): string { return n.toString().padStart(4, '0') }
function pct(n: number): string  { return `${n.toFixed(2).replace('.', ',')}%` }
</script>

<template>
  <article class="sin-card">
    <!-- ── Header ────────────────────────────────────────────── -->
    <header class="sin-card__head">
      <div class="sin-card__head-left">
        <ArrowDownUp :size="14" class="sin-card__route-icon" />
        <span class="sin-card__name">{{ linha.name }}</span>
      </div>

      <div class="sin-card__metrics">
        <div class="sin-metric">
          <span class="sin-metric__label">Prev.</span>
          <span class="sin-metric__value">{{ pad3(linha.metrics.prev) }}</span>
        </div>
        <div class="sin-metric">
          <span class="sin-metric__label">Saídas Real.</span>
          <span class="sin-metric__value">{{ pad3(linha.metrics.saidasReal) }} {{ pct(linha.metrics.saidasRealPct) }}</span>
        </div>
        <div class="sin-metric">
          <span class="sin-metric__label">Viagens Real.</span>
          <span class="sin-metric__value">{{ pad3(linha.metrics.viagensReal) }} {{ pct(linha.metrics.viagensRealPct) }}</span>
        </div>
        <div class="sin-metric">
          <span class="sin-metric__label">Saídas Pont.</span>
          <span class="sin-metric__value">{{ pad3(linha.metrics.saidasPont) }} {{ pct(linha.metrics.saidasPontPct) }}</span>
        </div>
        <div class="sin-metric">
          <span class="sin-metric__label">Saídas Adiant.</span>
          <span class="sin-metric__value">{{ pad3(linha.metrics.saidasAdiant) }} {{ pct(linha.metrics.saidasAdiantPct) }}</span>
        </div>
        <div class="sin-metric">
          <span class="sin-metric__label">Saídas Atrasadas</span>
          <span class="sin-metric__value">{{ pad3(linha.metrics.saidasAtrasadas) }} {{ pct(linha.metrics.saidasAtrasadasPct) }}</span>
        </div>
      </div>

      <button class="sin-card__delete" title="Remover" @click="emit('remove', linha.id)">
        <Trash2 :size="14" />
      </button>
    </header>

    <!-- ── Corpo ─────────────────────────────────────────────── -->
    <div class="sin-card__body">
      <!-- Off garage esquerda -->
      <div class="sin-term sin-term--off sin-term--dark">
        <div class="sin-term__head">
          <CloudOff :size="12" />
        </div>
        <div class="sin-term__chips">
          <span
            v-for="(c, i) in linha.offLeft"
            :key="`ol-${i}`"
            class="sin-chip"
            :style="{ backgroundColor: STATUS[c.status].chip }"
          >{{ c.code }}</span>
        </div>
      </div>

      <!-- TP -->
      <div class="sin-term sin-term--tp">
        <div class="sin-term__head">
          <Bus :size="12" />
          <span class="sin-term__label">TP</span>
        </div>
        <div class="sin-term__chips">
          <span
            v-for="(c, i) in linha.tp"
            :key="`tp-${i}`"
            class="sin-chip"
            :style="{ backgroundColor: STATUS[c.status].chip }"
          >{{ c.code }}</span>
        </div>
      </div>

      <!-- Timeline -->
      <div class="sin-line">
        <div class="sin-line__title">{{ linha.name }}</div>

        <!-- Trilho volta (superior, verde) -->
        <div class="sin-rail sin-rail--volta">
          <span
            v-for="n in linha.stops"
            :key="`vt-${n}`"
            class="sin-rail__tick"
          />
          <span class="sin-rail__arrow sin-rail__arrow--right" />
          <span
            v-for="(v, i) in linha.timeline.filter(x => x.dir === 'volta')"
            :key="`vv-${i}`"
            class="sin-bus"
            :style="{ left: `${v.pos}%` }"
          >
            <span class="sin-bus__code" :style="{ backgroundColor: STATUS[v.status].chip }">{{ v.code }}</span>
            <span class="sin-bus__icon" v-html="vehicleSvg(v.status)" />
          </span>
        </div>

        <!-- Trilho ida (inferior, azul) -->
        <div class="sin-rail sin-rail--ida">
          <span
            v-for="n in linha.stops"
            :key="`it-${n}`"
            class="sin-rail__tick"
          />
          <span class="sin-rail__arrow sin-rail__arrow--left" />
          <span
            v-for="(v, i) in linha.timeline.filter(x => x.dir === 'ida')"
            :key="`iv-${i}`"
            class="sin-bus"
            :style="{ left: `${v.pos}%` }"
          >
            <span class="sin-bus__code" :style="{ backgroundColor: STATUS[v.status].chip }">{{ v.code }}</span>
            <span class="sin-bus__icon" v-html="vehicleSvg(v.status)" />
          </span>
        </div>
      </div>

      <!-- TS -->
      <div class="sin-term sin-term--ts">
        <div class="sin-term__head">
          <Bus :size="12" />
          <span class="sin-term__label">TS</span>
        </div>
        <div class="sin-term__chips">
          <span
            v-for="(c, i) in linha.ts"
            :key="`ts-${i}`"
            class="sin-chip"
            :style="{ backgroundColor: STATUS[c.status].chip }"
          >{{ c.code }}</span>
        </div>
      </div>

      <!-- Off garage direita -->
      <div class="sin-term sin-term--off sin-term--light">
        <div class="sin-term__head">
          <CloudOff :size="12" />
        </div>
        <div class="sin-term__chips">
          <span
            v-for="(c, i) in linha.offRight"
            :key="`or-${i}`"
            class="sin-chip"
            :style="{ backgroundColor: STATUS[c.status].chip }"
          >{{ c.code }}</span>
        </div>
      </div>
    </div>

    <!-- ── Rodapé: alertas ───────────────────────────────────── -->
    <footer class="sin-card__foot">
      <button class="sin-alert" type="button">
        <span class="sin-alert__dot" :style="alertDotStyle(linha.alerts.desvio.level)" />
        Desvio de itinerário ({{ pad3(linha.alerts.desvio.count) }})
      </button>
      <button class="sin-alert" type="button">
        <span class="sin-alert__dot" :style="alertDotStyle(linha.alerts.comboio.level)" />
        Comboio ({{ pad3(linha.alerts.comboio.count) }})
      </button>
    </footer>
  </article>
</template>

<style scoped>
/* ── Card ──────────────────────────────────────────────── */
.sin-card {
  background: #FFFFFF;
  border: 1px solid var(--color-neutral-200);
  border-radius: 6px;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  font-family: inherit;
}

/* ── Header ────────────────────────────────────────────── */
.sin-card__head {
  height: 37px;
  display: flex;
  align-items: center;
  background: #0B1F47;
  color: #FFFFFF;
  padding: 0 8px;
  gap: 8px;
}

.sin-card__head-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 0 0 auto;
}

.sin-card__route-icon { color: #FFFFFF; flex-shrink: 0; }

.sin-card__name {
  font-size: 11px;
  font-weight: 500;
  color: #FFFFFF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
}

.sin-card__metrics {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 18px;
}

.sin-metric {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  white-space: nowrap;
}
.sin-metric__label {
  font-size: 10px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.75);
  line-height: 12px;
}
.sin-metric__value {
  font-size: 10px;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 14px;
}

.sin-card__delete {
  width: 26px;
  height: 22px;
  flex-shrink: 0;
  border: none;
  border-radius: 5px;
  background: #E8E8E8;
  color: #B62525;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}
.sin-card__delete:hover { background: #FFD4D4; }

/* ── Body ──────────────────────────────────────────────── */
.sin-card__body {
  display: flex;
  align-items: stretch;
  gap: 4px;
  padding: 6px;
  background: #FFFFFF;
}

/* ── Terminal (TP/TS/off) ──────────────────────────────── */
.sin-term {
  width: 42px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px 3px;
  border-radius: 6px;
}

.sin-term--tp,
.sin-term--ts        { background: #FFC41F; color: #484848; }
.sin-term--dark      { background: #555052; color: #FFFFFF; }
.sin-term--light     { background: #CFCFCF; color: #434343; }

.sin-term__head {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  font-weight: 700;
  line-height: 14px;
}
.sin-term__label { letter-spacing: 0.02em; }

.sin-term__chips {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  width: 100%;
}

.sin-chip {
  display: block;
  text-align: center;
  font-size: 9px;
  font-weight: 700;
  line-height: 12px;
  color: #FFFFFF;
  padding: 1px 2px;
  border-radius: 2px;
}

/* ── Timeline (linha branca com 2 trilhos) ─────────────── */
.sin-line {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  background: #FFFFFF;
  border: 1px solid var(--color-neutral-200);
  overflow: hidden;
  position: relative;
}

.sin-line__title {
  height: 18px;
  background: #0B1F47;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 500;
  line-height: 18px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
}

/* Trilho — barra horizontal com ticks */
.sin-rail {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  min-height: 34px;
}

.sin-rail__tick {
  width: 2px;
  height: 14px;
  background: var(--color-neutral-300);
  border-radius: 1px;
  flex-shrink: 0;
}

/* Setas nos extremos (volta=verde dir, ida=azul esq) */
.sin-rail__arrow {
  position: absolute;
  top: 50%;
  width: 0;
  height: 0;
  transform: translateY(-50%);
}
.sin-rail--volta .sin-rail__arrow--right {
  right: 2px;
  border-top:    6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left:   8px solid #61860A;
}
.sin-rail--ida .sin-rail__arrow--left {
  left: 2px;
  border-top:    6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right:  8px solid #4D6AFE;
}

/* Linha guia central (track) */
.sin-rail::before {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  top: 50%;
  height: 2px;
  background: var(--color-neutral-200);
  transform: translateY(-50%);
  z-index: 0;
}
.sin-rail__tick { position: relative; z-index: 1; }

/* Veículo na timeline = SVG + chip do código acima */
.sin-bus {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  z-index: 2;
  pointer-events: none;
}
.sin-bus__code {
  display: inline-block;
  font-size: 8px;
  font-weight: 700;
  line-height: 11px;
  color: #FFFFFF;
  padding: 0 4px;
  border-radius: 2px;
  margin-bottom: -2px;
}
.sin-bus__icon {
  width: 24px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.25));
}
.sin-bus :deep(.sin-bus__svg) {
  width: 100%;
  height: 100%;
  display: block;
}

/* ── Rodapé ────────────────────────────────────────────── */
.sin-card__foot {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px 8px;
  background: #FFFFFF;
}

.sin-alert {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 4px;
  border: 1px solid #E8E8E8;
  border-radius: 5px;
  background: #FFFFFF;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.15);
  color: #212B36;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition-fast);
}
.sin-alert:hover { background: var(--color-neutral-50); }

.sin-alert__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
