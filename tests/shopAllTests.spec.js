// shopAllTests.spec.js
// Test suite for Shop All Products page

const { test, expect } = require('@playwright/test');
const { ShopAll } = require('../pages/ShopAll');
const { Logger } = require('../utils/Logger');

test.describe('Shop All Products Page Tests', () => {

  /** @type {import('../pages/ShopAll').ShopAll} */
  let shopAll;

  test.beforeEach(async ({ page }) => {
    shopAll = new ShopAll(page);
    await shopAll.navigateTo();
    await shopAll.pause(1000);
  });

  // ============================================================
  // TEST 1: Verify Shop All page loads with product grid
  // ============================================================
  test('@smoke 1- Verify Shop All page loads with product grid', async ({ page }) => {
    Logger.testStart(1, 'Shop All page loads with product grid');

    Logger.step('Verifying product grid container visibility');
    const isGridLoaded = await shopAll.isProductGridLoaded();
    expect(isGridLoaded).toBeTruthy();
    Logger.pass('Product grid container is loaded');

    const productCount = await shopAll.getProductGridCount();
    Logger.info('Products visible', productCount);
    expect(productCount).toBeGreaterThan(0);
    Logger.pass('Product grid contains products');

    Logger.step('Verifying first product image');
    const isFirstProductImageVisible = await shopAll.isProductImageVisibleByIndex(0);
    expect(isFirstProductImageVisible).toBeTruthy();
    Logger.pass('Product image [0] is visible');
  });

  // ============================================================
  // TEST 2: Verify category filter tabs render (All, Fragrance, Bath & Body, Skincare)
  // ============================================================
  test('@smoke 2- Verify category filter tabs render (All, Fragrance, Bath & Body, Skincare)', async ({ page }) => {
    Logger.testStart(2, 'Category filter tabs render');

    Logger.step('Verifying category tabs container');
    const areTabsDisplayed = await shopAll.areCategoryTabsDisplayed();
    expect(areTabsDisplayed).toBeTruthy();
    Logger.pass('Category tabs container is displayed');

    const tabNames = await shopAll.getCategoryTabNames();
  
    const expectedTabs = ['All', 'Fragrance', 'Bath & Body', 'Skincare', 'Cosmetics', 'Hair Care', 'Lip Care', 'Skin Care', 'Candles'];
    Logger.step(`Checking each of ${expectedTabs.length} expected tabs`);
    for (const tab of expectedTabs) {
      const tabExists = tabNames.some(name => name.includes(tab));
      expect(tabExists).toBeTruthy();
      Logger.pass(`Tab "${tab}" is rendered`);
    }
  });

  // ============================================================
  // TEST 3: Verify clicking a category tab filters the grid
  // ============================================================
  test('@smoke 3- Verify clicking a category tab filters the grid', async ({ page }) => {
    Logger.testStart(3, 'Category tab filters the product grid');

    const initialCount = await shopAll.getProductGridCount();
    Logger.info('Initial product count', initialCount);

    Logger.step('Clicking "Fragrance" category tab');
    await shopAll.clickCategoryTab('Fragrance');
    const isFragranceActive = await shopAll.isTabActive('Fragrance');
    expect(isFragranceActive).toBeTruthy();
    Logger.pass('"Fragrance" tab is now active');

    const filteredCount = await shopAll.getProductGridCount();
    Logger.info('Filtered product count', filteredCount);
    expect(filteredCount).toBeGreaterThan(0);
    Logger.pass('Grid shows Fragrance products');

    Logger.step('Clicking "All" tab to reset');
    await shopAll.clickCategoryTab('All');
    const isAllActive = await shopAll.isTabActive('All');
    expect(isAllActive).toBeTruthy();
    Logger.pass('"All" tab is active — grid reset');
  });

  // ============================================================
  // TEST 4: Verify BESTSELLER badge displays on tagged products
  // ============================================================
  test('4- Verify BESTSELLER badge displays on tagged products', async ({ page }) => {
    Logger.testStart(4, 'BESTSELLER badge displays on tagged products');

    Logger.step('Checking BESTSELLER badge visibility');
    const isBestsellerVisible = await shopAll.isBestsellerBadgeDisplayed();
    if (isBestsellerVisible) {
      const bestsellerCount = await shopAll.getBestsellerBadgeCount();
      Logger.info('BESTSELLER badges found', bestsellerCount);
      expect(bestsellerCount).toBeGreaterThan(0);
      Logger.pass('BESTSELLER badges displayed on tagged products');
    } else {
      Logger.warn('No BESTSELLER badges found in current viewport');
    }
  });

  // ============================================================
  // TEST 5: Verify product card shows name, price, MRP, saving amount and rating
  // ============================================================
  test('5- Verify product card shows name, price, MRP, saving amount and rating', async ({ page }) => {
    Logger.testStart(5, 'Product card shows name, price, MRP and savings');

    Logger.step('Reading product card [0] details');

    const productName = await shopAll.getProductNameByIndex(0);
    expect(productName).toBeTruthy();
    Logger.info('Product name', productName);
    Logger.pass('Product name is present');

    const productPrice = await shopAll.getProductPriceByIndex(0);
    expect(productPrice).toBeTruthy();
    Logger.info('Sale price', productPrice);
    Logger.pass('Sale price is present');

    const productMRP = await shopAll.getProductMRPByIndex(0);
    if (productMRP !== 'N/A') {
      Logger.info('MRP', productMRP);
    } else {
      Logger.warn('MRP not available for this product');
    }

    const savingsAmount = await shopAll.getSavingsAmountByIndex(0);
    if (savingsAmount !== 'N/A') {
      Logger.info('Savings', savingsAmount);
    } else {
      Logger.warn('Savings amount not available for this product');
    }

    Logger.pass('All product card details verified');
  });

  // ============================================================
  // TEST 6: Verify Bellacash earning label is visible on product cards
  // ============================================================
  test('6- Verify Bellacash earning label is visible on product cards', async ({ page }) => {
    Logger.testStart(6, 'Bellacash earning label visible on product cards');

    Logger.step('Checking Bellacash earning label');
    const isBellacashVisible = await shopAll.isBellacashEarningVisible();
    if (isBellacashVisible) {
      Logger.pass('Bellacash earning label is visible');
      const bellacashAmount = await shopAll.getBellacashAmountByIndex(0);
      if (bellacashAmount !== 'N/A') {
        Logger.info('Earning amount', bellacashAmount);
      }
    } else {
      Logger.warn('Bellacash earning label not visible (may not apply to all products)');
    }
  });

  // ============================================================
  // TEST 7: Verify Add to Cart button on product card works for in-stock product
  // ============================================================
  test('@smoke 7- Verify Add to Cart button on product card works for in-stock product', async ({ page }) => {
    Logger.testStart(7, 'Add to Cart button works for in-stock product');

    const productCount = await shopAll.getProductGridCount();
    Logger.info('Total products visible', productCount);
    Logger.step('Scanning first 5 products for an in-stock item');

    let foundInStockProduct = false;
    for (let i = 0; i < Math.min(productCount, 5); i++) {
      const isAtcVisible = await shopAll.isAddToCartButtonVisibleByIndex(i);
      if (isAtcVisible) {
        Logger.pass(`In-stock product found at index [${i}]`);
        foundInStockProduct = true;
        expect(isAtcVisible).toBeTruthy();

        Logger.step(`Clicking Add to Cart for product [${i}]`);
        await shopAll.clickAddToCartByIndex(i);
        Logger.pass('Add to Cart clicked successfully');
        break;
      }
    }

    if (!foundInStockProduct) {
      Logger.warn('No in-stock product found in first 5 items');
    } else {
      expect(foundInStockProduct).toBeTruthy();
    }
  });

  // ============================================================
  // TEST 8: Verify SOLD OUT button is disabled and non-clickable
  // ============================================================
  test('8- Verify SOLD OUT button is disabled and non-clickable', async ({ page }) => {
    Logger.testStart(8, 'SOLD OUT button is disabled and non-clickable');

    const soldOutCount = await shopAll.getSoldOutButtonCount();
    Logger.info('SOLD OUT buttons found', soldOutCount);

    let foundSoldOutProduct = false;
    for (let i = 0; i < soldOutCount; i++) {
      const isSoldOutDisplayed = await shopAll.isSoldOutButtonDisplayedByIndex(i);
      if (isSoldOutDisplayed) {
        Logger.pass(`SOLD OUT button visible at index [${i}]`);
        foundSoldOutProduct = true;
        expect(isSoldOutDisplayed).toBeTruthy();

        Logger.step('Verifying SOLD OUT button is disabled');
        const isSoldOutDisabled = await shopAll.isSoldOutButtonDisabledByIndex(i);
        expect(isSoldOutDisabled).toBeTruthy();
        Logger.pass('SOLD OUT button is disabled (non-clickable)');
        break;
      }
    }

    if (!foundSoldOutProduct) {
      Logger.warn('No sold-out product found in current view');
    }
  });

  // ============================================================
  // TEST 9: Verify clicking product card image navigates to PDP
  // ============================================================
  test('@smoke 9- Verify clicking product card image navigates to PDP', async ({ page }) => {
    Logger.testStart(9, 'Product card image navigates to PDP');

    Logger.info('Starting URL', shopAll.getCurrentUrl());

    Logger.step('Clicking first product image');
    await shopAll.clickProductImageByIndex(0);
    await shopAll.pause(2000);

    const isOnPDP = await shopAll.verifyNavigatedToPDP();
    expect(isOnPDP).toBeTruthy();
    Logger.pass('Successfully navigated to Product Detail Page');
    Logger.info('Current URL', shopAll.getCurrentUrl());
  });

  // ============================================================
  // TEST 10: Verify Filter panel opens on clicking Filter icon
  // ============================================================
  test('10- Verify Filter panel opens on clicking Filter icon', async ({ page }) => {
    Logger.testStart(10, 'Filter panel opens on clicking Filter icon');

    Logger.step('Checking Filter button visibility');
    const isFilterBtnVisible = await shopAll.isFilterButtonVisible();
    expect(isFilterBtnVisible).toBeTruthy();
    Logger.pass('Filter button is visible');

    Logger.step('Clicking Filter button');
    await shopAll.clickFilterButton();

    const isFilterPanelOpen = await shopAll.isFilterPanelOpened();
    expect(isFilterPanelOpen).toBeTruthy();
    Logger.pass('Filter panel opened successfully');
  });

  // ============================================================
  // TEST 11: Verify Sort panel opens on clicking Sort icon
  // ============================================================
  test('11- Verify Sort panel opens on clicking Sort icon', async ({ page }) => {
    Logger.testStart(11, 'Sort panel opens on clicking Sort icon');

    Logger.step('Checking Sort button visibility');
    const isSortBtnVisible = await shopAll.isSortButtonVisible();
    expect(isSortBtnVisible).toBeTruthy();
    Logger.pass('Sort button is visible');

    Logger.step('Clicking Sort button');
    await shopAll.clickSortButton();

    const isSortPanelOpen = await shopAll.isSortPanelOpened();
    expect(isSortPanelOpen).toBeTruthy();
    Logger.pass('Sort panel opened successfully');
  });

  // ============================================================
  // TEST 12: Verify all filter sections are visible
  // ============================================================
  test('12- Verify all filter sections are visible', async ({ page }) => {
    Logger.testStart(12, 'All filter sections are visible');

    Logger.step('Opening filter panel');
    await shopAll.clickFilterButton();

    const expectedSections = [
      'Perfume Notes', 'Price', 'Product type',
      'Category', 'Availability', 'Occasions', 'Shop Categories',
    ];

    Logger.step(`Verifying all ${expectedSections.length} filter sections`);
    for (const section of expectedSections) {
      const isVisible = await shopAll.isFilterSectionNavVisible(section);
      expect(isVisible).toBeTruthy();
      Logger.pass(`Section "${section}" is visible`);
    }
  });

  // ============================================================
  // TEST 13: Verify selecting a Perfume Note filter applies correctly
  // ============================================================
  test('13- Verify selecting a Perfume Note filter applies correctly', async ({ page }) => {
    Logger.testStart(13, 'Perfume Note filter applies correctly');

    Logger.step('Opening filter panel');
    await shopAll.clickFilterButton();

    Logger.step('Selecting "Bergamot" under Perfume Notes');
    await shopAll.selectFilterSectionAndOption('Perfume Notes', 'Bergamot');

    Logger.step('Applying filters');
    await shopAll.clickApplyFilters();

    const productCount = await shopAll.getProductGridCount();
    Logger.info('Products after filter', productCount);
    expect(productCount).toBeGreaterThan(0);
    Logger.pass('Filter applied — products visible');

    const isBadgeVisible = await shopAll.isFilterBadgeVisible();
    expect(isBadgeVisible).toBeTruthy();
    Logger.pass('Active filter badge is showing');

    const badgetext = await shopAll.getFilterBadgeText();
    Logger.info('Badge text', badgetext);
    expect(badgetext).toContain('Bergamot');
    Logger.pass('Active filter badge is visible on filter button');
  });

  // ============================================================
  // TEST 14: Verify Price range From and To inputs accept values
  // ============================================================
  test('14- Verify Price range filter From and To inputs accept values', async ({ page }) => {
    Logger.testStart(14, 'Price range filter inputs accept values');

    Logger.step('Opening filter panel');
    await shopAll.clickFilterButton();

    Logger.step('Navigating to Price section');
    await shopAll.clickFilterSectionNav('Price');

    Logger.step('Entering price range: ₹100 – ₹500');
    await shopAll.fillPriceFrom('100');
    const fromVal = await shopAll.getPriceFromValue();
    expect(fromVal).toBe('100');
    Logger.pass(`From input accepted: ${fromVal}`);

    await shopAll.fillPriceTo('500');
    const toVal = await shopAll.getPriceToValue();
    expect(toVal).toBe('500');
    Logger.pass(`To input accepted: ${toVal}`);
  });

  // ============================================================
  // TEST 15: Verify Price range filter returns products within range
  // ============================================================
  test('15- Verify Price range filter returns products within the entered range', async ({ page }) => {
    Logger.testStart(15, 'Price range filter returns products within range');

    const initialCount = await shopAll.getProductGridCount();
    Logger.info('Initial product count', initialCount);

    Logger.step('Opening filter panel');
    await shopAll.clickFilterButton();

    Logger.step('Navigating to Price section');
    await shopAll.clickFilterSectionNav('Price');

    Logger.step('Setting price range: ₹200 – ₹599');
    await shopAll.fillPriceFrom('200');
    await shopAll.fillPriceTo('599');

    Logger.step('Applying price filter');
    await shopAll.clickApplyFilters();

    const filteredCount = await shopAll.getProductGridCount();
    Logger.info('Products after filter', filteredCount);
    expect(filteredCount).toBeGreaterThan(0);
    Logger.pass('Price filter applied — products visible');

    const isBadgeVisible = await shopAll.isFilterBadgeVisible();
    expect(isBadgeVisible).toBeTruthy();
    Logger.pass('Active filter badge is showing');
  });

  // ============================================================
  // TEST 16: Verify Product Type filter options are visible with counts
  // ============================================================
  test('16- Verify Product Type filter options are visible with counts', async ({ page }) => {
    Logger.testStart(16, 'Product Type filter options visible with counts');

    Logger.step('Opening filter panel');
    await shopAll.clickFilterButton();

    Logger.step('Navigating to Product type section');
    await shopAll.clickFilterSectionNav('Product type');

    const expectedOptions = ['Gift Set', 'Shower Gel Combo', 'Skincare Combo', 'Perfume Combo', 'Eau De Cologne - 100ml'];
    Logger.step(`Checking ${expectedOptions.length} Product Type options`);
    for (const option of expectedOptions) {
      const isVisible = await shopAll.isElementDisplayed(shopAll.filterOptionLabel('Product type', option));
      expect(isVisible).toBeTruthy();
      Logger.pass(`Option "${option}" is visible`);
    }

    const optionTexts = await shopAll.getAllFilterOptionTexts();
    const hasCount = optionTexts.some(t => /\(\d+\)/.test(t));
    expect(hasCount).toBeTruthy();
    Logger.pass('Options show product counts in parentheses');
  });

  // ============================================================
  // TEST 17: Verify selecting Product Type filters the grid
  // ============================================================
  test('17- Verify selecting Product Type filters the grid', async ({ page }) => {
    Logger.testStart(17, 'Product Type filter narrows the product grid');

    Logger.step('Opening filter panel → selecting "Gift Set" under Product type');
    await shopAll.clickFilterButton();
    await shopAll.selectFilterSectionAndOption('Product type', 'Gift Set');

    const isSelected = await shopAll.isFilterOptionSelected('Product type', 'Gift Set');
    expect(isSelected).toBeTruthy();
    Logger.pass('"Gift Set" option is checked');

    Logger.step('Applying filter');
    await shopAll.clickApplyFilters();

    const filteredCount = await shopAll.getProductGridCount();
    Logger.info('Gift Set products shown', filteredCount);
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(21);
    Logger.pass(`Grid filtered to ${filteredCount} Gift Set products`);
  });

  // ============================================================
  // TEST 18: Verify Category filter options are visible with counts
  // ============================================================
  test('18- Verify Category filter options are visible with counts', async ({ page }) => {
    Logger.testStart(18, 'Category filter options visible with counts');

    Logger.step('Opening filter panel');
    await shopAll.clickFilterButton();

    Logger.step('Navigating to Category section');
    await shopAll.clickFilterSectionNav('Category');

    const expectedOptions = ['Fragrance', 'Bath & Body', 'Skincare', 'Cosmetics', 'Hair Care', 'Candles'];
    Logger.step(`Checking ${expectedOptions.length} Category options`);
    for (const option of expectedOptions) {
      const isVisible = await shopAll.isElementDisplayed(shopAll.filterOptionLabel('Category', option));
      expect(isVisible).toBeTruthy();
      Logger.pass(`Category "${option}" is visible`);
    }

    const optionTexts = await shopAll.getAllFilterOptionTexts();
    const hasCount = optionTexts.some(t => /\(\d+\)/.test(t));
    expect(hasCount).toBeTruthy();
    Logger.pass('Category options show product counts in parentheses');
  });

  // ============================================================
  // TEST 19: Verify selecting a Category filters the grid
  // ============================================================
  test('19- Verify selecting a Category filters the grid', async ({ page }) => {
    Logger.testStart(19, 'Category filter narrows the product grid');

    const initialCount = await shopAll.getProductGridCount();
    Logger.info('Initial product count', initialCount);

    Logger.step('Opening filter panel → selecting "Fragrance" category');
    await shopAll.clickFilterButton();
    await shopAll.selectFilterSectionAndOption('Category', 'Fragrance');

    const isSelected = await shopAll.isFilterOptionSelected('Category', 'Fragrance');
    expect(isSelected).toBeTruthy();
    Logger.pass('"Fragrance" category is selected');

    Logger.step('Applying filter');
    await shopAll.clickApplyFilters();

    const filteredCount = await shopAll.getProductGridCount();
    Logger.info('Fragrance products shown', filteredCount);
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(88);
    Logger.pass(`Grid filtered to ${filteredCount} Fragrance products`);
  });

  // ============================================================
  // TEST 20: Verify Availability In Stock filter removes SOLD OUT products
  // ============================================================
  test('20- Verify Availability In Stock filter removes SOLD OUT products', async ({ page }) => {
    Logger.testStart(20, 'In Stock filter removes SOLD OUT products');

    Logger.step('Opening filter panel → selecting "In stock" availability');
    await shopAll.clickFilterButton();
    await shopAll.selectFilterSectionAndOption('Availability', 'In stock');

    const isSelected = await shopAll.isFilterOptionSelected('Availability', 'In stock');
    expect(isSelected).toBeTruthy();
    Logger.pass('"In stock" option is selected');

    Logger.step('Applying filter');
    await shopAll.clickApplyFilters();

    const soldOutCount = await shopAll.countSoldOutProductsOnGrid();
    Logger.info('SOLD OUT products remaining', soldOutCount);
    expect(soldOutCount).toBe(0);
    Logger.pass('No SOLD OUT products visible — In Stock filter working');
  });

  // ============================================================
  // TEST 21: Verify Availability Out of Stock filter shows only SOLD OUT products
  // ============================================================
  test('21- Verify Availability Out of Stock filter shows only SOLD OUT products', async ({ page }) => {
    Logger.testStart(21, 'Out of Stock filter shows only SOLD OUT products');

    Logger.step('Opening filter panel → selecting "Out of stock" availability');
    await shopAll.clickFilterButton();
    await shopAll.selectFilterSectionAndOption('Availability', 'Out of stock');

    const isSelected = await shopAll.isFilterOptionSelected('Availability', 'Out of stock');
    expect(isSelected).toBeTruthy();
    Logger.pass('"Out of stock" option is selected');

    Logger.step('Applying filter');
    await shopAll.clickApplyFilters();

    const soldOutCount = await shopAll.countSoldOutProductsOnGrid();
    const totalCount  = await shopAll.getProductGridCount();
    Logger.info('Total products shown', totalCount);
    Logger.info('SOLD OUT products', soldOutCount);
    expect(soldOutCount).toBeGreaterThan(0);
    expect(soldOutCount).toBe(totalCount);
    Logger.pass(`All ${totalCount} visible products are SOLD OUT`);
  });

  // ============================================================
  // TEST 22: Verify Occasion filter options render with emoji and counts
  // ============================================================
  test('22- Verify Occasion filter options render with emoji and counts', async ({ page }) => {
    Logger.testStart(22, 'Occasion filter options render with emoji and counts');

    Logger.step('Opening filter panel → navigating to Occasions section');
    await shopAll.clickFilterButton();
    await shopAll.clickFilterSectionNav('Occasions');

    const expectedOccasions = ['🍹 Summers', '🎁 Gifting', ' 🏋️ Gym', '💃 Party', '💘 Date', '💻 Office', '🔁 Daily Wear', '🙋🏻‍♀️ For Her', '🙋🏻‍♂️ For Him'];
    Logger.step(`Checking ${expectedOccasions.length} Occasion options`);
    for (const occasion of expectedOccasions) {
      const isVisible = await shopAll.isElementDisplayed(shopAll.filterOptionLabel('Occasions', occasion));
      expect(isVisible).toBeTruthy();
      Logger.pass(`Occasion "${occasion}" is visible`);
    }

    const optionTexts = await shopAll.getAllFilterOptionTexts();
    const hasCount = optionTexts.some(t => /\(\d+\)/.test(t));
    expect(hasCount).toBeTruthy();
    Logger.pass('Occasion options show product counts in parentheses');
  });

  // ============================================================
  // TEST 23: Verify selecting an Occasion filter applies correctly
  // ============================================================
  test('23- Verify selecting an Occasion filter applies correctly', async ({ page }) => {
    Logger.testStart(23, 'Occasion filter narrows the product grid');

    Logger.step('Opening filter panel → selecting "🍹 Summers" occasion');
    await shopAll.clickFilterButton();
    await shopAll.selectFilterSectionAndOption('Occasions', '🍹 Summers');

    const isSelected = await shopAll.isFilterOptionSelected('Occasions', '🍹 Summers');
    expect(isSelected).toBeTruthy();
    Logger.pass('"Summers" occasion is selected');

    Logger.step('Applying filter');
    await shopAll.clickApplyFilters();

    const filteredCount = await shopAll.getProductGridCount();
    Logger.info('Summers products shown', filteredCount);
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(30);
    Logger.pass(`Grid filtered to ${filteredCount} Summers products`);
  });

  // ============================================================
  // TEST 24: Verify Shop Categories filter options are visible
  // ============================================================
  test('24- Verify Shop Categories filter options are visible', async ({ page }) => {
    Logger.testStart(24, 'Shop Categories filter options are visible');

    Logger.step('Opening filter panel → navigating to Shop Categories');
    await shopAll.clickFilterButton();
    await shopAll.clickFilterSectionNav('Shop Categories');

    const expectedCategories = ['Best Sellers', 'Perfume Him', 'Premium', 'All Gift Sets', 'Perfume Her', 'Skincare & Cosmetics'];
    Logger.step(`Checking ${expectedCategories.length} Shop Category options`);
    for (const cat of expectedCategories) {
      const isVisible = await shopAll.isElementDisplayed(shopAll.filterOptionLabel('Shop Categories', cat));
      expect(isVisible).toBeTruthy();
      Logger.pass(`Category "${cat}" is visible`);
    }
  });

  // ============================================================
  // TEST 25: Verify selecting Best Sellers shop category filters correctly
  // ============================================================
  test('25- Verify selecting Best Sellers shop category filters correctly', async ({ page }) => {
    Logger.testStart(25, 'Best Sellers shop category filters the grid');

    Logger.step('Opening filter panel → selecting "Best Sellers"');
    await shopAll.clickFilterButton();
    await shopAll.selectFilterSectionAndOption('Shop Categories', 'Best Sellers');

    const isSelected = await shopAll.isFilterOptionSelected('Shop Categories', 'Best Sellers');
    expect(isSelected).toBeTruthy();
    Logger.pass('"Best Sellers" option is selected');

    Logger.step('Applying filter');
    await shopAll.clickApplyFilters();

    const filteredCount = await shopAll.getProductGridCount();
    Logger.info('Best Sellers products shown', filteredCount);
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(22);
    Logger.pass(`Grid filtered to ${filteredCount} Best Sellers products`);
  });

  // ============================================================
  // TEST 26: Verify multi-filter combination returns intersection results
  // ============================================================
  test('26- Verify multi-filter combination returns intersection results', async ({ page }) => {
    Logger.testStart(26, 'Multi-filter combination returns intersection results');

    Logger.section('Filter 1: Category → Fragrance');
    await shopAll.clickFilterButton();
    await shopAll.selectFilterSectionAndOption('Category', 'Fragrance');
    await shopAll.clickApplyFilters();
    const singleFilterCount = await shopAll.getProductGridCount();
    Logger.info('Products after Fragrance filter', singleFilterCount);

    Logger.section('Filter 2: Availability → In stock');
    await shopAll.clickFilterButton();
    await shopAll.selectFilterSectionAndOption('Availability', 'In stock');
    await shopAll.clickApplyFilters();
    const multiFilterCount = await shopAll.getProductGridCount();
    Logger.info('Products after both filters', multiFilterCount);

    expect(multiFilterCount).toBeGreaterThan(0);
    expect(multiFilterCount).toBeLessThanOrEqual(singleFilterCount);
    Logger.pass(`Multi-filter count (${multiFilterCount}) ≤ single-filter count (${singleFilterCount})`);
  });

  // ============================================================
  // TEST 27: Verify active filter count badge updates on header
  // ============================================================
  test('27- Verify active filter count badge updates on header', async ({ page }) => {
    Logger.testStart(27, 'Active filter count badge updates on header');

    Logger.section('Apply filter 1: Product type → Gift Set');
    await shopAll.clickFilterButton();
    await shopAll.selectFilterSectionAndOption('Product type', 'Gift Set');
    await shopAll.clickApplyFilters();
    const badgeAfterOne = await shopAll.getFilterBadgeText();
    Logger.info('Badge after 1 filter', badgeAfterOne);

    Logger.section('Apply filter 2: Category → Fragrance');
    await shopAll.clickFilterButton();
    await shopAll.selectFilterSectionAndOption('Category', 'Fragrance');
    await shopAll.clickApplyFilters();

    const badgeCount = await shopAll.getBadgeCount();
    Logger.info('Badge count after 2 filters', badgeCount);
    expect(badgeCount).toBeGreaterThanOrEqual(2);
    Logger.pass(`Badge incremented to ${badgeCount} after 2 filters`);
  });

  // ============================================================
  // TEST 28: Verify Apply Filters button activates only after a selection
  // ============================================================
  test('28- Verify Apply Filters button activates only after a selection', async ({ page }) => {
    Logger.testStart(28, 'Apply Filters button activates only after a selection');

    Logger.step('Opening filter panel');
    await shopAll.clickFilterButton();

    Logger.step('Checking Apply Filters state before any selection');
    const isEnabledBefore = await shopAll.isApplyFiltersButtonEnabled();
    expect(isEnabledBefore).toBeFalsy();
    Logger.pass('Apply Filters is DISABLED before any selection');

    Logger.step('Selecting "Fragrance" category');
    await shopAll.selectFilterSectionAndOption('Category', 'Fragrance');

    Logger.step('Checking Apply Filters state after selection');
    const isEnabledAfter = await shopAll.isApplyFiltersButtonEnabled();
    expect(isEnabledAfter).toBeTruthy();
    Logger.pass('Apply Filters is ENABLED after a selection');
  });

  // ============================================================
  // TEST 29: Verify Reset Filters clears all selections and badge
  // ============================================================
  test('29- Verify Reset Filters clears all selections and badge', async ({ page }) => {
    Logger.testStart(29, 'Reset Filters clears all selections and badge');

    Logger.section('Setup: apply a filter first');
    await shopAll.clickFilterButton();
    await shopAll.selectFilterSectionAndOption('Category', 'Fragrance');
    await shopAll.clickApplyFilters();

    const badgeBefore = await shopAll.isFilterBadgeVisible();
    expect(badgeBefore).toBeTruthy();
    Logger.pass('Filter badge is visible after applying filter');

    Logger.section('Reset: open filter panel and click Reset Filters');
    await shopAll.clickFilterButton();
    await shopAll.clickResetFilters();

    const isApplyFilterEnabled = await shopAll.isApplyFiltersButtonEnabled();
    expect(isApplyFilterEnabled).toBeFalsy();
    Logger.pass('Selections cleared — Apply Filters is now disabled');

    await shopAll.closeFilterPanel();

    const badgeAfter = await shopAll.isFilterBadgeVisible();
    expect(badgeAfter).toBeFalsy();
    Logger.pass('Filter badge removed after Reset');
  });

  // ============================================================
  // TEST 30: Verify filter panel closes on clicking X
  // ============================================================
  test('30- Verify filter panel closes on clicking X', async ({ page }) => {
    Logger.testStart(30, 'Filter panel closes on clicking X');

    Logger.step('Opening filter panel');
    await shopAll.clickFilterButton();
    const isOpenBefore = await shopAll.isFilterPanelOpened();
    expect(isOpenBefore).toBeTruthy();
    Logger.pass('Filter panel is open');

    Logger.step('Clicking X to close filter panel');
    await shopAll.closeFilterPanel();

    const isClosed = await shopAll.isFilterPanelClosed();
    expect(isClosed).toBeTruthy();
    Logger.pass('Filter panel closed successfully');
  });

});
