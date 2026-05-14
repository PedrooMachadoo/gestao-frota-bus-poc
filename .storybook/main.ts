import type { StorybookConfig } from '@storybook/vue3-vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import vue from '@vitejs/plugin-vue'

const __dirname = dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.ts'],
  addons: [],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  viteFinal(config) {
    config.resolve ??= {}
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string> | undefined),
      '~': resolve(__dirname, '..'),
      '@': resolve(__dirname, '..'),
    }
    config.plugins ??= []
    const hasVuePlugin = (config.plugins as any[]).some(
      p => p && typeof p === 'object' && (p as any).name === 'vite:vue'
    )
    if (!hasVuePlugin) {
      config.plugins.push(vue())
    }
    return config
  },
}

export default config
