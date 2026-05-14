<script setup lang="ts">
/**
 * LiveRefreshIndicator — pílula escura mostrando o ciclo de atualização
 * em tempo real da tela Ao vivo.
 *
 * Figma: node 1:359495
 *
 *  • Conta regressivamente de REFRESH_INTERVAL segundos até 0
 *  • Ao chegar em 0, "atualiza" (mock: atualiza o timestamp) e reinicia
 *  • Sempre mostra a hora da última atualização ao lado
 *
 * Quando houver fonte real de dados (websocket / poll real), substituir
 * o efeito de `refresh()` por uma chamada à API.
 */
import { RefreshCw } from 'lucide-vue-next'

const REFRESH_INTERVAL = 30   // segundos entre atualizações

// Emite 'refresh' a cada ciclo (quando o countdown zera). O parent usa
// pra atualizar a posição/heading dos veículos no mapa.
const emit = defineEmits<{ refresh: [] }>()

const countdown   = ref(REFRESH_INTERVAL)
const lastUpdate  = ref<Date | null>(null)
let   timer: ReturnType<typeof setInterval> | null = null

function refresh() {
  lastUpdate.value = new Date()
  countdown.value  = REFRESH_INTERVAL
  emit('refresh')
}

function tick() {
  countdown.value--
  if (countdown.value <= 0) refresh()
}

const pad = (n: number) => n.toString().padStart(2, '0')

const countdownStr = computed(() => pad(countdown.value))

const lastUpdateStr = computed(() => {
  const d = lastUpdate.value
  if (!d) return 'dd/mm/aaaa hh:mm:ss'
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})

onMounted(() => {
  refresh()                            // primeira "atualização" imediata
  timer = setInterval(tick, 1000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
  timer = null
})
</script>

<template>
  <div class="lri" role="status" aria-live="polite">
    <span class="lri__icon" aria-hidden="true">
      <RefreshCw :size="20" :stroke-width="2.4" />
    </span>
    <div class="lri__text">
      <strong class="lri__title">
        Atualizando&nbsp;<span class="lri__sep">em</span>&nbsp;{{ countdownStr }} segundos
      </strong>
      <span class="lri__sub">Última atualização: {{ lastUpdateStr }}</span>
    </div>
  </div>
</template>

<style scoped>
.lri {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 10px 18px;
  background: #0F1E3D;       /* navy escuro do Figma */
  border-radius: 10px;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.lri__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #FFFFFF;
  /* Spin contínuo enquanto o timer roda — comunica que a tela está "viva". */
  animation: lri-spin 2.4s linear infinite;
}

@keyframes lri-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Respeita usuários que pedem menos animação (acessibilidade). */
@media (prefers-reduced-motion: reduce) {
  .lri__icon { animation: none; }
}

.lri__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  line-height: 1.2;
}

.lri__title {
  font-size: 14px;
  font-weight: 700;
  color: #FFFFFF;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.lri__sep {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
}

.lri__sub {
  font-size: 11px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
</style>
