<script setup lang="ts">
import { useRoute } from 'vue-router'
import {
  LayoutGrid,
  LogOut,
  ChevronDown,
  ChevronUp,
  Building,
  Bot,
  ScrollText,
  Code,
  Search,
} from 'lucide-vue-next'

const route = useRoute()

// sidebar collapse
const sidebarOpen = ref(true)

// empresa dropdown
const empresaOpen    = ref(false)
const empresaBtnRef  = ref<HTMLElement | null>(null)
const empresaDropdownPos = ref({ top: '0px', left: '0px' })

function toggleEmpresa() {
  if (!sidebarOpen.value) return
  empresaOpen.value = !empresaOpen.value
  if (empresaOpen.value && empresaBtnRef.value) {
    const r = empresaBtnRef.value.getBoundingClientRect()
    empresaDropdownPos.value = {
      top:  `${r.top}px`,
      left: `${r.right + 8}px`,
    }
  }
}

// nav dropdowns
const planejamentoOpen = ref(false)

// empresa selected
const selectedEmpresa = ref('')

function isActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}

function selectEmpresa(name: string) {
  selectedEmpresa.value = name
  empresaOpen.value = false
}

// close empresa when clicking outside
function onClickOutside(e: MouseEvent) {
  if (!empresaOpen.value) return
  const target = e.target as HTMLElement
  if (!target.closest('.empresa-dropdown') && !target.closest('.sidebar__empresa')) {
    empresaOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  if (isActive('/linhas')) planejamentoOpen.value = true
})
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div class="app-shell">

    <!-- ── Sidebar ── -->
    <aside class="sidebar" :class="{ 'sidebar--mini': !sidebarOpen }">

      <!-- Header / Logo -->
      <div class="sidebar__header">
        <!-- Logo full -->
        <svg v-if="sidebarOpen" class="logo-svg-full" width="120" height="45" viewBox="0 0 134 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.0186 17.2891C16.0186 15.7038 15.4256 14.3423 14.2592 13.214C13.0831 12.0856 11.6737 11.5261 10.0116 11.5261C8.34947 11.5261 6.94008 12.0856 5.76396 13.214C4.58784 14.3423 4.00464 15.6945 4.00464 17.2891V26.8941H0V17.2891C0 14.6407 0.98174 12.3747 2.93546 10.5003C4.88918 8.62591 7.25111 7.68403 10.0116 7.68403C12.7721 7.68403 15.1341 8.6259 17.0975 10.491C17.4377 10.8267 17.739 11.1624 18.0209 11.5074C18.3028 11.1624 18.6138 10.8267 18.954 10.491C20.9077 8.6259 23.26 7.68403 26.0302 7.68403C28.8004 7.68403 31.1526 8.62591 33.1063 10.5003C35.0601 12.384 36.0418 14.6407 36.0418 17.2891V26.8941H32.0469V17.2891C32.0469 15.7038 31.4637 14.3423 30.2876 13.214C29.1115 12.0856 27.702 11.5261 26.0399 11.5261C24.3778 11.5261 22.9586 12.0856 21.7922 13.214C20.6161 14.3423 20.0329 15.6945 20.0329 17.2891V26.8941H16.0283V17.2891H16.0186ZM48.0557 7.68403C50.8162 7.68403 53.1781 8.62591 55.1416 10.5003C57.0953 12.384 58.077 14.6407 58.077 17.2891C58.077 19.9375 57.0953 22.2035 55.1416 24.0872C53.1781 25.9616 50.8259 26.9035 48.0557 26.9035C45.2855 26.9035 42.9333 25.9616 40.9796 24.0872C39.0259 22.2128 38.0441 19.9468 38.0441 17.2891C38.0441 14.6314 39.0259 12.3747 40.9796 10.5003C42.9333 8.62591 45.305 7.68403 48.0557 7.68403ZM48.0557 11.5261C46.4033 11.5261 44.9842 12.0856 43.8081 13.214C42.632 14.3423 42.0488 15.6945 42.0488 17.2891C42.0488 18.8837 42.632 20.2359 43.8081 21.3643C44.9842 22.4926 46.3936 23.0521 48.0557 23.0521C49.7178 23.0521 51.1272 22.4926 52.3034 21.3643C53.4795 20.2359 54.0627 18.8744 54.0627 17.2891C54.0627 15.7038 53.4795 14.3423 52.3034 13.214C51.1272 12.0856 49.7178 11.5261 48.0557 11.5261ZM70.0813 11.5261C68.4289 11.5261 67.0097 12.0856 65.8336 13.214C64.6575 14.3423 64.0743 15.6945 64.0743 17.2891C64.0743 18.8837 64.6575 20.2359 65.8336 21.3643C67.0097 22.4926 68.4289 23.0521 70.0813 23.0521C71.7337 23.0521 73.1528 22.4926 74.3289 21.3643C75.5051 20.2359 76.0882 18.8744 76.0882 17.2891C76.0882 15.7038 75.5051 14.3423 74.3289 13.214C73.1528 12.0856 71.7337 11.5261 70.0813 11.5261ZM60.0696 0H64.0743V9.5864C65.7947 8.31816 67.7971 7.68403 70.0813 7.68403C72.8418 7.68403 75.2037 8.62591 77.1574 10.5003C79.1111 12.384 80.0929 14.6407 80.0929 17.2891C80.0929 19.9375 79.1111 22.2035 77.1574 24.0872C75.194 25.9616 72.8418 26.9035 70.0813 26.9035C67.3208 26.9035 64.9588 25.9616 63.0051 24.0872C61.0514 22.2128 60.0696 19.9468 60.0696 17.2891V0ZM88.1022 7.68403H102.118V11.5261H88.1022C87.5578 11.5261 87.0815 11.7126 86.683 12.0949C86.2942 12.4679 86.0998 12.9249 86.0998 13.4471C86.0998 13.9693 86.2942 14.4262 86.683 14.8086C87.0815 15.1816 87.5481 15.3681 88.1022 15.3681H96.1114C97.7638 15.3681 99.183 15.9276 100.359 17.056C101.535 18.1843 102.118 19.5458 102.118 21.1311C102.118 22.7164 101.535 24.0779 100.359 25.2063C99.183 26.3346 97.7638 26.8941 96.1114 26.8941H82.0952V23.0521H96.1114C96.6558 23.0521 97.132 22.8656 97.5209 22.4926C97.9194 22.1103 98.1138 21.6627 98.1138 21.1311C98.1138 20.5996 97.9194 20.152 97.5209 19.7789C97.132 19.3966 96.6558 19.2101 96.1114 19.2101H88.1022C86.4498 19.2101 85.0306 18.6413 83.8545 17.5222C82.6784 16.3939 82.0952 15.0417 82.0952 13.4471C82.0952 11.8525 82.6784 10.5003 83.8545 9.37191C85.0306 8.24355 86.4498 7.68403 88.1022 7.68403ZM125.991 0C128.207 0 130.093 0.755352 131.658 2.2474C133.222 3.74877 134 5.55787 134 7.68403C134 9.8102 133.213 11.6286 131.658 13.1207C130.093 14.6221 128.207 15.3681 125.991 15.3681H113.977C112.869 15.3681 111.926 15.7411 111.139 16.4964C110.361 17.2425 109.972 18.147 109.972 19.2101C109.972 20.2732 110.361 21.1777 111.139 21.9331C111.926 22.6791 112.869 23.0521 113.977 23.0521H134V26.8941H113.977C111.761 26.8941 109.875 26.1388 108.31 24.6467C106.745 23.1547 105.968 21.3363 105.968 19.2101C105.968 17.0839 106.745 15.2748 108.31 13.7734C109.875 12.2721 111.761 11.5261 113.977 11.5261H125.991C127.099 11.5261 128.042 11.1531 128.819 10.407C129.607 9.66101 129.995 8.74712 129.995 7.68403C129.995 6.62095 129.607 5.71639 128.819 4.97037C128.042 4.22435 127.099 3.84202 125.991 3.84202H113.802V0H125.991Z" fill="white"/>
          <path d="M75.2922 45.4336H77.5293C77.5555 45.9177 77.7386 46.3297 78.0788 46.6699C78.432 46.9969 78.8375 47.2259 79.2954 47.3567C79.7664 47.4875 80.2701 47.5529 80.8064 47.5529C81.6829 47.5529 82.4286 47.3894 83.0435 47.0624C83.6714 46.7353 83.9854 46.1858 83.9854 45.414C83.9854 45.0738 83.9069 44.7795 83.7499 44.5309C83.606 44.2693 83.436 44.0731 83.2397 43.9422C83.0566 43.7983 82.7818 43.6806 82.4155 43.589C82.0492 43.4844 81.7483 43.4189 81.5129 43.3928C81.2905 43.3535 80.9634 43.3143 80.5317 43.275C77.1957 42.9872 75.5277 41.7313 75.5277 39.5073C75.5277 38.1729 76.0248 37.146 77.0191 36.4265C78.0264 35.7069 79.2496 35.3472 80.6887 35.3472C82.1146 35.3472 83.3182 35.6808 84.2994 36.348C85.2936 37.0152 85.8039 38.0094 85.83 39.3307H83.6714C83.6453 38.8728 83.4687 38.4935 83.1416 38.1926C82.8146 37.8786 82.4417 37.6693 82.0231 37.5646C81.6175 37.4469 81.1662 37.388 80.6691 37.388C79.9234 37.388 79.2562 37.5581 78.6675 37.8982C78.0788 38.2253 77.7844 38.742 77.7844 39.4485C77.7844 39.7494 77.8498 40.011 77.9806 40.2334C78.1115 40.4558 78.2554 40.6259 78.4124 40.7436C78.5694 40.8614 78.8114 40.9726 79.1384 41.0772C79.4786 41.1688 79.7533 41.2342 79.9626 41.2734C80.1719 41.3127 80.4924 41.3585 80.9242 41.4108C81.5783 41.4893 82.1277 41.5678 82.5725 41.6463C83.0173 41.7248 83.4883 41.8621 83.9854 42.0584C84.4956 42.2415 84.9012 42.4705 85.2021 42.7452C85.503 43.0199 85.7515 43.3862 85.9478 43.8441C86.1571 44.2889 86.2617 44.8187 86.2617 45.4336C86.2617 46.1531 86.0982 46.7942 85.7712 47.3567C85.4572 47.9062 85.032 48.3379 84.4956 48.6519C83.9723 48.9658 83.4033 49.2013 82.7884 49.3583C82.1735 49.5153 81.5259 49.5938 80.8457 49.5938C79.9168 49.6199 79.0403 49.4891 78.2161 49.2013C77.405 48.9135 76.7182 48.4425 76.1557 47.7884C75.5931 47.1343 75.3053 46.3494 75.2922 45.4336Z" fill="white"/>
          <path d="M67.5199 49.5156C65.9762 49.5156 64.6941 49.0904 63.6737 48.24C62.6533 47.3766 62.1431 46.2057 62.1431 44.7274V35.6025H64.4194V44.6686C64.4194 45.5451 64.7072 46.2319 65.2828 46.729C65.8715 47.2262 66.6172 47.4747 67.5199 47.4747C68.4095 47.4747 69.1421 47.2262 69.7177 46.729C70.2933 46.2319 70.5811 45.5451 70.5811 44.6686V35.6025H72.8378V44.7274C72.8378 46.2057 72.3276 47.3766 71.3072 48.24C70.2999 49.0904 69.0374 49.5156 67.5199 49.5156Z" fill="white"/>
          <path d="M59.0435 39.4684C59.0435 40.7112 58.5072 41.5942 57.4344 42.1175C58.9127 42.6277 59.6519 43.6874 59.6519 45.2965C59.6519 46.5262 59.2594 47.5074 58.4745 48.24C57.6895 48.9726 56.6298 49.3389 55.2955 49.3389H49.1533V35.6025H54.7264C56.0215 35.6025 57.0616 35.9361 57.8465 36.6033C58.6445 37.2574 59.0435 38.2125 59.0435 39.4684ZM54.5694 37.5845H51.4296V41.3718H54.5694C56.0477 41.3718 56.7934 40.757 56.8065 39.5272C56.8065 38.8731 56.6037 38.3891 56.1981 38.0751C55.8057 37.748 55.2628 37.5845 54.5694 37.5845ZM54.903 43.2361H51.4296V47.3374H55.1581C55.8122 47.3374 56.342 47.1607 56.7476 46.8075C57.1531 46.4412 57.369 45.9375 57.3952 45.2965C57.3952 44.6032 57.1597 44.0602 56.6887 43.6678C56.2963 43.38 55.701 43.2361 54.903 43.2361Z" fill="white"/>
        </svg>
        <!-- Logo mini -->
        <svg v-else class="logo-svg-mini" width="44" height="24" viewBox="0 0 66 35" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.2811 23.7149C16.2811 22.2044 15.7152 20.9073 14.6019 19.8322C13.4794 18.7571 12.1342 18.224 10.5478 18.224C8.96135 18.224 7.61615 18.7571 6.4936 19.8322C5.37105 20.9073 4.81442 22.1956 4.81442 23.7149V32.8664H0.992188V23.7149C0.992188 21.1916 1.92921 19.0325 3.79394 17.2466C5.65867 15.4608 7.91302 14.5634 10.5478 14.5634C13.1825 14.5634 15.4369 15.4608 17.3109 17.2378C17.6356 17.5576 17.9232 17.8775 18.1922 18.2062C18.4613 17.8775 18.7582 17.5576 19.0829 17.2378C20.9476 15.4608 23.1927 14.5634 25.8367 14.5634C28.4808 14.5634 30.7258 15.4608 32.5906 17.2466C34.4553 19.0414 35.3923 21.1916 35.3923 23.7149V32.8664H31.5794V23.7149C31.5794 22.2044 31.0227 20.9073 29.9002 19.8322C28.7776 18.7571 27.4324 18.224 25.846 18.224C24.2596 18.224 22.9051 18.7571 21.7918 19.8322C20.6693 20.9073 20.1126 22.1956 20.1126 23.7149V32.8664H16.2904V23.7149H16.2811ZM56.2442 7.24219C58.3594 7.24219 60.1592 7.96187 61.6528 9.38346C63.1465 10.8139 63.8886 12.5376 63.8886 14.5634C63.8886 16.5891 63.1372 18.3217 61.6528 19.7433C60.1592 21.1738 58.3594 21.8846 56.2442 21.8846H44.7775C43.7199 21.8846 42.82 22.24 42.0685 22.9597C41.3263 23.6705 40.9552 24.5323 40.9552 25.5452C40.9552 26.5581 41.3263 27.4199 42.0685 28.1396C42.82 28.8504 43.7199 29.2058 44.7775 29.2058H63.8886V32.8664H44.7775C42.6623 32.8664 40.8625 32.1467 39.3688 30.7251C37.8752 29.3035 37.133 27.571 37.133 25.5452C37.133 23.5194 37.8752 21.7957 39.3688 20.3652C40.8625 18.9348 42.6623 18.224 44.7775 18.224H56.2442C57.3018 18.224 58.2017 17.8686 58.9439 17.1578C59.6953 16.447 60.0664 15.5763 60.0664 14.5634C60.0664 13.5505 59.6953 12.6886 58.9439 11.9779C58.2017 11.2671 57.3018 10.9028 56.2442 10.9028H44.6105V7.24219H56.2442Z" fill="white"/>
        </svg>
      </div>

      <!-- Nav -->
      <nav class="sidebar__nav">

        <!-- EMPRESA -->
        <div class="sidebar__group">
          <span v-if="sidebarOpen" class="sidebar__label">EMPRESA</span>
          <button
            ref="empresaBtnRef"
            class="sidebar__empresa"
            :class="{ 'sidebar__empresa--open': empresaOpen }"
            :title="!sidebarOpen ? (selectedEmpresa || '[Nome Empresa]') : undefined"
            @click="toggleEmpresa"
          >
            <span class="s-icon" :class="{ 's-icon--on-active': empresaOpen }">
              <Building :size="15" />
            </span>
            <span v-if="sidebarOpen" class="s-text">{{ selectedEmpresa || '[Nome Empresa]' }}</span>
            <component
              :is="empresaOpen ? ChevronUp : ChevronDown"
              v-if="sidebarOpen"
              :size="11"
              class="s-chevron"
              :class="{ 's-chevron--active': empresaOpen }"
            />
          </button>
        </div>

        <!-- ASSISTENTE -->
        <div class="sidebar__group">
          <span v-if="sidebarOpen" class="sidebar__label">ASSISTENTE</span>
          <button class="sidebar__item" :title="!sidebarOpen ? 'Mai' : undefined">
            <span class="s-icon">
              <Bot :size="15" />
            </span>
            <span v-if="sidebarOpen" class="s-text">Mai</span>
          </button>
        </div>

        <!-- BUS -->
        <div class="sidebar__group">
          <span v-if="sidebarOpen" class="sidebar__label">BUS</span>

          <!-- Planejamento dropdown -->
          <button
            class="sidebar__bus-item"
            :class="{ 'sidebar__bus-item--open': planejamentoOpen && sidebarOpen, 'sidebar__bus-item--icon-active': !sidebarOpen && isActive('/linhas') }"
            :title="!sidebarOpen ? 'Planejamento' : undefined"
            @click="sidebarOpen ? (planejamentoOpen = !planejamentoOpen) : undefined"
          >
            <span
              class="s-icon"
              :class="{
                's-icon--on-active': planejamentoOpen && sidebarOpen,
                's-icon--standalone-active': !sidebarOpen && isActive('/linhas')
              }"
            >
              <LayoutGrid :size="15" />
            </span>
            <span v-if="sidebarOpen" class="s-text">Planejamento</span>
            <component
              :is="planejamentoOpen ? ChevronUp : ChevronDown"
              v-if="sidebarOpen"
              :size="11"
              class="s-chevron"
              :class="{ 's-chevron--active': planejamentoOpen }"
            />
          </button>

          <Transition name="sub">
            <div v-if="sidebarOpen && planejamentoOpen" class="sidebar__sub">
              <NuxtLink
                to="/linhas"
                class="sidebar__sub-item"
                :class="{ 'sidebar__sub-item--active': isActive('/linhas') }"
              >
                Linha
              </NuxtLink>
            </div>
          </Transition>
        </div>

        <!-- CONFIGURAÇÕES -->
        <div class="sidebar__group">
          <span v-if="sidebarOpen" class="sidebar__label">CONFIGURAÇÕES</span>
          <button class="sidebar__item" :title="!sidebarOpen ? 'Log' : undefined">
            <span class="s-icon">
              <ScrollText :size="15" />
            </span>
            <span v-if="sidebarOpen" class="s-text">Log</span>
          </button>
        </div>

      </nav>

      <!-- Footer -->
      <div class="sidebar__footer">
        <template v-if="sidebarOpen">
          <div class="sidebar__flags">
            <span>🇧🇷</span><span>🇺🇸</span><span>🇪🇸</span>
          </div>
          <span class="sidebar__version">Versão 0.00.0</span>
          <span class="sidebar__email">email.usuario@mobs2.com</span>
          <hr class="sidebar__hr" />
        </template>
        <span v-else class="sidebar__version-mini">0.00.0</span>
        <button class="sidebar__logout" :class="{ 'sidebar__logout--icon': !sidebarOpen }">
          <LogOut :size="15" />
          <span v-if="sidebarOpen">Sair</span>
        </button>
      </div>

    </aside>

    <!-- Toggle button — overlaps sidebar right edge -->
    <button
      class="sidebar-toggle"
      :style="{ left: sidebarOpen ? 'calc(var(--sidebar-width) - 12px)' : 'calc(var(--sidebar-width-min) - 12px)' }"
      :title="sidebarOpen ? 'Recolher' : 'Expandir'"
      @click="sidebarOpen = !sidebarOpen; empresaOpen = false"
    >
      <Code :size="10" />
    </button>

    <!-- EMPRESA floating dropdown -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="empresaOpen"
          class="empresa-dropdown"
          :style="empresaDropdownPos"
        >
          <div class="empresa-dropdown__inner">
          <div class="empresa-dropdown__search">
            <Search :size="13" class="empresa-dropdown__search-icon" />
            <input class="empresa-dropdown__input" placeholder="Buscar..." />
          </div>
          <div class="empresa-dropdown__list">
            <button
              v-for="i in 9"
              :key="i"
              class="empresa-dropdown__item"
              :class="{ 'empresa-dropdown__item--selected': selectedEmpresa === `Empresa ${i}` }"
              @click="selectEmpresa(`Empresa ${i}`)"
            >
              Empresa {{ i }}
            </button>
          </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Main -->
    <main class="main-content">
      <slot />
    </main>

  </div>
