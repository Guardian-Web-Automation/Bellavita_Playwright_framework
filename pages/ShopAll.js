const { BasePage } = require('./BasePage');

class ShopAll extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    // Existing locators
    this.atcButton = page.locator('//*[@id="product-grid"]/li/div/div/div/add-to-cart[2]');
    this.productLink = page.locator('//li[@class="grid__item"]/div/use-animate/a');

    // New locators for Shop All page tests
    this.productGridContainer = page.locator('//div[@id="ProductGridContainer"]');
    this.categoryPillsContainer = page.locator('//div[@class="plp-category-pills"]');
    this.categoryTabButton = (tabName) => page.locator(`//div[@class="plp-category-pills"]/button[contains(text(),'${tabName}')]`);
    this.activeTab = page.locator('//button[@class="plp-category-pill active"]');
    this.productCards = page.locator('//li[@class="grid__item"]');
    this.bestsellerBadge = page.locator('//div[@class="plp-badge-bestseller"]//span[contains(text(),"BESTSELLER")]').first();
    this.soldOutButton = page.locator('//li[@class="grid__item"]//button[contains(translate(normalize-space(text()), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "sold out")]');
    this.filterButton = page.locator('//button[@class="plp-filter-btn"]');
    this.sortButton = page.locator('//button[@class="plp-sort-btn"]');
    this.filterPanel = page.locator('//div[@class="plp-filter-content"]');
    this.sortPanel = page.locator('//div[@class="plp-sheet-content"]');

    // === FILTER PANEL - new locators ===
    // ⚠ VERIFY #1: left sidebar section nav — are these <li> directly under plp-filter-content?
    this.filterSectionNavItem = (sectionName) =>
      page.locator(`//div[@class="plp-category-list"]/button[contains(@class,"plp-filter-category")]//span[contains(text(),"${sectionName}")]`);

    // ⚠ VERIFY #2: close (×) button — check actual class or aria-label
    this.filterClosePanelBtn = page.locator(
      '//div[@class="plp-filter-content"]//button[contains(@class,"close")]'
    );

    // text-based — should work without DOM inspection
    this.resetFiltersBtn = page.locator('//button[contains(normalize-space(.),"Reset Filters")]').nth(1);
    this.applyFiltersBtn = page.locator('//div[@class="plp-filter-footer"]//button[contains(normalize-space(.),"Apply Filters")]');

    // ⚠ VERIFY #3: active filter count badge on the Filter button (shows "1", "2" …)
    this.filterActiveBadge = page.locator('//div[@class="plp-active-filters"]//span');

    // ⚠ VERIFY #4: price From input — check placeholder / id / name attribute
    this.priceFromInput = page.locator('//div[@class="plp-price-field"]//input').nth(0);

    // ⚠ VERIFY #5: price To input — second input inside the filter panel
    this.priceToInput = page.locator('//div[@class="plp-price-field"]//input').nth(1);

    // All option labels visible in the right panel (used to count/read options)
    this.allFilterOptionLabels = page.locator('//div[@class="plp-filter-content"]//label');
  }

  async navigateTo() {
    await super.navigateTo();
    // await this.waitForPageLoad();
  }

  // ====== PRODUCT GRID VERIFICATION ======

  /**
   * Verify that the product grid container is displayed
   */
  async isProductGridLoaded() {
    return await this.isElementDisplayed(this.productGridContainer);
  }

  /**
   * Get the count of visible product cards
   */
  async getProductGridCount() {
    return await this.productCards.count();
  }

  // ====== CATEGORY FILTER VERIFICATION ======

  /**
   * Verify that category filter tabs are rendered
   */
  async areCategoryTabsDisplayed() {
    return await this.isElementDisplayed(this.categoryPillsContainer);
  }

  /**
   * Get all category tab names
   */
  async getCategoryTabNames() {
    const tabs = this.page.locator('//div[@class="plp-category-pills"]/button');
    return await tabs.allTextContents();
  }

  /**
   * Click on a specific category tab by name
   */
  async clickCategoryTab(tabName) {
    const tab = this.categoryTabButton(tabName);
    await this.scrollToElement(tab);
    await this.waitForVisibility(tab);
    await this.safeClick(tab);
    await this.page.waitForTimeout(1500); // Wait for products to filter
  }

  /**
   * Get the currently active category tab name
   */
  async getActiveTabName() {
    await this.waitForVisibility(this.activeTab);
    return await this.scrollAndGetText(this.activeTab);
  }

  /**
   * Verify category tab is active by name
   */
  async isTabActive(tabName) {
    const activeTabName = await this.getActiveTabName();
    return activeTabName.includes(tabName);
  }

  // ====== PRODUCT CARD VERIFICATION ======

  /**
   * Verify BESTSELLER badge is displayed on products
   */
  async isBestsellerBadgeDisplayed() {
    try {
      await this.scrollToElement(this.bestsellerBadge);
      return await this.bestsellerBadge.isVisible({ timeout: 5000 });
    } catch (e) {
      return false;
    }
  }

  /**
   * Get BESTSELLER badge count
   */
  async getBestsellerBadgeCount() {
    const badges = this.page.locator('//div[@class="plp-badge-bestseller"]//span[contains(text(),"BESTSELLER")]');
    return await badges.count();
  }

  /**
   * Get product name at index
   */
  async getProductNameByIndex(index) {
    const productName = this.page.locator('//li[@class="grid__item"]//a[contains(@class,"card-information__text")]').nth(index);
    await this.scrollToElement(productName);
    return await this.scrollAndGetText(productName);
  }

  /**
   * Get product price at index
   */
  async getProductPriceByIndex(index) {
    const priceElement = this.page.locator('//li[@class="grid__item"]//span[@class="price-item price-item--sale"]//span[@class="money"]').nth(index);
    await this.scrollToElement(priceElement);
    return await this.scrollAndGetText(priceElement);
  }

  /**
   * Get product MRP (original price) at index
   */
  async getProductMRPByIndex(index) {
    const mrpElement = this.page.locator('//li[@class="grid__item"]//dd[@class="price__compare"]//span[@class="money"]').nth(index);
    try {
      await this.scrollToElement(mrpElement);
      return await this.scrollAndGetText(mrpElement);
    } catch (e) {
      return 'N/A';
    }
  }

  /**
   * Get savings amount at index
   */
  async getSavingsAmountByIndex(index) {
    const savingsElement = this.page.locator('//li[@class="grid__item"]//div[@class="plp-savings"]//span[@class="money"]').nth(index);
    try {
      await this.scrollToElement(savingsElement);
      return await this.scrollAndGetText(savingsElement);
    } catch (e) {
      return 'N/A';
    }
  }

  /**
   * Get product rating at index
   */
  async getProductRatingByIndex(index) {
    const ratingElement = this.page.locator('//li[@class="grid__item"]//div[@class="rating"]//span[contains(@class,"rating-text")]').nth(index);
    try {
      await this.scrollToElement(ratingElement);
      return await this.scrollAndGetText(ratingElement);
    } catch (e) {
      return 'N/A';
    }
  }

  /**
   * Verify Bellacash earning label is visible on product card
   */
  async isBellacashEarningVisible() {
    try {
      const bellacashElement = this.page.locator('//li[@class="grid__item"]//div[@class="plp-bellacash"]').first();
      return await bellacashElement.isVisible({ timeout: 5000 });
    } catch (e) {
      return false;
    }
  }

  /**
   * Get Bellacash earning amount at index
   */
  async getBellacashAmountByIndex(index) {
    const bellacashElement = this.page.locator('//li[@class="grid__item"]//div[@class="plp-bellacash"]//span[@class="money"]').nth(index);
    try {
      await this.scrollToElement(bellacashElement);
      return await this.scrollAndGetText(bellacashElement);
    } catch (e) {
      return 'N/A';
    }
  }

  // ====== ADD TO CART & SOLD OUT VERIFICATION ======

  /**
   * Verify Add to Cart button is visible and clickable for in-stock product
   */
  async isAddToCartButtonVisibleByIndex(index) {
    const atcBtn = this.atcButton.nth(index);
    try {
      await this.scrollToElement(atcBtn);
      return await atcBtn.isVisible({ timeout: 5000 });
    } catch (e) {
      return false;
    }
  }

  /**
   * Click Add to Cart button for product at index
   */
  async clickAddToCartByIndex(index) {
    const atcBtn = this.atcButton.nth(index);
    await this.scrollAndClick(atcBtn);
    await this.page.waitForTimeout(1500); // Wait for cart update
  }

  /**
   * Get sold-out button count
   */
  async getSoldOutButtonCount() {
    return await this.soldOutButton.count();
  }

  /**
   * Verify SOLD OUT button is displayed and disabled
   */
  async isSoldOutButtonDisplayedByIndex(index) {
    const soldOutBtn = this.soldOutButton.nth(index);
    try {
      await this.scrollToElement(soldOutBtn);
      return await soldOutBtn.isVisible({ timeout: 5000 });
    } catch (e) {
      return false;
    }
  }

  /**
   * Verify SOLD OUT button is disabled (not clickable)
   */
  async isSoldOutButtonDisabledByIndex(index) {
    const soldOutBtn = this.soldOutButton.nth(index);
    try {
      await this.scrollToElement(soldOutBtn);
      return !(await soldOutBtn.isEnabled());
    } catch (e) {
      return false;
    }
  }

  // ====== PRODUCT CARD IMAGE & NAVIGATION ======

  /**
   * Verify product card image is visible at index
   */
  async isProductImageVisibleByIndex(index) {
    const productImg = this.page.locator('//li[@class="grid__item"]//img').nth(index);
    try {
      await this.scrollToElement(productImg);
      return await productImg.isVisible({ timeout: 5000 });
    } catch (e) {
      return false;
    }
  }

  /**
   * Click on product card image to navigate to PDP
   */
  async clickProductImageByIndex(index) {
    const productImg = this.page.locator('//li[@class="grid__item"]//img').nth(index);
    await this.scrollAndClick(productImg);
    // await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify clicking product navigates to PDP URL
   */
  async verifyNavigatedToPDP() {
    const currentUrl = this.getCurrentUrl();
    return currentUrl.includes('/products/');
  }

  async clickFirstProductToPDP() {
    const firstProduct = this.productLink.first();
    await firstProduct.waitFor({ state: 'visible', timeout: 15_000 });
    await this.scrollToElement(firstProduct);
    await this.safeClick(firstProduct);
    // await this.page.waitForLoadState('networkidle');
  }

  // ====== FILTER & SORT PANEL VERIFICATION ======

  /**
   * Verify filter button is visible and clickable
   */
  async isFilterButtonVisible() {
    return await this.isElementDisplayed(this.filterButton);
  }

  /**
   * Click filter button to open filter panel
   */
  async clickFilterButton() {
    await this.scrollAndClick(this.filterButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify filter panel opens
   */
  async isFilterPanelOpened() {
    await this.waitForVisibility(this.filterPanel);
    return await this.isElementDisplayed(this.filterPanel);
  }

  /**
   * Verify sort button is visible and clickable
   */
  async isSortButtonVisible() {
    return await this.isElementDisplayed(this.sortButton);
  }

  /**
   * Click sort button to open sort panel
   */
  async clickSortButton() {
    await this.scrollAndClick(this.sortButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify sort panel opens
   */
  async isSortPanelOpened() {
    await this.waitForVisibility(this.sortPanel);
    return await this.isElementDisplayed(this.sortPanel);
  }

  // ====== HELPER METHODS ======

  /**
   * Add product to cart by index
   */
  async addProductToCartByIndex(index) {
    const itemAtc = this.atcButton.nth(index);
    await itemAtc.scrollIntoViewIfNeeded();
    await itemAtc.waitFor({ state: 'visible', timeout: 15_000 });
    await this.safeClick(itemAtc);
    await this.page.waitForTimeout(2000);
  }

  async addFirstProductToCart() {
    await this.addProductToCartByIndex(0);
  }

  async addSecondProductToCart() {
    await this.addProductToCartByIndex(1);
  }

  // ====== FILTER SECTION NAVIGATION ======

  async isFilterSectionNavVisible(sectionName) {
    return await this.isElementDisplayed(this.filterSectionNavItem(sectionName));
  }

  async clickFilterSectionNav(sectionName) {
    const nav = this.filterSectionNavItem(sectionName);
    await this.scrollToElement(nav);
    await this.safeClick(nav);
    await this.page.waitForTimeout(500);
  }

  async selectFilterSectionAndOption(sectionName, optionText) {
    const option = this.filterOptionLabel(sectionName, optionText);
    await this.scrollToElement(option);
    await this.safeClick(option);
    await this.page.waitForTimeout(300);
  }

  filterOptionLabel(groupName, optionText) {
    return this.page.locator(`//h3[@class="plp-filter-group-title" and contains(text(),"${groupName}")]//..//label//span[@class="plp-option-label" and text()="${optionText}"]`);
  }

  filterOptionInput(groupName, optionText) {
    return this.page.locator(`//h3[@class="plp-filter-group-title" and contains(text(),"${groupName}")]//..//label[.//span[@class="plp-option-label" and text()="${optionText}"]]//input`);
  }

  // ====== FILTER HEADER CONTROLS ======

  async closeFilterPanel() {
    await this.safeClick(this.filterClosePanelBtn);
    await this.page.waitForTimeout(500);
  }

  async clickResetFilters() {
    await this.scrollToElement(this.resetFiltersBtn);
    await this.safeClick(this.resetFiltersBtn);
    await this.page.waitForTimeout(1000);
  }

  async clickApplyFilters() {
    await this.scrollToElement(this.applyFiltersBtn);
    await this.safeClick(this.applyFiltersBtn);
    await this.page.waitForTimeout(2500);
  }

  async isApplyFiltersButtonEnabled() {
    return await this.isElementEnabled(this.applyFiltersBtn);
  }

  async isFilterPanelClosed() {
    try {
      return !(await this.filterPanel.isVisible({ timeout: 3000 }));
    } catch {
      return true;
    }
  }

  // ====== ACTIVE FILTER BADGE ======

  async isFilterBadgeVisible() {
    try {
      return await this.filterActiveBadge.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  async getFilterBadgeText() {
    try {
      if (!(await this.filterActiveBadge.isVisible({ timeout: 2000 }))) return '0';
      return (await this.filterActiveBadge.textContent())?.trim()??'0';
    } catch {
      return '0';
    }
  }

  async getBadgeCount() {
    try {
      const spans = this.page.locator('//div[@class="plp-active-filters"]//span');
      return await spans.count();
    } catch {
      return 0;
    }
  }

  // ====== PRICE FILTER ======

  async fillPriceFrom(value) {
    await this.scrollToElement(this.priceFromInput);
    await this.typeText(this.priceFromInput, String(value));
  }

  async fillPriceTo(value) {
    await this.scrollToElement(this.priceToInput);
    await this.typeText(this.priceToInput, String(value));
  }

  async getPriceFromValue() {
    return await this.priceFromInput.inputValue();
  }

  async getPriceToValue() {
    return await this.priceToInput.inputValue();
  }

  // ====== FILTER OPTIONS ======

  async isFilterOptionSelected(sectionName, optionText) {
    try {
      const checkbox = this.filterOptionInput(sectionName, optionText);
      return await checkbox.isChecked();
    } catch {
      return false;
    }
  }

  async getAllFilterOptionTexts() {
    return await this.allFilterOptionLabels.allTextContents();
  }

  async getVisibleFilterOptionCount() {
    return await this.allFilterOptionLabels.count();
  }

  // ====== GRID SOLD-OUT HELPERS ======

  async countSoldOutProductsOnGrid() {
    return await this.soldOutButton.count();
  }

  async hasAnySoldOutProductsOnGrid() {
    return (await this.soldOutButton.count()) > 0;
  }

 
}

module.exports = { ShopAll };
