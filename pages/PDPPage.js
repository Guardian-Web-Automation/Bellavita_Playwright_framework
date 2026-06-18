const { BasePage } = require('./BasePage');

class PDPPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    // The ATC button lives inside the animated sticky bottom bar
    this.atcButton = page.locator('button.frag-sticky-atc');
  }

  async clickAddToCart() {
    // Scroll down to trigger the sticky bar — it starts with class "hidden"
    // and the site removes that class once the user scrolls past the fold
    await this.page.evaluate(() => window.scrollBy(0, 500));
    // Wait for the hidden class to be removed from the sticky wrapper
    await this.page.waitForSelector('animate-sticky.sticky-cart-wrapper:not(.hidden)', { timeout: 10_000 });
    await this.safeClick(this.atcButton);
  }

  getPageTitle() {
    return this.page.title();
  }
}

module.exports = { PDPPage };