</template>

<style scoped>
/* ── Shell ─────────────────────────────────────────── */
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* ── Sidebar ───────────────────────────────────────── */
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--sidebar-gradient);
  transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.sidebar--mini { width: var(--sidebar-width-min); }

/* ── Header / Logo ─────────────────────────────────── */
.sidebar__header {
  padding: 18px 14px 14px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-svg-full {
  display: block;
  max-width: 100%;
  height: auto;
}

.logo-svg-mini {
  display: block;
}

/* ── Toggle ────────────────────────────────────────── */
.sidebar-toggle {
  position: absolute;
  top: 16px;
  z-index: 200;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid var(--sidebar-toggle-border);
  background: var(--sidebar-toggle-bg);
  backdrop-filter: blur(6px);
  color: rgba(255,255,255,0.95);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 250ms cubic-bezier(0.4, 0, 0.2, 1), background var(--transition-fast);
}
.sidebar-toggle:hover { background: rgba(0,210,230,0.40); }

/* ── Nav ───────────────────────────────────────────── */
.sidebar__nav {
  flex: 1;
  padding: 8px 24px;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}
.sidebar__nav::-webkit-scrollbar { display: none; }

.sidebar__group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}

.sidebar__label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.13em;
  color: var(--sidebar-label);
  text-transform: uppercase;
  padding: 8px 8px 3px;
  white-space: nowrap;
}

