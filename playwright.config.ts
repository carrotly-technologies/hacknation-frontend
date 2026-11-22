import { defineConfig, devices } from '@playwright/test'

/**
 * Accessibility tests (`npm run test:a11y`): axe-core scans (WCAG 2.1 A/AA) of the main screens in the light, dark
 * and high-contrast themes, plus the assessment path walked with the keyboard only. They run against a real backend
 * (in-memory, demo seed) and a Vite dev server started here on its own port. See "Accessibility tests" in README.md.
 *
 * - A11Y_API_URL: backend base URL (default http://localhost:3000). Started by Playwright when BACKEND_DIR points to a
 *   hacknation-backend clone, otherwise it must already be running.
 * - A11Y_APP_PORT: port of the Vite server started for the tests (default 5179, so it never collides with `npm run dev`).
 * - APP_URL: test an already running frontend instead (its /api must reach the same backend).
 */
const API_URL = (process.env.A11Y_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const APP_PORT = Number(process.env.A11Y_APP_PORT ?? 5179)
const APP_URL = (process.env.APP_URL ?? `http://localhost:${APP_PORT}`).replace(/\/$/, '')
const BACKEND_DIR = process.env.BACKEND_DIR

process.env.A11Y_API_URL = API_URL

export default defineConfig({
  testDir: './e2e',
  // the tests share the demo data of one backend and the keyboard test changes it: one worker, in order
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 120_000,
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: APP_URL,
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }],
  webServer: [
    ...(BACKEND_DIR
      ? [
          {
            command: 'npm run start',
            cwd: BACKEND_DIR,
            url: `${API_URL}/api/health`,
            env: { PORT: new URL(API_URL).port || '3000', FRONTEND_URL: APP_URL },
            reuseExistingServer: true,
            timeout: 180_000,
          },
        ]
      : []),
    ...(process.env.APP_URL
      ? []
      : [
          {
            command: `npx vite --port ${APP_PORT} --strictPort`,
            url: APP_URL,
            env: { API_PROXY_TARGET: API_URL, VITE_API_URL: '' },
            reuseExistingServer: false,
            timeout: 60_000,
          },
        ]),
  ],
})
