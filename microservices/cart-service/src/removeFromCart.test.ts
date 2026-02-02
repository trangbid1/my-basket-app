import { CartService } from './service';
import { ProductServiceClient } from './product-client';
import { Product } from './types';

// Mock the ProductServiceClient module
jest.mock('./product-client');

describe('CartService - removeFromCart', () => {
  let cartService: CartService;
  let mockProductClient: jest.Mocked<ProductServiceClient>;

  // Helper function to create mock products
  const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
    id: 'product-1',
    name: 'Test Product',
    price: 10.99,
    description: 'A test product description',
    image: 'https://example.com/image.jpg',
    dataAiHint: 'test product',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cartService = new CartService();
    mockProductClient = (cartService as any).productClient as jest.Mocked<ProductServiceClient>;
  });

  /**
   * ============================================================
   * TEST 1: Generated with Copilot
   * Time taken: ~30 seconds (including prompt and generation)
   * ============================================================
   * This test verifies that an item is completely removed from the 
   * cart's items array and that totalItems and totalAmount are 
   * recalculated correctly after removal.
   */
  describe('Copilot-generated test', () => {
    it('should completely remove an item from the cart and recalculate totals correctly', async () => {
      // Arrange: Set up a cart with two different products
      const userId = 'user-1';
      const product1 = createMockProduct({ id: 'product-1', name: 'Apple', price: 2.50 });
      const product2 = createMockProduct({ id: 'product-2', name: 'Banana', price: 1.50 });

      mockProductClient.getProduct = jest.fn()
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);

      // Add both products to the cart
      await cartService.addToCart(userId, 'product-1', 3); // 3 apples = $7.50
      await cartService.addToCart(userId, 'product-2', 2); // 2 bananas = $3.00
      // Total before removal: 5 items, $10.50

      // Act: Remove product-1 (Apple) from the cart
      const cartAfterRemoval = await cartService.removeFromCart(userId, 'product-1');

      // Assert: Verify item is completely removed from items array
      expect(cartAfterRemoval.items).toHaveLength(1);
      expect(cartAfterRemoval.items.find(item => item.id === 'product-1')).toBeUndefined();
      expect(cartAfterRemoval.items[0].id).toBe('product-2');

      // Assert: Verify totalItems is recalculated correctly
      expect(cartAfterRemoval.totalItems).toBe(2); // Only 2 bananas remain

      // Assert: Verify totalAmount is recalculated correctly
      expect(cartAfterRemoval.totalAmount).toBe(3.00); // Only bananas: 1.50 * 2 = 3.00
    });
  });

  /**
   * ============================================================
   * TEST 2: Written Manually
   * Time taken: ~3-5 minutes (including thinking, typing, and verification)
   * ============================================================
   * This test also verifies item removal and total recalculation,
   * but written without AI assistance for comparison.
   */
  describe('Manually written test', () => {
    it('should remove item from cart and update totalItems and totalAmount correctly', async () => {
      // Arrange
      const userId = 'test-user-manual';
      const productA = createMockProduct({ 
        id: 'prod-a', 
        name: 'Orange', 
        price: 3.00 
      });
      const productB = createMockProduct({ 
        id: 'prod-b', 
        name: 'Mango', 
        price: 5.00 
      });

      mockProductClient.getProduct = jest.fn()
        .mockResolvedValueOnce(productA)
        .mockResolvedValueOnce(productB);

      // Add products to cart
      await cartService.addToCart(userId, 'prod-a', 4); // 4 oranges @ $3.00 = $12.00
      await cartService.addToCart(userId, 'prod-b', 2); // 2 mangos @ $5.00 = $10.00
      // Cart state before removal: totalItems = 6, totalAmount = $22.00

      // Act - Remove product A (Orange)
      const result = await cartService.removeFromCart(userId, 'prod-a');

      // Assert - Item is completely removed
      const removedItem = result.items.find(item => item.id === 'prod-a');
      expect(removedItem).toBeUndefined();
      expect(result.items.length).toBe(1);

      // Assert - totalItems recalculated
      expect(result.totalItems).toBe(2); // Only mangos remain

      // Assert - totalAmount recalculated
      expect(result.totalAmount).toBe(10.00); // 2 mangos * $5.00

      // Assert - Remaining item is intact
      expect(result.items[0].id).toBe('prod-b');
      expect(result.items[0].quantity).toBe(2);
    });
  });

  /**
   * Additional edge case tests for comprehensive coverage
   */
  describe('Edge cases', () => {
    it('should handle removing an item that does not exist in the cart', async () => {
      const userId = 'user-edge-1';
      const product = createMockProduct({ id: 'existing-product', price: 10.00 });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(product);
      await cartService.addToCart(userId, 'existing-product', 2);

      // Remove non-existent product
      const cart = await cartService.removeFromCart(userId, 'non-existent-product');

      // Cart should remain unchanged
      expect(cart.items).toHaveLength(1);
      expect(cart.totalItems).toBe(2);
      expect(cart.totalAmount).toBe(20.00);
    });

    it('should result in empty cart with zero totals when removing the last item', async () => {
      const userId = 'user-edge-2';
      const product = createMockProduct({ id: 'only-product', price: 15.00 });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(product);
      await cartService.addToCart(userId, 'only-product', 3);

      // Remove the only product
      const cart = await cartService.removeFromCart(userId, 'only-product');

      // Cart should be empty with zero totals
      expect(cart.items).toHaveLength(0);
      expect(cart.totalItems).toBe(0);
      expect(cart.totalAmount).toBe(0);
    });

    it('should update updatedAt timestamp after removal', async () => {
      const userId = 'user-edge-3';
      const product = createMockProduct({ id: 'product-timestamp', price: 5.00 });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(product);
      const cartBefore = await cartService.addToCart(userId, 'product-timestamp', 1);
      const updatedAtBefore = cartBefore.updatedAt;

      // Small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const cartAfter = await cartService.removeFromCart(userId, 'product-timestamp');

      expect(cartAfter.updatedAt.getTime()).toBeGreaterThanOrEqual(updatedAtBefore.getTime());
    });
  });
});