/* ── Icon wrap ─────────────────────────────────────── */
.s-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: transparent;
  color: rgba(255,255,255,0.85);
  transition: background var(--transition-fast), color var(--transition-fast);
}
/* icon on a teal-background parent — shows darker */
.s-icon--on-active {
  background: rgba(0,0,0,0.14);
  color: var(--sidebar-active-text);
}
/* icon active in mini mode */
.s-icon--standalone-active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
}

.s-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-chevron {
  flex-shrink: 0;
  color: rgba(255,255,255,0.45);
  transition: color var(--transition-fast);
}
.s-chevron--active { color: var(--sidebar-active-text); }

/* ── EMPRESA item (7025:3668) ──────────────────────── */
.sidebar__empresa {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 5px 10px 5px 5px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(255,255,255,0.80);
  cursor: pointer;
  font-size: 13px;
  font-weight: 400;
  font-family: inherit;
  transition: background var(--transition-fast), border-color var(--transition-fast),
              color var(--transition-fast);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
}
.sidebar__empresa:hover {
  background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.95);
}
/* open state: teal fill — while dropdown is open (double class = higher specificity than :hover) */
.sidebar__empresa.sidebar__empresa--open,
.sidebar__empresa.sidebar__empresa--open:hover {
  background: var(--sidebar-active-bg);
  border-color: transparent;
  color: var(--sidebar-active-text);
  font-weight: 500;
}

