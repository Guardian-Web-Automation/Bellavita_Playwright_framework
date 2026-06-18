// @ts-check
require('dotenv').config(); // loads .env for local runs; no-op in CI (env vars injected by Actions)
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({

  // ============================================================
  // WHERE TESTS LIVE
  // ============================================================
  testDir: './tests',

  // Glob pattern — only files ending in .spec.js are picked up
  testMatch: '**/*.spec.js',

  // ============================================================
  // GLOBAL TEST BEHAVIOUR
  // ============================================================

  // Max time a single test can take before it is force-failed
  timeout: 60_000,           // 60 seconds per test

  // Max time expect() / assertions wait for a condition to be true
  expect: {
    timeout: 10_000,         // 10 seconds
  },

  // How many times to retry a failed test before marking it failed
  // 0 in headed/local, 1 in CI (set via env var below)
  retries: process.env.CI ? 1 : 0,

  // Run test FILES in parallel; tests within a file run serially
  // (safe default — avoids cart/session conflicts between tests)
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,

  // Fail the whole suite immediately if this many tests fail
  // Useful in CI to avoid burning time when something is fundamentally broken
  maxFailures: process.env.CI ? 10 : undefined,

  // ============================================================
  // REPORTERS
  // Playwright generates its own HTML report — no Extent needed
  // ============================================================
  reporter: [
    ['list'],                              // live console output while running
    ['html', {
      outputFolder: 'reports',            // matches your /reports folder
      open: 'never',                      // don't auto-open; run `npx playwright show-report` manually
    }],
    // Uncomment below to also get a JUnit XML (useful for some CI dashboards)
    // ['junit', { outputFile: 'reports/results.xml' }],
  ],

  // ============================================================
  // SHARED SETTINGS — applied to every project unless overridden
  // ============================================================
  use: {
    // Base URL — all page.goto('/') calls resolve to this
    // navigateTo() in BasePage uses '/' which becomes this full URL
    baseURL: 'https://bellavitaorganic.com',

    // How long to wait for navigation (page.goto, clicks that trigger nav)
    navigationTimeout: 30_000,

    // How long individual actions (click, fill, locator.waitFor) wait
    actionTimeout: 15_000,

    // Always capture a screenshot on failure — saved in test-results/
    screenshot: 'only-on-failure',

    // Record a video only when a test fails (helps with debugging)
    video: 'retain-on-failure',

    // Capture a full DOM snapshot on failure (viewable in HTML report)
    trace: 'retain-on-failure',

    // Always run headless unless you pass --headed flag
    headless: true,

    // Ignore HTTPS certificate errors (useful for staging/dev environments)
    ignoreHTTPSErrors: true,
  },

  // ============================================================
  // PROJECTS — Desktop and Mobile
  // Each project runs the full test suite with its own viewport
  // ============================================================
  projects: [

  {
  name: 'mobile-chrome',
  use: {
    browserName: 'chromium',
    viewport: { width: 460, height: 740 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  }
},
// {
//     name: 'desktop-chrome',
//     use: {
//       browserName: 'chromium',
//       viewport: { width: 1440, height: 900 },
//       isMobile: false,
//       hasTouch: false,
//     },
//   },

  ],

  // ============================================================
  // OUTPUT FOLDERS
  // ============================================================

  // Where Playwright puts videos, traces, and screenshots
  outputDir: 'test-results',

});