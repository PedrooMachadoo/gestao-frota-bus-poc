<script setup lang="ts">
/**
 * Card de uma linha no Sinótico.
 *
 * Estrutura vertical:
 *   1. Cabeçalho (faixa azul escuro) — nome da linha + métricas + lixeira
 *   2. Corpo horizontal: [off garage L] [TP] [timeline] [TS] [off garage R]
 *      Timeline mostra dois trilhos paralelos:
 *        - superior (volta): seta verde
 *        - inferior (ida):   seta azul
 *      Cada veículo é um SVG 3D de ônibus (veiculo2) tingido pelo status,
 *      com o código sobreposto no topo (label-chip).
 *      Quando 2+ veículos compartilham um ponto da linha, formam um
 *      "cluster" empilhado verticalmente sobre um marcador destacado.
 *   3. Rodapé: dois pills de alerta (Desvio de itinerário / Comboio)
 *
 * Regras de cor por status do veículo:
 *   ok        → verde   #84CB33
 *   adiantado → azul    #4D6AFE
 *   atrasado  → vermelho #FF3B3B
 *   off       → cinza   #9CA3AF
 */
import { ArrowDownUp, Trash2, CloudOff, Bus } from 'lucide-vue-next'
import veiculo2SvgRaw from '~/components/ui/veiculo2.svg?raw'
import type {
  SinoticoLinha,
  TimelineVehicle,
  VehicleStatus,
  AlertLevel,
} from '~/data/sinotico.mock'

// ── Constantes em escopo de MÓDULO (computadas uma única vez,
// compartilhadas por todas as instâncias do card). Antes: cada card
// recompilava o SVG e fazia replaceAll em cada render — pesado quando
// há vários cards e ~26 veículos por card. ─────────────────────────
const STATUS: Record<VehicleStatus, { body: string; shadow: string; chip: string }> = {
  ok:        { body: '#84CB33', shadow: '#4DA30D', chip: '#5F981F' },
  adiantado: { body: '#4D6AFE', shadow: '#2C46C8', chip: '#1A45D6' },
  atrasado:  { body: '#FF3B3B', shadow: '#B62525', chip: '#A11212' },
  off:       { body: '#9CA3AF', shadow: '#6B7280', chip: '#4B5563' },
}

const SVG_BASE = veiculo2SvgRaw
  .replace(/\swidth="\d+"/i,  '')
  .replace(/\sheight="\d+"/i, '')
  .replace('<svg', '<svg class="sin-bus__svg" preserveAspectRatio="xMidYMid meet"')

// Pré-tinge o SVG para cada um dos 4 status — lookup O(1) no render.
const TINTED_SVG: Record<VehicleStatus, string> = {
  ok:        SVG_BASE.replaceAll('#84CB33', STATUS.ok.body).replaceAll('#4DA30D', STATUS.ok.shadow),
  adiantado: SVG_BASE.replaceAll('#84CB33', STATUS.adiantado.body).replaceAll('#4DA30D', STATUS.adiantado.shadow),
  atrasado:  SVG_BASE.replaceAll('#84CB33', STATUS.atrasado.body).replaceAll('#4DA30D', STATUS.atrasado.shadow),
  off:       SVG_BASE.replaceAll('#84CB33', STATUS.off.body).replaceAll('#4DA30D', STATUS.off.shadow),
}

function vehicleSvg(status: VehicleStatus): string {
  return TINTED_SVG[status]
}

const props = defineProps<{ linha: SinoticoLinha }>()
const emit = defineEmits<{ remove: [id: string] }>()

// ── Cluster de veículos no mesmo ponto ──────────────────────────
// Agrupamos por (direção + bin de 2.5%). Veículos no mesmo bin se
// renderizam empilhados, sobre o mesmo marcador de parada destacado.
const CLUSTER_BIN = 2.5

interface BusCluster {
  dir: 'ida' | 'volta'
  pos: number              // posição média do cluster
  vehicles: TimelineVehicle[]
}

function clusterize(timeline: TimelineVehicle[], dir: 'ida' | 'volta'): BusCluster[] {
  const subset = timeline.filter(v => v.dir === dir).sort((a, b) => a.pos - b.pos)
  const out: BusCluster[] = []
  for (const v of subset) {
    const last = out[out.length - 1]
    if (last && Math.abs(last.pos - v.pos) <= CLUSTER_BIN) {
      last.vehicles.push(v)
      // recentraliza no centroide do cluster
      last.pos = last.vehicles.reduce((s, x) => s + x.pos, 0) / last.vehicles.length
    } else {
      out.push({ dir, pos: v.pos, vehicles: [v] })
    }
  }
  return out
}

