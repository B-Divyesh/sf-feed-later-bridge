import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run build && npx vite preview --config site/vite.config.ts --port 4173',
    port: 4173,
    reuseExistingServer: true
  },
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', testIgnore: /extension\.spec\.ts/, use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } } }
  ]
});
