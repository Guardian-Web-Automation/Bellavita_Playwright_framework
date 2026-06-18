const { fetchGokwikOtp } = require('../utils/GmailUtility');
class GoKwikFramePage {
  /**
   * @param {import('@playwright/test').FrameLocator} frameLocator
   * @param {import('@playwright/test').Page} page
   * 
   */
  
  constructor(frameLocator, page) {
    if (!frameLocator) throw new Error('frameLocator is required');
    this.frame = frameLocator;
    this.page = page;
    this.phoneInput = frameLocator.locator('#phone-input');
    this.otpInput = frameLocator.locator('input[maxlength="4"][autocomplete="one-time-code"]');
    this.codOption = frameLocator.locator('[data-testid="payment-method-cod"]');
    this.codOptionConfirmButton = frameLocator.locator('//div[contains(@class,"cod-confirmation-container")]//button[contains(text(),"Confirm")]');
    this.codOptionCancelButton = frameLocator.locator('//div[contains(@class,"cod-confirmation-container")]//button[contains(text(),"Cancel")]');
    this.codOptionConfirmationContainer = frameLocator.locator('//div[contains(@class,"cod-confirmation-container")]');
  }

  async enterPhone(phone) {
    await this.phoneInput.waitFor({ state: 'visible' });
    await this.phoneInput.click();
    await this.phoneInput.fill(phone);
  }

  async enterOtp(otp) {
    await this.otpInput.waitFor({ state: 'visible' });
    await this.otpInput.click();
    await this.otpInput.fill(otp);
  }

  async selectCod() {
    await this.codOption.waitFor({ state: 'visible' });
    await this.codOption.scrollIntoViewIfNeeded();
    await this.codOption.click();
  }

  static async switchToGokwik(page) {
    if (!page) throw new Error('Page is required to switch to GoKwik iframe');
    await page.waitForSelector('#gokwik-iframe, .gokwik-iframe', { timeout: 20_000 });
    const frameLocator = page.frameLocator('#gokwik-iframe, .gokwik-iframe');
    return new GoKwikFramePage(frameLocator, page);
  }

  async completeCheckout(phoneNumber) {
    await this.enterPhone(phoneNumber);
    const otpRequestedAt = Date.now();
    const otp = await fetchGokwikOtp({ maxWaitMs: 40000, pollIntervalMs: 3000, after: otpRequestedAt });
    await this.enterOtp(otp);
    await this.selectCod();
    await this.handleCodConfirmation();
  }

  async handleCodConfirmation() {
    const confirmationContainer = this.codOptionConfirmationContainer;
    const appeared = await confirmationContainer.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
    if (!appeared) return;
    const confirmBtn = this.codOptionConfirmButton;
    await confirmBtn.click();
  }
}

module.exports = { GoKwikFramePage };