/* ── Generic item ──────────────────────────────────── */
.sidebar__item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 4px 8px 4px 4px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.80);
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;
  transition: background var(--transition-fast);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
}
.sidebar__item:hover { background: rgba(255,255,255,0.08); }
.sidebar__item--link { text-decoration: none; }
.sidebar__item--active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  font-weight: 500;
}

/* ── BUS dropdown item ──────────────────────────────── */
.sidebar__bus-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 4px 8px 4px 4px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(255,255,255,0.80);
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;
  transition: background var(--transition-fast), border-color var(--transition-fast),
              color var(--transition-fast);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
}
.sidebar__bus-item:hover {
  background: rgba(255,255,255,0.07);
}
/* open state: full teal fill */
.sidebar__bus-item.sidebar__bus-item--open,
.sidebar__bus-item.sidebar__bus-item--open:hover {
  background: var(--sidebar-active-bg);
  border-color: transparent;
  color: var(--sidebar-active-text);
  font-weight: 500;
}

/* ── Sub-items with vertical guide line ────────────── */
.sidebar__sub {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 3px 0 3px 22px;
  overflow: hidden;
}
.sidebar__sub::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: rgba(255, 255, 255, 0.20);
  border-radius: 2px;
}

.sidebar__sub-item {
  display: block;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 400;
  color: rgba(255,255,255,0.75);
  text-decoration: none;
  transition: background var(--transition-fast), color var(--transition-fast);
  white-space: nowrap;
}
.sidebar__sub-item:hover {
  background: rgba(255,255,255,0.08);
  color: #fff;
}
.sidebar__sub-item--active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  font-weight: 600;
}

