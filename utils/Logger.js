// utils/Logger.js
// Structured, colourised logger for Playwright terminal output.
// Set env var NO_COLOR=1 to strip all ANSI codes (useful for plain CI logs).

const USE_COLOR = process.env.NO_COLOR !== '1';

const c = USE_COLOR
  ? {
      reset:   '\x1b[0m',
      bold:    '\x1b[1m',
      dim:     '\x1b[2m',
      green:   '\x1b[32m',
      red:     '\x1b[31m',
      yellow:  '\x1b[33m',
      cyan:    '\x1b[36m',
      blue:    '\x1b[34m',
      gray:    '\x1b[90m',
    }
  : new Proxy({}, { get: () => '' });

const W = 66; // inner width of the test-header box

const Logger = {

  // ── Test header ──────────────────────────────────────────────────
  // Prints a box banner at the start of every test.
  //   Logger.testStart(1, 'Shop All page loads with product grid');
  testStart(num, name) {
    const content = ` TEST ${num}  ·  ${name} `;
    const padded  = content.length <= W ? content.padEnd(W) : content.slice(0, W);
    const bar     = '─'.repeat(W);
    console.log(`\n${c.cyan}${c.bold}┌${bar}┐`);
    console.log(`│${padded}│`);
    console.log(`└${bar}┘${c.reset}`);
  },

  // ── Section divider ───────────────────────────────────────────────
  // Groups steps inside a test (e.g. multi-phase flows).
  //   Logger.section('Add product to cart');
  section(title) {
    const upper = title.toUpperCase();
    const fill  = '─'.repeat(Math.max(2, W - upper.length - 4));
    console.log(`\n  ${c.blue}${c.bold}── ${upper} ${fill}${c.reset}`);
  },

  // ── Action step ───────────────────────────────────────────────────
  // Use before every interaction (click, navigate, fill, wait).
  //   Logger.step('Clicking Filter button');
  step(msg) {
    console.log(`  ${c.yellow}→${c.reset}  ${msg}`);
  },

  // ── Assertion passed ──────────────────────────────────────────────
  // Use after every expect() that passes.
  //   Logger.pass('Filter panel opened successfully');
  pass(msg) {
    console.log(`  ${c.green}✔${c.reset}  ${msg}`);
  },

  // ── Soft warning ──────────────────────────────────────────────────
  // Use when a condition is acceptable but worth noting (not a failure).
  //   Logger.warn('No BESTSELLER badges in current viewport');
  warn(msg) {
    console.log(`  ${c.yellow}⚠${c.reset}  ${c.yellow}${msg}${c.reset}`);
  },

  // ── Key/value info ────────────────────────────────────────────────
  // Use to surface runtime values (counts, URLs, text).
  //   Logger.info('Products found', 24);
  info(label, value) {
    console.log(`  ${c.gray}·${c.reset}  ${label}: ${c.bold}${String(value)}${c.reset}`);
  },

  // ── Success banner ────────────────────────────────────────────────
  // Use at the end of a fully successful order/checkout flow.
  //   Logger.success('ORDER PLACED SUCCESSFULLY');
  success(msg) {
    const inner = `  ✅  ${msg}  `;
    const bar   = '═'.repeat(inner.length);
    console.log(`\n${c.green}${c.bold}  ╔${bar}╗`);
    console.log(`  ║${inner}║`);
    console.log(`  ╚${bar}╝${c.reset}\n`);
  },
};

module.exports = { Logger };
