<script setup lang="ts">
import { useSlots } from 'vue'
import { useRoute } from 'vue-router'

interface Tab {
  label: string
  to: string
}

withDefaults(defineProps<{
  title: string
  tabs?: Tab[]
}>(), {
  tabs: () => [],
})

const slots = useSlots()
const route = useRoute()

function isTabActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
  <header class="page-header" :class="{ 'page-header--spacer': tabs.length && !slots.toolbar }">

    <!-- ── Title row ── -->
    <div class="page-header__title-row">
      <h1 class="page-header__title">{{ title }}</h1>
    </div>

    <!-- ── Tabs row (optional) ── -->
    <nav v-if="tabs.length" class="page-header__tabs-row">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="page-header__tab"
        :class="{ 'page-header__tab--active': isTabActive(tab.to) }"
      >
        {{ tab.label }}
      </NuxtLink>
    </nav>

    <!-- ── Toolbar row (optional slot) ── -->
    <div v-if="slots.toolbar" class="page-header__toolbar">
      <slot name="toolbar" />
    </div>

  </header>
</template>

<style scoped>
/* ── Page Header shell ───────────────────────────────── */
.page-header {
  background: var(--color-neutral-0);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.25);
  width: 100%;
  flex-shrink: 0;
  position: relative;
  z-index: 1000;
}
/* Quando tem tabs mas não tem toolbar — pequeno respiro abaixo */
.page-header--spacer {
  padding-bottom: 8px;
}

/* ── Title row ───────────────────────────────────────── */
.page-header__title-row {
  display: flex;
  align-items: center;
  padding: 20px 20px;
  flex-shrink: 0;
}

.page-header__title {
  margin: 0;
  font-family: 'Inter', sans-serif;
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.16px;
  color: #1E1E1E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Tabs row ────────────────────────────────────────── */
.page-header__tabs-row {
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 0 28px;
  height: 40px;
  background: var(--color-neutral-0);
  border-bottom: 1px solid var(--color-neutral-200);
}

.page-header__tab {
  display: inline-flex;
  align-items: center;
  padding: 0 16px;
  height: 100%;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--color-neutral-400);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color var(--transition-fast), border-color var(--transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
}
.page-header__tab:hover { color: var(--color-neutral-700); }
.page-header__tab.page-header__tab--active {
  color: var(--color-neutral-900);
  font-weight: 600;
  border-bottom-color: #1B45A3;
}

/* ── Toolbar row ─────────────────────────────────────── */
.page-header__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 6px 20px;
  background: var(--color-neutral-0);
}
</style>

<!-- ── Toolbar helper elements (global, usable by any page) ── -->
<style>
/* Filter / icon action button — 36×36, blue, radius 4 */
.ph-btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  border: none;
  background: var(--color-action-blue);
  color: #FFFFFF;
  cursor: pointer;
  flex-shrink: 0;
  text-decoration: none;
  line-height: 1;
  transition: background var(--transition-fast);
}
.ph-btn-icon:hover { background: var(--color-action-blue-hover); }

/* Text action button — 77×36, blue, radius 6 */
.ph-btn-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 6px;
  border: none;
  background: var(--color-action-blue);
  color: #FFFFFF;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}
.ph-btn-text:hover { background: var(--color-action-blue-hover); }

/* Search input — 160×40, white bg, border, radius 4 */
.ph-search {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  width: 160px;
  padding: 0 10px;
  border-radius: 4px;
  border: 1px solid var(--color-neutral-200);
  background: var(--color-neutral-0);
  flex-shrink: 0;
}
.ph-search__icon {
  color: var(--color-neutral-400);
  flex-shrink: 0;
}
.ph-search__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--color-neutral-900);
  min-width: 0;
}
.ph-search__input::placeholder { color: var(--color-neutral-400); }

/* Toolbar divider */
.ph-divider {
  flex: 1;
}
</style>
