// utils/Logger.js
// Structured logger for Playwright terminal output.
// Every line shows a timestamp [HH:MM:SS.mmm].
// The test header automatically shows which spec file is running.
// Set NO_COLOR=1 or run in CI to strip ANSI codes.

const USE_COLOR =
  process.env.NO_COLOR !== '1' &&
  !process.env.CI &&
  !!process.stdout.isTTY;

const c = USE_COLOR
  ? {
      reset:  '\x1b[0m',
      bold:   '\x1b[1m',
      dim:    '\x1b[2m',
      green:  '\x1b[32m',
      red:    '\x1b[31m',
      yellow: '\x1b[33m',
      cyan:   '\x1b[36m',
      blue:   '\x1b[34m',
      gray:   '\x1b[90m',
    }
  : new Proxy({}, { get: () => '' });

const W = 66; // visible inner width of the test-header box

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the current wall-clock time as HH:MM:SS.mmm */
function ts() {
  const d  = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

/** Extracts the calling spec filename (e.g. shopAllTests.spec.js) from the stack. */
function callerSpec() {
  try {
    const lines = (new Error().stack || '').split('\n');
    for (const line of lines) {
      const m = line.match(/[/\\]tests[/\\]([^/\\]+\.spec\.js)/);
      if (m) return m[1];
    }
  } catch { /* ignore */ }
  return '';
}

/** Timestamp prefix shown on every action/assertion line. */
function pre() {
  return `${c.gray}[${ts()}]${c.reset}`;
}

// ── Logger ───────────────────────────────────────────────────────────────────

const Logger = {

  /**
   * Prints a box banner at the start of every test.
   * Automatically adds the spec filename as a second line inside the box.
   *   Logger.testStart(1, 'Shop All page loads with product grid');
   */
  testStart(num, name) {
    const file    = callerSpec();
    const bar     = '─'.repeat(W);
    const title   = ` TEST ${num}  ·  ${name} `;
    const padTitle = title.length <= W ? title.padEnd(W) : title.slice(0, W);

    console.log(`\n${c.cyan}${c.bold}┌${bar}┐`);
    console.log(`│${padTitle}│`);

    if (file) {
      const fileLabel = ` ${c.gray}${file}${c.reset}`;
      // Visible length = 1 (space) + file.length; pad the rest
      const spaces = ' '.repeat(Math.max(0, W - 1 - file.length));
      console.log(`│${fileLabel}${spaces}│`);
    }

    console.log(`└${bar}┘${c.reset}`);
  },

  /**
   * Section divider — groups steps inside a multi-phase test.
   *   Logger.section('Add product to cart');
   */
  section(title) {
    const upper = title.toUpperCase();
    const fill  = '─'.repeat(Math.max(2, W - upper.length - 4));
    console.log(`\n  ${c.blue}${c.bold}── ${upper} ${fill}${c.reset}`);
  },

  /**
   * Action step — use before every interaction (click, navigate, fill, wait).
   *   Logger.step('Clicking Filter button');
   */
  step(msg) {
    console.log(`  ${pre()}  ${c.yellow}→${c.reset}  ${msg}`);
  },

  /**
   * Assertion passed — use after every expect() that passes.
   *   Logger.pass('Filter panel opened successfully');
   */
  pass(msg) {
    console.log(`  ${pre()}  ${c.green}✔${c.reset}  ${msg}`);
  },

  /**
   * Soft warning — condition is acceptable but worth noting.
   *   Logger.warn('No BESTSELLER badges in current viewport');
   */
  warn(msg) {
    console.log(`  ${pre()}  ${c.yellow}⚠${c.reset}  ${c.yellow}${msg}${c.reset}`);
  },

  /**
   * Key/value info — surfaces runtime values (counts, URLs, text).
   *   Logger.info('Products found', 24);
   */
  info(label, value) {
    console.log(`  ${pre()}  ${c.gray}·${c.reset}  ${label}: ${c.bold}${String(value)}${c.reset}`);
  },

  /**
   * Success banner — use at the end of a successful order/checkout flow.
   *   Logger.success('ORDER PLACED SUCCESSFULLY');
   */
  success(msg) {
    const inner = `  ✅  ${msg}  `;
    const bar   = '═'.repeat(inner.length);
    console.log(`\n${c.green}${c.bold}  ╔${bar}╗`);
    console.log(`  ║${inner}║`);
    console.log(`  ╚${bar}╝${c.reset}\n`);
  },

};

module.exports = { Logger };