/* ── Sub-item transition ───────────────────────────── */
.sub-enter-active, .sub-leave-active {
  transition: max-height 200ms ease, opacity 150ms ease;
  max-height: 200px;
}
.sub-enter-from, .sub-leave-to { max-height: 0; opacity: 0; }

/* ── Footer ────────────────────────────────────────── */
.sidebar__footer {
  padding: 12px 10px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-top: 1px solid var(--sidebar-divider);
}
.sidebar__flags { display: flex; gap: 5px; font-size: 13px; margin-bottom: 2px; }
.sidebar__version, .sidebar__email {
  font-size: 11px;
  color: var(--sidebar-footer-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar__version-mini {
  font-size: 9px;
  color: var(--sidebar-footer-text);
  text-align: center;
  letter-spacing: 0.04em;
}
.sidebar__hr {
  border: none;
  border-top: 1px solid var(--sidebar-divider);
  margin: 4px 0;
}
.sidebar__logout {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.75);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  transition: background var(--transition-fast);
  white-space: nowrap;
}
.sidebar__logout:hover { background: rgba(255,255,255,0.08); color: #fff; }
.sidebar__logout--icon { justify-content: center; padding: 6px; }

/* ── Main ──────────────────────────────────────────── */
.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--color-neutral-50);
  min-width: 0;
  /* allow PageHeader box-shadow to render above content */
  overflow-x: hidden;
}
</style>