const clustersVolta = computed(() => clusterize(props.linha.timeline, 'volta'))
const clustersIda   = computed(() => clusterize(props.linha.timeline, 'ida'))

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
            class="sin-bus-chip"
          >
            <span class="sin-bus-chip__icon" v-html="vehicleSvg(c.status)" />
            <span class="sin-bus-chip__code">{{ c.code }}</span>
          </span>
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
            class="sin-bus-chip"
          >
            <span class="sin-bus-chip__icon" v-html="vehicleSvg(c.status)" />
            <span class="sin-bus-chip__code">{{ c.code }}</span>
          </span>
        </div>
      </div>

      <!-- Timeline — estrutura aprovada no Figma:
             [trilho VOLTA (verde) com veículos]
             [faixa título no MEIO com setas integradas nas pontas]
             [trilho IDA (azul) com veículos]
           As setas na faixa do título mostram o sentido de cada trilho. -->
      <div class="sin-line">
        <!-- Trilho volta (superior, verde) -->
        <div class="sin-rail sin-rail--volta">
          <span
            v-for="n in linha.stopsVolta"
            :key="`vt-${n}`"
            class="sin-rail__tick"
          />

          <span
            v-for="(c, i) in clustersVolta"
            :key="`vc-${i}`"
            class="sin-bus-cluster"
            :style="{ left: `${c.pos}%` }"
          >
            <span
              v-for="(v, k) in c.vehicles"
              :key="`vcv-${k}`"
              class="sin-bus"
            >
              <span class="sin-bus__icon" v-html="vehicleSvg(v.status)" />
              <span class="sin-bus__code">{{ v.code }}</span>
            </span>
          </span>
        </div>

        <!-- Faixa título central com setas integradas -->
        <div class="sin-line__title">
          <span class="sin-line__arrow sin-line__arrow--ida" />
          <span class="sin-line__title-text">{{ linha.name }}</span>
          <span class="sin-line__arrow sin-line__arrow--volta" />
        </div>

        <!-- Trilho ida (inferior, azul) -->
        <div class="sin-rail sin-rail--ida">
          <span
            v-for="n in linha.stopsIda"
            :key="`it-${n}`"
            class="sin-rail__tick"
          />

          <span
            v-for="(c, i) in clustersIda"
            :key="`ic-${i}`"
            class="sin-bus-cluster"
            :style="{ left: `${c.pos}%` }"
          >
            <span
              v-for="(v, k) in c.vehicles"
              :key="`icv-${k}`"
              class="sin-bus"
            >
              <span class="sin-bus__icon" v-html="vehicleSvg(v.status)" />
              <span class="sin-bus__code">{{ v.code }}</span>
            </span>
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
            class="sin-bus-chip"
          >
            <span class="sin-bus-chip__icon" v-html="vehicleSvg(c.status)" />
            <span class="sin-bus-chip__code">{{ c.code }}</span>
          </span>
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
            class="sin-bus-chip"
          >
            <span class="sin-bus-chip__icon" v-html="vehicleSvg(c.status)" />
            <span class="sin-bus-chip__code">{{ c.code }}</span>
          </span>
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
  width: 68px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px 3px 6px;
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
  align-items: center;
  /* gap:0 — o crop do SVG já gera ~8px naturais de espaço entre os
     corpos dos ônibus (pelas margens transparentes restantes). */
  gap: 0;
  width: 100%;
}

/* ── Chip do terminal: mesma unidade visual da timeline (SVG do ônibus
   com código branco sobreposto). Consistência absoluta com a timeline. */
/* Mesmo crop da timeline, escalonado pra largura do terminal. */
.sin-bus-chip {
  position: relative;
  display: block;
  width: 60px;
  height: 18px;
  overflow: hidden;
}
.sin-bus-chip__icon {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  margin-top: -12px;
}
.sin-bus-chip__icon :deep(.sin-bus__svg) {
  width: 100%;
  height: auto;
  display: block;
}
.sin-bus-chip__code {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  color: #FFFFFF;
  letter-spacing: 0;
  white-space: nowrap;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35);
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
  /* Visible pra clusters maiores que o trilho não serem cortados */
  overflow: visible;
  position: relative;
}

