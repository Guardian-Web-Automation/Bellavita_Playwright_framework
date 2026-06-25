const { test, expect } = require('@playwright/test');
const { ShopAll } = require('../pages/ShopAll');
const { PDPPage } = require('../pages/PDPPage');
const { CartPage } = require('../pages/CartPage');
const { GoKwikFramePage } = require('../pages/GoKwikFramePage');
const { OrderConfirmationPage } = require('../pages/OrderConfirmationPage');
const { Logger } = require('../utils/Logger');

const PHONE_NUMBER = process.env.TEST_PHONE_NUMBER || '';
const MASKED_PHONE = PHONE_NUMBER
  ? PHONE_NUMBER.slice(0, 2) + '*'.repeat(Math.max(0, PHONE_NUMBER.length - 5)) + PHONE_NUMBER.slice(-3)
  : 'NOT_SET';

test.describe('GoKwik checkout flow', () => {

    test.setTimeout(120_000);

    /** @type {import('../pages/ShopAll').ShopAll} */
    let shopAll;

    test.beforeEach(async ({ page }) => {
        test.skip(!process.env.TEST_PHONE_NUMBER, 'TEST_PHONE_NUMBER not set — skipping checkout tests');
        shopAll = new ShopAll(page);
        await shopAll.navigateTo();
    });

    // ============================================================
    // ORDER TEST 1: COD checkout from Shop All page
    // ============================================================
    test('user can complete checkout with COD via GoKwik', async ({ page }) => {
        Logger.testStart('T1', 'Complete checkout with COD via GoKwik');

        Logger.section('Add product to cart');
        Logger.step('Adding first product to cart from Shop All page');
        await shopAll.addFirstProductToCart();
        Logger.pass('Product added to cart');

        Logger.section('Initiate checkout');
        Logger.step('Clicking GoKwik checkout via CartPage');
        const cart = new CartPage(page);
        await cart.clickCheckout();
        Logger.pass('Cart checkout initiated');

        Logger.section('Complete GoKwik checkout');
        Logger.step('Switching to GoKwik iframe');
        const gokwik = await GoKwikFramePage.switchToGokwik(page);
        Logger.step(`Entering phone number: ${MASKED_PHONE}`);
        await gokwik.completeCheckout(PHONE_NUMBER);
        Logger.pass('Checkout steps completed');

        Logger.section('Order confirmation');
        const orderConfirmation = new OrderConfirmationPage(page);
        await orderConfirmation.assertOrderSuccess();
        Logger.pass('Order success page verified');

        const orderIDText = await orderConfirmation.getOrderIdText();
        Logger.info('Order ID', orderIDText);

        Logger.success('ORDER PLACED SUCCESSFULLY');
    });

    // ============================================================
    // ORDER TEST 2: COD checkout starting from PDP
    // ============================================================
    test.only('user adds product from PDP and places order with COD via GoKwik', async ({ page }) => {
        Logger.testStart('T2', 'Add product from PDP and place order via GoKwik');

        Logger.section('Navigate to PDP');
        Logger.step('Clicking first product to open PDP');
        await shopAll.clickFirstProductToPDP();
        await page.waitForLoadState('domcontentloaded');
        Logger.pass('Product Detail Page loaded');

        Logger.section('Add to cart from PDP');
        Logger.step('Clicking Add to Cart on PDP');
        const pdp = new PDPPage(page);
        await pdp.clickAddToCart();
        await page.waitForTimeout(2000);
        Logger.pass('Product added to cart from PDP');

        Logger.section('Initiate checkout');
        Logger.step('Clicking GoKwik checkout via CartPage');
        const cart = new CartPage(page);
        await cart.clickCheckout();
        Logger.pass('Cart checkout initiated');

        Logger.section('Complete GoKwik checkout');
        Logger.step('Switching to GoKwik iframe');
        const gokwik = await GoKwikFramePage.switchToGokwik(page);
        Logger.step(`Entering phone number: ${MASKED_PHONE}`);
        await gokwik.completeCheckout(PHONE_NUMBER);
        Logger.pass('Checkout steps completed');

        Logger.section('Order confirmation');
        const orderConfirmation = new OrderConfirmationPage(page);
        await orderConfirmation.assertOrderSuccess();
        Logger.pass('Order success page verified');

        const orderIDText = await orderConfirmation.getOrderIdText();
        Logger.info('Order ID', orderIDText);

        Logger.success('ORDER PLACED SUCCESSFULLY VIA PDP');
    });

    // ============================================================
    // ORDER TEST 3: Multiple products COD checkout
    // ============================================================
    test('user adds multiple products to cart and checks out with COD via GoKwik', async ({ page }) => {
        Logger.testStart('T3', 'Multiple products checkout with COD via GoKwik');

        const cart = new CartPage(page);

        Logger.section('Add first product');
        Logger.step('Adding product [1] to cart');
        await shopAll.addFirstProductToCart();
        expect(await cart.getCartItemCount()).toBeGreaterThanOrEqual(1);
        Logger.pass('Cart item count ≥ 1');

        Logger.step('Closing cart drawer');
        await cart.closeCart();

        Logger.section('Add second product');
        Logger.step('Adding product [2] to cart');
        await shopAll.addSecondProductToCart();
        expect(await cart.getCartItemCount()).toBeGreaterThanOrEqual(2);
        Logger.pass('Cart item count ≥ 2');

        Logger.section('Initiate checkout');
        Logger.step('Clicking GoKwik checkout via CartPage');
        await cart.clickCheckout();
        Logger.pass('Cart checkout initiated');

        Logger.section('Complete GoKwik checkout');
        Logger.step('Switching to GoKwik iframe');
        const gokwik = await GoKwikFramePage.switchToGokwik(page);
        Logger.step(`Entering phone number: ${MASKED_PHONE}`);
        await gokwik.completeCheckout(PHONE_NUMBER);
        Logger.pass('Checkout steps completed');

        Logger.section('Order confirmation');
        const orderConfirmation = new OrderConfirmationPage(page);
        await orderConfirmation.assertOrderSuccess();
        Logger.pass('Order success page verified');

        const orderIDText = await orderConfirmation.getOrderIdText();
        Logger.info('Order ID', orderIDText);

        Logger.success('ORDER PLACED SUCCESSFULLY WITH 2 PRODUCTS');
    });

});
