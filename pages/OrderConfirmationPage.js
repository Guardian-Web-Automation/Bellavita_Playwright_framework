const { expect } = require('@playwright/test');
const { Logger } = require('../utils/Logger');

class OrderConfirmationPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    if (!page) throw new Error('Page is required');
    this.page = page;
    this.trackOrderLabel = page.locator('//span[contains(text(),"Track Order")]').first();
    this.orderIdLabel = page.locator('//h1[contains(text(),"Order")]').first();
  }

  async assertOrderSuccess() {
    await this.trackOrderLabel.waitFor({ state: 'visible', timeout: 15_000 });
    expect(await this.trackOrderLabel.isVisible()).toBeTruthy();
    Logger.pass('Track your order visible');

    await this.orderIdLabel.waitFor({ state: 'visible', timeout: 15_000 });
    expect(await this.orderIdLabel.isVisible()).toBeTruthy();
  }

  async getOrderIdText() {
    return (await this.orderIdLabel.textContent()).trim();
  }
}

module.exports = { OrderConfirmationPage };