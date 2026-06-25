// @ts-check
require('dotenv').config();
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({

  // ── Where tests live ──────────────────────────────────────────
  testDir:   './tests',
  testMatch: '**/*.spec.js',

  // ── Global test behaviour ─────────────────────────────────────
  timeout: 60_000,
  expect:  { timeout: 10_000 },

  retries:        process.env.CI ? 1 : 0,
  fullyParallel:  false,
  workers:        process.env.CI ? 2 : 1,
  maxFailures:    process.env.CI ? 10 : undefined,

  // ── Reporters ─────────────────────────────────────────────────
  reporter: [
    ['html',  { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile:  'playwright-report/results.xml'     }],
    ['list'],
  ],

  // ── Shared settings ───────────────────────────────────────────
  use: {
    baseURL:           'https://bellavitaorganic.com',
    navigationTimeout: 30_000,
    actionTimeout:     15_000,
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    trace:             'retain-on-failure',
    headless:          true,
    ignoreHTTPSErrors: true,
  },

  // ── Projects ──────────────────────────────────────────────────
  projects: [
    {
      name: 'mobile-chrome',
      use: {
        ...devices['iPhone 14 Pro'],
        browserName: 'chromium',   // iPhone 14 Pro defaults to webkit; force chromium
      },
    },
    // {
    //   name: 'desktop-chrome',
    //   use: {
    //     browserName: 'chromium',
    //     viewport: { width: 1440, height: 900 },
    //   },
    // },
  ],

  // ── Output folders ────────────────────────────────────────────
  outputDir: 'test-results',

});