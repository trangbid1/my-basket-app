/**
 * Cart Service Unit Tests
 * Generated using unit-test.prompt.md
 * 
 * Testing Strategy:
 * - All external dependencies (ProductServiceClient) are mocked
 * - Tests follow AAA pattern (Arrange, Act, Assert)
 * - Each test is isolated and independent
 * - Tests cover happy paths, error scenarios, and edge cases
 */

import { CartService } from './service';
import { ProductServiceClient } from './product-client';
import { Product, Cart, CartSummary } from './types';

jest.mock('./product-client');

describe('CartService - Comprehensive Unit Tests', () => {
  let cartService: CartService;
  let mockProductClient: jest.Mocked<ProductServiceClient>;

  // Test data factory for consistent mock products
  const createMockProduct = (id: string, price: number, name: string = 'Test Product'): Product => ({
    id,
    name,
    price,
    description: `Description for ${name}`,
    image: `https://example.com/${id}.jpg`,
    dataAiHint: `test ${name}`,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cartService = new CartService();
    mockProductClient = (cartService as any).productClient as jest.Mocked<ProductServiceClient>;
  });

  // ===== CREATE/GET CART TESTS =====
  describe('getOrCreateCart', () => {
    it('should create a new cart when user has no existing cart', async () => {
      // Arrange
      const userId = 'new-user-123';

      // Act
      const cart = await cartService.getOrCreateCart(userId);

      // Assert
      expect(cart).toMatchObject({
        userId,
        items: [],
        totalAmount: 0,
        totalItems: 0,
      });
      expect(cart.id).toBeDefined();
      expect(cart.createdAt).toBeInstanceOf(Date);
      expect(cart.updatedAt).toBeInstanceOf(Date);
    });

    it('should return existing cart when called multiple times for same user', async () => {
      // Arrange
      const userId = 'existing-user-456';

      // Act
      const cart1 = await cartService.getOrCreateCart(userId);
      const cart2 = await cartService.getOrCreateCart(userId);

      // Assert
      expect(cart1.id).toBe(cart2.id);
      expect(cart1).toBe(cart2); // Same reference
    });

    it('should create separate carts for different users', async () => {
      // Arrange
      const user1 = 'user-1';
      const user2 = 'user-2';

      // Act
      const cart1 = await cartService.getOrCreateCart(user1);
      const cart2 = await cartService.getOrCreateCart(user2);

      // Assert
      expect(cart1.id).not.toBe(cart2.id);
      expect(cart1.userId).toBe(user1);
      expect(cart2.userId).toBe(user2);
    });
  });

  // ===== ADD TO CART TESTS =====
  describe('addToCart', () => {
    describe('happy path scenarios', () => {
      it('should add valid product to empty cart with default quantity', async () => {
        // Arrange
        const userId = 'user-1';
        const product = createMockProduct('prod-1', 29.99, 'Laptop');
        mockProductClient.getProduct = jest.fn().mockResolvedValue(product);

        // Act
        const cart = await cartService.addToCart(userId, 'prod-1');

        // Assert
        expect(mockProductClient.getProduct).toHaveBeenCalledWith('prod-1');
        expect(mockProductClient.getProduct).toHaveBeenCalledTimes(1);
        expect(cart.items).toHaveLength(1);
        expect(cart.items[0]).toMatchObject({
          id: 'prod-1',
          name: 'Laptop',
          price: 29.99,
          quantity: 1,
        });
        expect(cart.totalItems).toBe(1);
        expect(cart.totalAmount).toBe(29.99);
      });

      it('should add product with specified quantity', async () => {
        // Arrange
        const userId = 'user-1';
        const product = createMockProduct('prod-1', 15.00, 'Book');
        mockProductClient.getProduct = jest.fn().mockResolvedValue(product);

        // Act
        const cart = await cartService.addToCart(userId, 'prod-1', 5);

        // Assert
        expect(cart.items[0].quantity).toBe(5);
        expect(cart.totalItems).toBe(5);
        expect(cart.totalAmount).toBe(75.00);
      });

      it('should increment quantity when adding existing product', async () => {
        // Arrange
        const userId = 'user-1';
        const product = createMockProduct('prod-1', 10.00, 'Widget');
        mockProductClient.getProduct = jest.fn().mockResolvedValue(product);

        // Act
        await cartService.addToCart(userId, 'prod-1', 2);
        const cart = await cartService.addToCart(userId, 'prod-1', 3);

        // Assert
        expect(cart.items).toHaveLength(1); // Still one unique item
        expect(cart.items[0].quantity).toBe(5); // 2 + 3
        expect(cart.totalItems).toBe(5);
        expect(cart.totalAmount).toBe(50.00);
      });

      it('should add multiple different products to cart', async () => {
        // Arrange
        const userId = 'user-1';
        const product1 = createMockProduct('prod-1', 10.00, 'Item A');
        const product2 = createMockProduct('prod-2', 25.50, 'Item B');
        mockProductClient.getProduct = jest.fn()
          .mockResolvedValueOnce(product1)
          .mockResolvedValueOnce(product2);

        // Act
        await cartService.addToCart(userId, 'prod-1', 2);
        const cart = await cartService.addToCart(userId, 'prod-2', 1);

        // Assert
        expect(cart.items).toHaveLength(2);
        expect(cart.totalItems).toBe(3); // 2 + 1
        expect(cart.totalAmount).toBe(45.50); // 20.00 + 25.50
      });

      it('should update cart updatedAt timestamp when adding product', async () => {
        // Arrange
        const userId = 'user-1';
        const product = createMockProduct('prod-1', 10.00);
        mockProductClient.getProduct = jest.fn().mockResolvedValue(product);
        const beforeTime = Date.now();

        // Act
        const cart = await cartService.addToCart(userId, 'prod-1');

        // Assert
        expect(cart.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime);
        expect(cart.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('error scenarios', () => {
      it('should throw error when product does not exist', async () => {
        // Arrange
        const userId = 'user-1';
        mockProductClient.getProduct = jest.fn().mockResolvedValue(null);

        // Act & Assert
        await expect(
          cartService.addToCart(userId, 'invalid-product-id')
        ).rejects.toThrow('Product not found');
        
        expect(mockProductClient.getProduct).toHaveBeenCalledWith('invalid-product-id');
      });
    });

    describe('edge cases', () => {
      it('should handle adding product with zero price', async () => {
        // Arrange
        const userId = 'user-1';
        const freeProduct = createMockProduct('prod-free', 0, 'Free Sample');
        mockProductClient.getProduct = jest.fn().mockResolvedValue(freeProduct);

        // Act
        const cart = await cartService.addToCart(userId, 'prod-free', 1);

        // Assert
        expect(cart.totalAmount).toBe(0);
        expect(cart.items).toHaveLength(1);
      });

      it('should correctly round total amount to 2 decimal places', async () => {
        // Arrange
        const userId = 'user-1';
        const product = createMockProduct('prod-1', 10.33, 'Item');
        mockProductClient.getProduct = jest.fn().mockResolvedValue(product);

        // Act
        const cart = await cartService.addToCart(userId, 'prod-1', 3);

        // Assert
        expect(cart.totalAmount).toBe(30.99); // 10.33 * 3 = 30.99
      });
    });
  });

  // ===== UPDATE CART ITEM TESTS =====
  describe('updateCartItem', () => {
    it('should update quantity of existing cart item', async () => {
      // Arrange
      const userId = 'user-1';
      const product = createMockProduct('prod-1', 20.00);
      mockProductClient.getProduct = jest.fn().mockResolvedValue(product);
      await cartService.addToCart(userId, 'prod-1', 2);

      // Act
      const cart = await cartService.updateCartItem(userId, 'prod-1', 5);

      // Assert
      expect(cart.items[0].quantity).toBe(5);
      expect(cart.totalItems).toBe(5);
      expect(cart.totalAmount).toBe(100.00);
    });

    it('should remove item when quantity is set to zero', async () => {
      // Arrange
      const userId = 'user-1';
      const product = createMockProduct('prod-1', 15.00);
      mockProductClient.getProduct = jest.fn().mockResolvedValue(product);
      await cartService.addToCart(userId, 'prod-1', 3);

      // Act
      const cart = await cartService.updateCartItem(userId, 'prod-1', 0);

      // Assert
      expect(cart.items).toHaveLength(0);
      expect(cart.totalItems).toBe(0);
      expect(cart.totalAmount).toBe(0);
    });

    it('should remove item when quantity is negative', async () => {
      // Arrange
      const userId = 'user-1';
      const product = createMockProduct('prod-1', 15.00);
      mockProductClient.getProduct = jest.fn().mockResolvedValue(product);
      await cartService.addToCart(userId, 'prod-1', 3);

      // Act
      const cart = await cartService.updateCartItem(userId, 'prod-1', -1);

      // Assert
      expect(cart.items).toHaveLength(0);
    });

    it('should throw error when updating non-existent item', async () => {
      // Arrange
      const userId = 'user-1';

      // Act & Assert
      await expect(
        cartService.updateCartItem(userId, 'non-existent-product', 5)
      ).rejects.toThrow('Item not found in cart');
    });

    it('should update totals correctly when updating item quantity', async () => {
      // Arrange
      const userId = 'user-1';
      const prod1 = createMockProduct('prod-1', 10.00);
      const prod2 = createMockProduct('prod-2', 20.00);
      mockProductClient.getProduct = jest.fn()
        .mockResolvedValueOnce(prod1)
        .mockResolvedValueOnce(prod2);
      await cartService.addToCart(userId, 'prod-1', 2);
      await cartService.addToCart(userId, 'prod-2', 1);

      // Act
      const cart = await cartService.updateCartItem(userId, 'prod-1', 10);

      // Assert
      expect(cart.totalItems).toBe(11); // 10 + 1
      expect(cart.totalAmount).toBe(120.00); // (10*10) + (20*1)
    });
  });

  // ===== REMOVE FROM CART TESTS =====
  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      // Arrange
      const userId = 'user-1';
      const product = createMockProduct('prod-1', 30.00);
      mockProductClient.getProduct = jest.fn().mockResolvedValue(product);
      await cartService.addToCart(userId, 'prod-1', 2);

      // Act
      const cart = await cartService.removeFromCart(userId, 'prod-1');

      // Assert
      expect(cart.items).toHaveLength(0);
      expect(cart.totalItems).toBe(0);
      expect(cart.totalAmount).toBe(0);
    });

    it('should only remove specified item and keep others', async () => {
      // Arrange
      const userId = 'user-1';
      const prod1 = createMockProduct('prod-1', 10.00);
      const prod2 = createMockProduct('prod-2', 20.00);
      mockProductClient.getProduct = jest.fn()
        .mockResolvedValueOnce(prod1)
        .mockResolvedValueOnce(prod2);
      await cartService.addToCart(userId, 'prod-1', 1);
      await cartService.addToCart(userId, 'prod-2', 2);

      // Act
      const cart = await cartService.removeFromCart(userId, 'prod-1');

      // Assert
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].id).toBe('prod-2');
      expect(cart.totalItems).toBe(2);
      expect(cart.totalAmount).toBe(40.00);
    });

    it('should handle removing non-existent item gracefully', async () => {
      // Arrange
      const userId = 'user-1';
      const product = createMockProduct('prod-1', 15.00);
      mockProductClient.getProduct = jest.fn().mockResolvedValue(product);
      await cartService.addToCart(userId, 'prod-1', 1);

      // Act
      const cart = await cartService.removeFromCart(userId, 'non-existent-id');

      // Assert - cart should remain unchanged
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].id).toBe('prod-1');
    });

    it('should update updatedAt timestamp when removing item', async () => {
      // Arrange
      const userId = 'user-1';
      const product = createMockProduct('prod-1', 10.00);
      mockProductClient.getProduct = jest.fn().mockResolvedValue(product);
      await cartService.addToCart(userId, 'prod-1', 1);
      const beforeRemove = Date.now();

      // Act
      const cart = await cartService.removeFromCart(userId, 'prod-1');

      // Assert
      expect(cart.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeRemove);
    });
  });

  // ===== CLEAR CART TESTS =====
  describe('clearCart', () => {
    it('should remove all items from cart', async () => {
      // Arrange
      const userId = 'user-1';
      const prod1 = createMockProduct('prod-1', 10.00);
      const prod2 = createMockProduct('prod-2', 20.00);
      mockProductClient.getProduct = jest.fn()
        .mockResolvedValueOnce(prod1)
        .mockResolvedValueOnce(prod2);
      await cartService.addToCart(userId, 'prod-1', 5);
      await cartService.addToCart(userId, 'prod-2', 3);

      // Act
      const cart = await cartService.clearCart(userId);

      // Assert
      expect(cart.items).toHaveLength(0);
      expect(cart.totalItems).toBe(0);
      expect(cart.totalAmount).toBe(0);
    });

    it('should handle clearing an already empty cart', async () => {
      // Arrange
      const userId = 'user-1';
      await cartService.getOrCreateCart(userId);

      // Act
      const cart = await cartService.clearCart(userId);

      // Assert
      expect(cart.items).toHaveLength(0);
      expect(cart.totalItems).toBe(0);
      expect(cart.totalAmount).toBe(0);
    });

    it('should preserve cart ID when clearing', async () => {
      // Arrange
      const userId = 'user-1';
      const product = createMockProduct('prod-1', 10.00);
      mockProductClient.getProduct = jest.fn().mockResolvedValue(product);
      await cartService.addToCart(userId, 'prod-1', 1);
      const originalCart = await cartService.getCart(userId);

      // Act
      const clearedCart = await cartService.clearCart(userId);

      // Assert
      expect(clearedCart.id).toBe(originalCart.id);
      expect(clearedCart.userId).toBe(userId);
    });
  });

  // ===== GET CART SUMMARY TESTS =====
  describe('getCartSummary', () => {
    it('should return correct summary for cart with items', async () => {
      // Arrange
      const userId = 'user-1';
      const prod1 = createMockProduct('prod-1', 10.50);
      const prod2 = createMockProduct('prod-2', 25.00);
      mockProductClient.getProduct = jest.fn()
        .mockResolvedValueOnce(prod1)
        .mockResolvedValueOnce(prod2);
      await cartService.addToCart(userId, 'prod-1', 3);
      await cartService.addToCart(userId, 'prod-2', 2);

      // Act
      const summary: CartSummary = await cartService.getCartSummary(userId);

      // Assert
      expect(summary).toEqual({
        totalItems: 5, // 3 + 2
        totalAmount: 81.50, // (10.50 * 3) + (25.00 * 2)
        itemCount: 2, // 2 unique items
      });
    });

    it('should return zero values for empty cart', async () => {
      // Arrange
      const userId = 'new-user';

      // Act
      const summary = await cartService.getCartSummary(userId);

      // Assert
      expect(summary).toEqual({
        totalItems: 0,
        totalAmount: 0,
        itemCount: 0,
      });
    });

    it('should differentiate between totalItems and itemCount', async () => {
      // Arrange
      const userId = 'user-1';
      const product = createMockProduct('prod-1', 5.00);
      mockProductClient.getProduct = jest.fn().mockResolvedValue(product);
      await cartService.addToCart(userId, 'prod-1', 10);

      // Act
      const summary = await cartService.getCartSummary(userId);

      // Assert
      expect(summary.totalItems).toBe(10); // Total quantity
      expect(summary.itemCount).toBe(1); // Unique products
    });
  });

  // ===== GET CART TESTS =====
  describe('getCart', () => {
    it('should return full cart for existing user', async () => {
      // Arrange
      const userId = 'user-1';
      const product = createMockProduct('prod-1', 15.00);
      mockProductClient.getProduct = jest.fn().mockResolvedValue(product);
      await cartService.addToCart(userId, 'prod-1', 2);

      // Act
      const cart = await cartService.getCart(userId);

      // Assert
      expect(cart.userId).toBe(userId);
      expect(cart.items).toHaveLength(1);
      expect(cart.totalAmount).toBe(30.00);
    });

    it('should create and return empty cart for new user', async () => {
      // Arrange
      const userId = 'brand-new-user';

      // Act
      const cart = await cartService.getCart(userId);

      // Assert
      expect(cart.userId).toBe(userId);
      expect(cart.items).toHaveLength(0);
      expect(cart.totalAmount).toBe(0);
    });
  });
});
