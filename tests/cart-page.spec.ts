import { test, expect } from '@playwright/test';

// Test suite for the Cart page
test.describe('Cart Page', () => {
  test('should display an empty message when no items are added', async ({ page }) => {
    // Navigate to the Cart page
    await page.goto('/cart');

    // Assert that the empty cart message is visible
    const emptyCartMessage = await page.locator('[data-testid="empty-cart-message"]');
    await expect(emptyCartMessage).toBeVisible();
    await expect(emptyCartMessage).toHaveText(/Your cart is empty/i);

    // Take a screenshot on failure
    test.info().onTestFail(() => {
      page.screenshot({ path: 'screenshots/cart-page-empty-failure.png', fullPage: true });
    });
  });
});