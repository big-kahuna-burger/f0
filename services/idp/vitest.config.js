import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [...configDefaults.coverage.exclude, '*.cjs', 'device-flow.js']
    }
  }
})
