# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Playwright end-to-end test suite for the Bellavita Organic e-commerce mobile web app (`https://bellavitaorganic.com`). All tests run exclusively on **iPhone 14 Pro** via mobile-chrome emulation.

## Commands

```bash
# Run all tests
npx playwright test

# Run a specific test file
npx playwright test tests/orderTest.spec.js
npx playwright test tests/shopAllTests.spec.js

# Run a single test by name
npx playwright test --grep "test name here"

# Run in headed mode (visible browser)
npx playwright test --headed

# Debug a test interactively
npx playwright test --debug

# View HTML test report after a run
npx playwright show-report reports/

# One-time Gmail OAuth setup (generates token.json)
node utils/gmailAuth.js
```

## Architecture

### Page Object Model (POM)

All UI interactions are encapsulated in `pages/`. Tests in `tests/` import page objects and only call their methods — no raw Playwright selectors in test files.

- **BasePage.js** — Base class providing shared helpers: scroll, safe click (falls back to JS click on failure), waits, text extraction, visibility checks, JS execution. All page objects extend this.
- **ShopAll.js** — Shop All Products listing page.
- **PDPPage.js** — Product Detail Page.
- **CartPage.js** — Shopping cart.
- **GoKwikFramePage.js** — Handles the GoKwik checkout embedded as an iframe; frame switching logic lives here.
- **OrderConfirmationPage.js** — Post-purchase confirmation page.

### Gmail OTP Integration

GoKwik checkout requires OTP verification. `utils/GmailUtility.js` polls Gmail for the OTP email after the checkout form triggers it. It filters by email timestamp to prevent stale OTPs from previous runs.

Initial setup requires running `node utils/gmailAuth.js` once to complete OAuth consent and create `token.json`. The `credentials.json` (Google OAuth client credentials) must already be present.

### Configuration

`playwright.config.js` is the single source of truth for:
- Base URL (`https://bellavitaorganic.com`)
- Device profile (iPhone 14 Pro)
- Timeouts (60s test, 10s expect)
- Artifacts: screenshots/videos/traces saved on failure to `test-results/`, HTML reports to `reports/`

### CI/CD

GitHub Actions (`.github/workflows/playwright.yml`) runs on push/PR to main/master, installs Playwright browsers, executes all tests, and uploads the HTML report artifact (30-day retention).

## Key Patterns

- **Frame handling**: GoKwik checkout runs inside an iframe. Always use `GoKwikFramePage` methods when interacting with checkout elements — never attempt to access GoKwik elements from outside the frame context.
- **Click fallback**: `BasePage` implements a safe click that catches failures and retries via `element.click()` JS. Use the base class method rather than raw `locator.click()` for flaky elements.
- **OTP polling**: `GmailUtility` polls with a configurable interval and timeout. If OTP tests fail intermittently, check Gmail API quota and the email timestamp filter window.
- **Network idle waits**: Page navigations use `waitUntil: 'networkidle'` for load stability on this heavily JS-rendered site.
