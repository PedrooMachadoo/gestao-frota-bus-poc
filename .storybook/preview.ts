import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import '../assets/css/tokens.css'
import '../assets/css/global.css'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'

setup((app) => {
  app.use(createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  }))
  app.use(createPinia())
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
      },
    },
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: '#FFFFFF' },
        { name: 'neutral', value: '#F9FAFB' },
        { name: 'dark',    value: '#111827' },
      ],
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
  },
}

export default preview
