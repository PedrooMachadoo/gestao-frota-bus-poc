export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },

  modules: ['@pinia/nuxt'],

  css: [
    '~/assets/css/tokens.css',
    '~/assets/css/global.css',
    '~/assets/css/route-overlay.css',
    '~/assets/css/map-toggles.css',
    'leaflet/dist/leaflet.css',
  ],

  typescript: {
    strict: true,
  },

  compatibilityDate: '2024-11-01',
})
