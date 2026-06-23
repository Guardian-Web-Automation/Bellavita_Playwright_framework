// BasePage.js
// Base class for all page objects.
// Every page object extends this — gives them scroll, click, wait,
// and JS helpers without repeating code.
//
// Selenium → Playwright quick-reference:
//   WebDriver driver        → Page page
//   WebElement              → Locator  (lazy, never goes stale)
//   WebDriverWait           → built-in auto-wait on every action
//   JavascriptExecutor      → page.evaluate() / locator.evaluate()
//   element.getText()       → locator.textContent()
//   element.sendKeys(text)  → locator.fill(text)
//   Keys.RETURN             → locator.press('Enter')
//   element.isDisplayed()   → locator.isVisible()
//   Assert.assertEquals     → expect(actual).toBe(expected)

class BasePage {

  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    if (!page) {
      throw new Error('Page cannot be null — check your test setup.');
    }
    this.page = page;
  }

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  async navigateTo() {
    await this.page.goto('/collections/shop-all-products');
    // await this.waitForPageLoad();
  }

  getPageTitle() {
    return this.page.title();
  }

  getCurrentUrl() {
    return this.page.url();
  }

  // ==========================================================
  // SCROLL OPERATIONS
  // ==========================================================

  /**
   * Scrolls a locator into the centre of the viewport.
   * Replaces: jsExecutor.executeScript("arguments[0].scrollIntoView(true)")
   * @param {import('@playwright/test').Locator} locator
   */
  async scrollToElement(locator) {
    try {
      await locator.scrollIntoViewIfNeeded();
    } catch (e) {
      console.warn(`scrollToElement failed: ${e.message}`);
    }
  }

  async scrollToTop() {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  // ==========================================================
  // CLICK OPERATIONS
  // ==========================================================

  /**
   * Standard click — Playwright auto-waits for the element to be
   * visible, stable, and enabled before clicking.
   * No explicit WebDriverWait needed here.
   * @param {import('@playwright/test').Locator} locator
   */
  async safeClick(locator) {
    try {
      await locator.click();
      console.log(`Clicked on element: ${locator}`);
    } catch (e) {
      console.warn(`safeClick failed, trying JS click: ${e.message}`);
      await this.jsClick(locator);
    }
  }

  /**
   * JavaScript click — use when an element is behind an overlay
   * or Playwright's actionability checks keep blocking.
   * Replaces: jsExecutor.executeScript("arguments[0].click()")
   * @param {import('@playwright/test').Locator} locator
   */
  async jsClick(locator) {
    try {
      await locator.scrollIntoViewIfNeeded();
      await locator.evaluate(el => el.click());
    } catch (e) {
      console.error(`jsClick failed: ${e.message}`);
      throw e;
    }
  }

  /**
   * Scroll into view then click.
   * @param {import('@playwright/test').Locator} locator
   */
  async scrollAndClick(locator) {
    try {
      await this.scrollToElement(locator);
      await locator.click();
    } catch (e) {
      console.warn(`scrollAndClick failed, trying JS click: ${e.message}`);
      await this.jsClick(locator);
    }
  }

  // ==========================================================
  // WAIT OPERATIONS
  // ==========================================================

  /**
   * Wait for a locator to become visible.
   * Replaces: wait.until(ExpectedConditions.visibilityOf(element))
   * @param {import('@playwright/test').Locator} locator
   * @param {number} [timeout] optional ms override, default 15000
   */
  async waitForVisibility(locator, timeout) {
    try {
      await locator.waitFor({ state: 'visible', timeout: timeout ?? 15_000 });
    } catch (e) {
      console.error(`waitForVisibility timed out: ${e.message}`);
    }
  }

  /**
   * Wait for a locator to become hidden or detached.
   * @param {import('@playwright/test').Locator} locator
   */
  async waitForInvisibility(locator) {
    try {
      await locator.waitFor({ state: 'hidden', timeout: 15_000 });
    } catch (e) {
      console.error(`waitForInvisibility timed out: ${e.message}`);
    }
  }

  /**
   * Wait for the URL to contain a specific substring.
   * Replaces: wait.until(ExpectedConditions.urlContains(s))
   * @param {string} substring
   */
  async waitForUrlToContain(substring) {
    await this.page.waitForURL(`**${substring}**`, { timeout: 15_000 });
  }

  /**
   * Wait for page network to go idle.
   * Replaces: document.readyState === 'complete' JS poll.
   */
  async waitForPageLoad() {
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 30_000 });
    } catch (e) {
      console.warn(`waitForPageLoad timed out, continuing`);
    }
  }

  /**
   * Short pause — use sparingly, only for CSS animations that
   * Playwright's auto-waiting cannot detect.
   * Replaces: Thread.sleep(ms)
   * @param {number} ms
   */
  async pause(ms) {
    await this.page.waitForTimeout(ms);
  }

  // ==========================================================
  // TEXT INPUT OPERATIONS
  // ==========================================================

  /**
   * Clear a field and type new text.
   * Replaces: element.clear() + element.sendKeys(text)
   * @param {import('@playwright/test').Locator} locator
   * @param {string} text
   */
  async typeText(locator, text) {
    try {
      await locator.waitFor({ state: 'visible' });
      await locator.clear();
      await locator.fill(text);
    } catch (e) {
      console.error(`typeText failed: ${e.message}`);
      throw e;
    }
  }

  // ==========================================================
  // VISIBILITY / STATE CHECKS
  // ==========================================================

  /**
   * @param {import('@playwright/test').Locator} locator
   * @returns {Promise<boolean>}
   */
  async isElementDisplayed(locator) {
    try {
      return await locator.isVisible();
    } catch (e) {
      return false;
    }
  }

  /**
   * @param {import('@playwright/test').Locator} locator
   * @returns {Promise<boolean>}
   */
  async isElementEnabled(locator) {
    try {
      return await locator.isEnabled();
    } catch (e) {
      return false;
    }
  }

  // ==========================================================
  // JAVASCRIPT HELPERS
  // ==========================================================

  /**
   * Run arbitrary JavaScript on the page.
   * Replaces: jsExecutor.executeScript(script, args)
   * @param {string|Function} script
   * @param {*} [arg] single argument passed to the script
   */
  async executeJS(script, arg) {
    try {
      return await this.page.evaluate(script, arg);
    } catch (e) {
      console.error(`executeJS failed: ${e.message}`);
      return null;
    }
  }

  // ==========================================================
  // TEXT EXTRACTION
  // ==========================================================

  /**
   * Scroll to element, wait for visibility, return its trimmed text.
   * @param {import('@playwright/test').Locator} locator
   * @returns {Promise<string>}
   */
  async scrollAndGetText(locator) {
    try {
      await this.scrollToElement(locator);
      await locator.waitFor({ state: 'visible' });
      return (await locator.textContent()).trim();
    } catch (e) {
      console.error(`scrollAndGetText failed: ${e.message}`);
      return '';
    }
  }

}

module.exports = { BasePage };