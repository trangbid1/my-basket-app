import { CartService } from './service';
import { ProductServiceClient } from './product-client';
import { Product } from './types';

// Mock the ProductServiceClient module
jest.mock('./product-client');

describe('CartService', () => {
  let cartService: CartService;
  let mockProductClient: jest.Mocked<ProductServiceClient>;

  // Complete mock Product object with all required fields
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
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a new instance of CartService (which will use the mocked ProductServiceClient)
    cartService = new CartService();

    // Get the mocked instance of ProductServiceClient
    mockProductClient = (cartService as any).productClient as jest.Mocked<ProductServiceClient>;
  });

  describe('getOrCreateCart', () => {
    it('should create a new cart for a new user', async () => {
      const userId = 'user-1';
      const cart = await cartService.getOrCreateCart(userId);

      expect(cart).toBeDefined();
      expect(cart.userId).toBe(userId);
      expect(cart.items).toEqual([]);
      expect(cart.totalAmount).toBe(0);
      expect(cart.totalItems).toBe(0);
      expect(cart.id).toBeDefined();
      expect(cart.createdAt).toBeInstanceOf(Date);
      expect(cart.updatedAt).toBeInstanceOf(Date);
    });

    it('should return the same cart for an existing user', async () => {
      const userId = 'user-1';
      const cart1 = await cartService.getOrCreateCart(userId);
      const cart2 = await cartService.getOrCreateCart(userId);

      expect(cart1.id).toBe(cart2.id);
      expect(cart1).toBe(cart2);
    });
  });

  describe('addToCart', () => {
    it('should add a valid product to an empty cart', async () => {
      const userId = 'user-1';
      const mockProduct = createMockProduct({ id: 'product-1', price: 15.99 });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

      const cart = await cartService.addToCart(userId, 'product-1', 2);

      expect(mockProductClient.getProduct).toHaveBeenCalledWith('product-1');
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].id).toBe('product-1');
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.totalItems).toBe(2);
      expect(cart.totalAmount).toBe(31.98); // 15.99 * 2
    });

    it('should add product with default quantity of 1', async () => {
      const userId = 'user-1';
      const mockProduct = createMockProduct({ id: 'product-1', price: 10.00 });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

      const cart = await cartService.addToCart(userId, 'product-1');

      expect(cart.items[0].quantity).toBe(1);
      expect(cart.totalItems).toBe(1);
      expect(cart.totalAmount).toBe(10.00);
    });

    it('should increase quantity when adding an existing product', async () => {
      const userId = 'user-1';
      const mockProduct = createMockProduct({ id: 'product-1', price: 10.00 });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

      await cartService.addToCart(userId, 'product-1', 2);
      const cart = await cartService.addToCart(userId, 'product-1', 3);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5);
      expect(cart.totalItems).toBe(5);
      expect(cart.totalAmount).toBe(50.00);
    });

    it('should throw an error when product is not found', async () => {
      const userId = 'user-1';

      mockProductClient.getProduct = jest.fn().mockResolvedValue(null);

      await expect(cartService.addToCart(userId, 'nonexistent-product'))
        .rejects.toThrow('Product not found');
    });

    it('should add multiple different products to the cart', async () => {
      const userId = 'user-1';
      const product1 = createMockProduct({ id: 'product-1', name: 'Product 1', price: 10.00 });
      const product2 = createMockProduct({ id: 'product-2', name: 'Product 2', price: 20.00 });

      mockProductClient.getProduct = jest.fn()
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);

      await cartService.addToCart(userId, 'product-1', 1);
      const cart = await cartService.addToCart(userId, 'product-2', 2);

      expect(cart.items).toHaveLength(2);
      expect(cart.totalItems).toBe(3);
      expect(cart.totalAmount).toBe(50.00); // 10.00 * 1 + 20.00 * 2
    });

    it('should include addedAt date when adding item to cart', async () => {
      const userId = 'user-1';
      const mockProduct = createMockProduct();

      mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

      const beforeAdd = new Date();
      const cart = await cartService.addToCart(userId, 'product-1');
      const afterAdd = new Date();

      expect(cart.items[0].addedAt).toBeInstanceOf(Date);
      expect(cart.items[0].addedAt.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime());
      expect(cart.items[0].addedAt.getTime()).toBeLessThanOrEqual(afterAdd.getTime());
    });
  });

  describe('updateCartItem', () => {
    it('should update the quantity of an existing item', async () => {
      const userId = 'user-1';
      const mockProduct = createMockProduct({ id: 'product-1', price: 25.50 });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

      await cartService.addToCart(userId, 'product-1', 2);
      const cart = await cartService.updateCartItem(userId, 'product-1', 5);

      expect(cart.items[0].quantity).toBe(5);
      expect(cart.totalItems).toBe(5);
      expect(cart.totalAmount).toBe(127.50); // 25.50 * 5
    });

    it('should correctly calculate total with updated quantities', async () => {
      const userId = 'user-1';
      const product1 = createMockProduct({ id: 'product-1', price: 10.00 });
      const product2 = createMockProduct({ id: 'product-2', price: 15.00 });

      mockProductClient.getProduct = jest.fn()
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);

      await cartService.addToCart(userId, 'product-1', 2); // 20.00
      await cartService.addToCart(userId, 'product-2', 3); // 45.00

      const cart = await cartService.updateCartItem(userId, 'product-1', 4); // Now 40.00 + 45.00 = 85.00

      expect(cart.totalItems).toBe(7); // 4 + 3
      expect(cart.totalAmount).toBe(85.00);
    });

    it('should remove item when quantity is set to 0', async () => {
      const userId = 'user-1';
      const mockProduct = createMockProduct({ id: 'product-1' });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

      await cartService.addToCart(userId, 'product-1', 2);
      const cart = await cartService.updateCartItem(userId, 'product-1', 0);

      expect(cart.items).toHaveLength(0);
      expect(cart.totalItems).toBe(0);
      expect(cart.totalAmount).toBe(0);
    });

    it('should remove item when quantity is negative', async () => {
      const userId = 'user-1';
      const mockProduct = createMockProduct({ id: 'product-1' });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

      await cartService.addToCart(userId, 'product-1', 2);
      const cart = await cartService.updateCartItem(userId, 'product-1', -1);

      expect(cart.items).toHaveLength(0);
    });

    it('should throw error when updating non-existent item', async () => {
      const userId = 'user-1';

      await expect(cartService.updateCartItem(userId, 'nonexistent-product', 5))
        .rejects.toThrow('Item not found in cart');
    });

    it('should update the updatedAt timestamp', async () => {
      const userId = 'user-1';
      const mockProduct = createMockProduct({ id: 'product-1' });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

      const cart1 = await cartService.addToCart(userId, 'product-1', 1);
      const firstUpdate = cart1.updatedAt;

      // Small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const cart2 = await cartService.updateCartItem(userId, 'product-1', 5);

      expect(cart2.updatedAt.getTime()).toBeGreaterThan(firstUpdate.getTime());
    });
  });

  describe('Floating Point Precision - Edge Cases', () => {
    it('should handle floating point precision when adding 3 items priced at 10.99', async () => {
      const userId = 'user-1';
      const mockProduct = createMockProduct({ id: 'product-1', price: 10.99 });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

      const cart = await cartService.addToCart(userId, 'product-1', 3);

      // 10.99 * 3 = 32.97 (without floating point issues, it would be 32.96999999999...)
      expect(cart.totalAmount).toBe(32.97);
      expect(cart.totalAmount.toString()).toBe('32.97');
    });

    it('should always round totalAmount to 2 decimal places', async () => {
      const userId = 'user-1';
      const mockProduct = createMockProduct({ id: 'product-1', price: 0.1 });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

      // Adding 3 items at 0.1 each (0.1 + 0.1 + 0.1 has floating point issues)
      const cart = await cartService.addToCart(userId, 'product-1', 3);

      expect(cart.totalAmount).toBe(0.3);
      // Verify it's actually rounded (not 0.30000000000000004)
      expect(Number.isInteger(cart.totalAmount * 100)).toBe(true);
    });

    it('should maintain precision with multiple products having decimal prices', async () => {
      const userId = 'user-1';
      const product1 = createMockProduct({ id: 'product-1', price: 1.99 });
      const product2 = createMockProduct({ id: 'product-2', price: 2.99 });
      const product3 = createMockProduct({ id: 'product-3', price: 3.99 });

      mockProductClient.getProduct = jest.fn()
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2)
        .mockResolvedValueOnce(product3);

      await cartService.addToCart(userId, 'product-1', 1);
      await cartService.addToCart(userId, 'product-2', 1);
      const cart = await cartService.addToCart(userId, 'product-3', 1);

      // 1.99 + 2.99 + 3.99 = 8.97
      expect(cart.totalAmount).toBe(8.97);
    });

    it('should handle large quantities with decimal prices', async () => {
      const userId = 'user-1';
      const mockProduct = createMockProduct({ id: 'product-1', price: 9.99 });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

      const cart = await cartService.addToCart(userId, 'product-1', 100);

      // 9.99 * 100 = 999.00
      expect(cart.totalAmount).toBe(999);
    });

    it('should correctly handle update with floating point prices', async () => {
      const userId = 'user-1';
      const mockProduct = createMockProduct({ id: 'product-1', price: 0.33 });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

      await cartService.addToCart(userId, 'product-1', 1);
      const cart = await cartService.updateCartItem(userId, 'product-1', 3);

      // 0.33 * 3 = 0.99
      expect(cart.totalAmount).toBe(0.99);
    });
  });

  describe('removeFromCart', () => {
    it('should remove an existing item from cart', async () => {
      const userId = 'user-1';
      const mockProduct = createMockProduct({ id: 'product-1' });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

      await cartService.addToCart(userId, 'product-1', 2);
      const cart = await cartService.removeFromCart(userId, 'product-1');

      expect(cart.items).toHaveLength(0);
      expect(cart.totalItems).toBe(0);
      expect(cart.totalAmount).toBe(0);
    });

    it('should not throw when removing non-existent item', async () => {
      const userId = 'user-1';
      const cart = await cartService.removeFromCart(userId, 'nonexistent-product');

      expect(cart.items).toHaveLength(0);
    });

    it('should only remove the specified item', async () => {
      const userId = 'user-1';
      const product1 = createMockProduct({ id: 'product-1', name: 'Product 1', price: 10.00 });
      const product2 = createMockProduct({ id: 'product-2', name: 'Product 2', price: 20.00 });

      mockProductClient.getProduct = jest.fn()
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);

      await cartService.addToCart(userId, 'product-1', 1);
      await cartService.addToCart(userId, 'product-2', 2);
      const cart = await cartService.removeFromCart(userId, 'product-1');

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].id).toBe('product-2');
      expect(cart.totalItems).toBe(2);
      expect(cart.totalAmount).toBe(40.00);
    });
  });

  describe('clearCart', () => {
    it('should remove all items from the cart', async () => {
      const userId = 'user-1';
      const product1 = createMockProduct({ id: 'product-1' });
      const product2 = createMockProduct({ id: 'product-2' });

      mockProductClient.getProduct = jest.fn()
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);

      await cartService.addToCart(userId, 'product-1', 1);
      await cartService.addToCart(userId, 'product-2', 2);
      const cart = await cartService.clearCart(userId);

      expect(cart.items).toHaveLength(0);
      expect(cart.totalItems).toBe(0);
      expect(cart.totalAmount).toBe(0);
    });

    it('should work on already empty cart', async () => {
      const userId = 'user-1';
      const cart = await cartService.clearCart(userId);

      expect(cart.items).toHaveLength(0);
      expect(cart.totalItems).toBe(0);
      expect(cart.totalAmount).toBe(0);
    });
  });

  describe('getCart', () => {
    it('should return existing cart', async () => {
      const userId = 'user-1';
      const mockProduct = createMockProduct({ id: 'product-1' });

      mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

      await cartService.addToCart(userId, 'product-1', 2);
      const cart = await cartService.getCart(userId);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].id).toBe('product-1');
    });

    it('should create new cart for new user', async () => {
      const userId = 'new-user';
      const cart = await cartService.getCart(userId);

      expect(cart).toBeDefined();
      expect(cart.userId).toBe(userId);
      expect(cart.items).toHaveLength(0);
    });
  });

  describe('getCartSummary', () => {
    it('should return correct summary for cart with items', async () => {
      const userId = 'user-1';
      const product1 = createMockProduct({ id: 'product-1', price: 10.00 });
      const product2 = createMockProduct({ id: 'product-2', price: 20.00 });

      mockProductClient.getProduct = jest.fn()
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);

      await cartService.addToCart(userId, 'product-1', 2);
      await cartService.addToCart(userId, 'product-2', 3);

      const summary = await cartService.getCartSummary(userId);

      expect(summary.totalItems).toBe(5); // 2 + 3
      expect(summary.totalAmount).toBe(80.00); // 10*2 + 20*3
      expect(summary.itemCount).toBe(2); // 2 unique products
    });

    it('should return zeros for empty cart', async () => {
      const userId = 'user-1';
      const summary = await cartService.getCartSummary(userId);

      expect(summary.totalItems).toBe(0);
      expect(summary.totalAmount).toBe(0);
      expect(summary.itemCount).toBe(0);
    });
  });

  describe('totalAmount Rounding Assertions', () => {
    it('should always have totalAmount with at most 2 decimal places', async () => {
      const userId = 'user-1';
      const testCases = [
        { price: 0.01, quantity: 1 },
        { price: 0.99, quantity: 7 },
        { price: 1.23, quantity: 11 },
        { price: 10.99, quantity: 3 },
        { price: 99.99, quantity: 99 },
      ];

      for (const testCase of testCases) {
        const mockProduct = createMockProduct({ id: `product-${testCase.price}`, price: testCase.price });
        mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

        const cart = await cartService.addToCart(userId, `product-${testCase.price}`, testCase.quantity);

        // Verify totalAmount is rounded to 2 decimal places
        const decimalPlaces = (cart.totalAmount.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);

        // Also verify using multiplication by 100
        expect(Number.isInteger(Math.round(cart.totalAmount * 100))).toBe(true);

        // Clear cart for next iteration
        await cartService.clearCart(userId);
      }
    });

    it('should maintain 2 decimal places after multiple operations', async () => {
      const userId = 'user-1';
      const product1 = createMockProduct({ id: 'product-1', price: 3.33 });
      const product2 = createMockProduct({ id: 'product-2', price: 6.67 });

      mockProductClient.getProduct = jest.fn()
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);

      await cartService.addToCart(userId, 'product-1', 3);
      await cartService.addToCart(userId, 'product-2', 3);
      await cartService.updateCartItem(userId, 'product-1', 5);
      const cart = await cartService.removeFromCart(userId, 'product-2');

      // 3.33 * 5 = 16.65
      expect(cart.totalAmount).toBe(16.65);
      const decimalPlaces = (cart.totalAmount.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });
});