/* Faixa título central — fica ENTRE os 2 trilhos e leva as setas que
   indicam o sentido de cada trilho (azul ← ida / verde → volta). */
.sin-line__title {
  position: relative;
  height: 22px;
  background: #0B1F47;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
}
.sin-line__title-text {
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 24px;
}
.sin-line__arrow {
  position: absolute;
  top: 50%;
  width: 0;
  height: 0;
  transform: translateY(-50%);
}
.sin-line__arrow--ida {
  left: 4px;
  border-top:    7px solid transparent;
  border-bottom: 7px solid transparent;
  border-right:  9px solid #4D6AFE;
}
.sin-line__arrow--volta {
  right: 4px;
  border-top:    7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left:   9px solid #84CB33;
}

/* Trilho — barra horizontal com ticks. Ida e Volta podem ter contagens
   diferentes (rota real raramente é simétrica).
   Setas direcionais foram realocadas pra faixa de título central (Figma),
   por isso aqui não precisamos reservar espaço lateral pra setas. */
.sin-rail {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  /* Cluster máx (3 ônibus de 22px cada) ≈ 66px → 70px com pequena folga.
     Listas maiores: o `.sinotico__main` já tem overflow-y auto. */
  min-height: 70px;
}

.sin-rail__tick {
  width: 2px;
  height: 14px;
  background: var(--color-neutral-300);
  border-radius: 1px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

/* Sem track horizontal — apenas os ticks verticais (.sin-rail__tick)
   marcam os pontos de parada. As setas direcionais ficam na faixa de
   título central (verde p/ volta, azul p/ ida). */

/* ── Cluster de veículos (1+ no mesmo ponto) ───────────────────────
   Posicionado em `left: pos%` e centralizado verticalmente no trilho.
   Cada veículo é uma "unidade visual" (chip-tag + ônibus). Quando há
   2+ veículos no mesmo ponto, as unidades se empilham em coluna com
   pequena separação pra cada chip ficar legível.
   O traço escuro do ponto de parada vive no ::before — fica ATRÁS de
   todas as unidades, transbordando 4px em cima/embaixo do cluster. */
.sin-bus-cluster {
  position: absolute;
  top: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Sem gap: o margin-top negativo dos ônibus subsequentes controla
     a sobreposição (fecha o vão transparente do SVG entre os corpos). */
  gap: 0;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 5;
}
/* Marker do ponto de parada: MESMO tamanho do tick comum do trilho
   (14px), só com cor escura pra destacar. Não cresce mais com o
   tamanho do cluster — assim o cluster pode encolher sem ser puxado
   pelo marker. */
.sin-bus-cluster::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 2px;
  height: 14px;
  background: var(--color-neutral-800, #1F2937);
  border-radius: 1px;
  transform: translate(-50%, -50%);
  z-index: 0;
}

/* ── Veículo individual: o próprio SVG do ônibus É a "etiqueta",
   com o código branco sobreposto no corpo. Sem chip retangular
   separado — o SVG já carrega a cor do status.

   ALINHAMENTO: o container tem aspect-ratio 1.684 (igual ao viewBox
   do SVG 64×38) pra que o SVG enche o container sem sobra lateral —
   assim o ônibus fica de fato centralizado horizontalmente. */
/* Container compacto que mostra apenas o corpo do ônibus + pequena
   margem (cropa o "ar" do viewBox do SVG via overflow:hidden). */
.sin-bus {
  position: relative;
  display: block;
  width: 80px;
  height: 22px;
  overflow: hidden;
  z-index: 1;
}
.sin-bus__icon {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  /* Crop: SVG renderiza no aspect natural e o margin-top negativo sobe
     pra alinhar o corpo no centro do container.
     OBS: removido o filter:drop-shadow porque o SVG já tem sombra interna
     (feGaussianBlur) — duplicar filtros prejudica performance. */
  margin-top: -17px;
}
.sin-bus :deep(.sin-bus__svg) {
  width: 100%;
  height: auto;
  display: block;
}
.sin-bus__code {
  position: absolute;
  /* Com o crop, o corpo do ônibus está centralizado dentro do container.
     Então top:50% já cai no centro do corpo. */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  color: #FFFFFF;
  letter-spacing: 0;
  white-space: nowrap;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35);
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
