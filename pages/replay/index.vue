<script setup lang="ts">
definePageMeta({ layout: 'default' })

let map: any = null

onMounted(async () => {
  const leaflet = await import('leaflet')
  await import('leaflet/dist/leaflet.css')
  const L = leaflet.default ?? leaflet

  map = L.map('replay-map', {
    center: [-3.7172, -38.5433],
    zoom: 13,
    zoomControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  setTimeout(() => map?.invalidateSize(), 150)
})

onUnmounted(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div class="replay-page">
    <PageHeader
      title="Monitoramento"
      :tabs="[{ label: 'Replay', to: '/replay' }]"
    />

    <div id="replay-map" class="replay-map" />
  </div>
</template>

<style scoped>
.replay-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.replay-map {
  flex: 1;
  width: 100%;
}
</style>
