class CartPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    if (!page) throw new Error('Page is required');
    this.page = page;
    this.checkoutButton = page.locator('(//div[@class="gokwik-checkout"]/button)[2]');
    this.cartItems = page.locator('//form[@id="cart"]//cart-items/ul/li');
    this.cartCloseButton = page.locator('//drawer-close-button[@class="header__icon header__icon--summary header__icon--cart"]');
  }

  async clickCheckout() {
    await this.checkoutButton.waitFor({ state: 'visible', timeout: 15_000 });
    await this.checkoutButton.click();
  }

  async getCartItemCount() {
    await this.cartItems.first().waitFor({ state: 'visible', timeout: 15_000 });
    return await this.cartItems.count();
  }

  async closeCart() {
    await this.cartCloseButton.waitFor({ state: 'visible', timeout: 15_000 });
    await this.cartCloseButton.click();
  }
}

module.exports = { CartPage };