<!-- EMPRESA dropdown global styles (via Teleport) -->
<style>
.empresa-dropdown {
  position: fixed;
  z-index: 9999;
  width: 230px;
  overflow: visible;
}
.empresa-dropdown__inner {
  background: linear-gradient(160deg, #1035CC 0%, #091660 100%);
  border: 1px solid rgba(255,255,255,0.20);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.45);
}
/* seta conectora apontando para a esquerda (em direção à sidebar) */
.empresa-dropdown::before {
  content: '';
  position: absolute;
  left: -7px;
  top: 16px;
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-right: 7px solid rgba(255,255,255,0.20);
}
.empresa-dropdown::after {
  content: '';
  position: absolute;
  left: -6px;
  top: 17px;
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid #1035CC;
}
.empresa-dropdown__search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.10);
}
.empresa-dropdown__search-icon { color: rgba(255,255,255,0.45); flex-shrink: 0; }
.empresa-dropdown__input {
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  color: rgba(255,255,255,0.80);
  font-family: inherit;
  width: 100%;
}
.empresa-dropdown__input::placeholder { color: rgba(255,255,255,0.35); }
.empresa-dropdown__list {
  max-height: 280px;
  overflow-y: auto;
  padding: 4px 0;
}
.empresa-dropdown__item {
  display: block;
  width: 100%;
  padding: 8px 16px;
  background: transparent;
  border: none;
  text-align: left;
  font-size: 13px;
  color: rgba(255,255,255,0.80);
  cursor: pointer;
  font-family: inherit;
  transition: background 150ms ease;
}
.empresa-dropdown__item:hover {
  background: rgba(255,255,255,0.08);
  color: #fff;
}
.empresa-dropdown__item--selected {
  background: rgba(61,214,207,0.18);
  color: #3DD6CF;
  font-weight: 500;
}

/* fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity 150ms ease, transform 150ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateX(-6px); }
</style>
