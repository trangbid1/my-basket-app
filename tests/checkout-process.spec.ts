import { test, expect } from '@playwright/test';

// Test suite for the Checkout Process
test.describe('Checkout Process', () => {
  test('should complete the checkout process successfully', async ({ page }) => {
    // Navigate to the checkout page
    await page.goto('/checkout');

    // Verify that the checkout page is loaded
    await expect(page.locator('[data-testid="checkout-page"]')).toBeVisible();

    // Fill in the checkout form
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="address-input"]', '123 Main St, Springfield');
    await page.fill('[data-testid="email-input"]', 'john.doe@example.com');

    // Submit the checkout form
    await page.click('[data-testid="submit-order-button"]');

    // Verify the success message
    await expect(page.locator('[data-testid="order-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-success-message"]')).toHaveText('Thank you for your order!');
  });

  test('should display empty cart message and Start Shopping button when no products are added', async ({ page }) => {
    await page.goto('/cart');

    // Assert empty cart message
    const emptyCartMessage = await page.locator('[data-testid="empty-cart-message"]');
    await expect(emptyCartMessage).toHaveText('Your cart is empty');

    // Assert Start Shopping button is enabled
    const startShoppingButton = await page.locator('[data-testid="start-shopping-button"]');
    await expect(startShoppingButton).toBeEnabled();
  });

  test('should allow proceeding to checkout when products are in the cart', async ({ page }) => {
    await page.goto('/cart');

    // Simulate adding a product to the cart (mock or navigate to product page and add)
    await page.evaluate(() => {
      localStorage.setItem('cart', JSON.stringify([{ id: 1, name: 'Sample Product', price: 10 }]));
    });
    await page.reload();

    // Assert Proceed to Checkout button is visible and enabled
    const proceedToCheckoutButton = await page.locator('[data-testid="proceed-to-checkout-button"]');
    await expect(proceedToCheckoutButton).toBeVisible();
    await expect(proceedToCheckoutButton).toBeEnabled();
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Take a screenshot on failure
    if (testInfo.status !== testInfo.expectedStatus) {
      await page.screenshot({ path: `screenshots/${testInfo.title.replace(/\s+/g, '_')}.png` });
    }
  });
});