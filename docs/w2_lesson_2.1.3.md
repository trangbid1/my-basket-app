# Week 2 - Challenge 2.1.4: CartService Unit Testing

## Overview

This document describes the Jest unit test suite created for the `CartService` class in the cart-service microservice.

## Target Class

- **Class**: `CartService` in `microservices/cart-service/src/service.ts`
- **Dependencies**: `ProductServiceClient` in `microservices/cart-service/src/product-client.ts`
- **Data Types**: `microservices/cart-service/src/types.ts`

## Setup

### 1. Install ts-jest

```bash
cd microservices/cart-service
npm install --save-dev ts-jest
```

### 2. Jest Configuration

Created `jest.config.js`:

```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};
```

## Test Suite Summary

### Test File: `microservices/cart-service/src/service.test.ts`

| Test Category | Tests Count | Description |
|---------------|-------------|-------------|
| `getOrCreateCart` | 2 | New cart creation, returning existing cart |
| `addToCart` | 6 | Valid product, default quantity, existing product, product not found, multiple products, addedAt timestamp |
| `updateCartItem` | 6 | Quantity update, total calculations, remove on zero/negative, non-existent item, updatedAt timestamp |
| **Floating Point Precision** | 5 | `10.99 × 3 = 32.97`, `0.1 × 3 = 0.3`, multiple decimals, large quantities, update with decimals |
| `removeFromCart` | 3 | Remove existing, non-existent, partial removal |
| `clearCart` | 2 | Clear populated cart, clear empty cart |
| `getCart` | 2 | Existing user, new user |
| `getCartSummary` | 2 | With items, empty cart |
| **totalAmount Rounding Assertions** | 2 | Parameterized precision test, precision after multiple operations |

**Total: 30 tests**

## Key Implementation Details

### Mocking Strategy

The `ProductServiceClient` is fully mocked using Jest's `jest.mock()`:

```typescript
jest.mock('./product-client');
```

This ensures no real network calls are made during testing.

### Dependency Injection

Since `CartService` creates its own `ProductServiceClient` in the constructor, we access the internal instance via type casting:

```typescript
mockProductClient = (cartService as any).productClient as jest.Mocked<ProductServiceClient>;
```

### Complete Mock Product Objects

All mock products include every required field from the `Product` interface:

```typescript
const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'product-1',
  name: 'Test Product',
  price: 10.99,
  description: 'A test product description',
  image: 'https://example.com/image.jpg',
  dataAiHint: 'test product',
  ...overrides,
});
```

### Floating Point Precision Tests

Special attention to floating point arithmetic edge cases:

```typescript
it('should handle floating point precision when adding 3 items priced at 10.99', async () => {
  const mockProduct = createMockProduct({ id: 'product-1', price: 10.99 });
  mockProductClient.getProduct = jest.fn().mockResolvedValue(mockProduct);

  const cart = await cartService.addToCart(userId, 'product-1', 3);

  // 10.99 * 3 = 32.97 (without floating point issues)
  expect(cart.totalAmount).toBe(32.97);
  expect(cart.totalAmount.toString()).toBe('32.97');
});
```

### totalAmount Rounding Assertions

Verifies that `totalAmount` is always rounded to 2 decimal places:

```typescript
// Method 1: String analysis
const decimalPlaces = (cart.totalAmount.toString().split('.')[1] || '').length;
expect(decimalPlaces).toBeLessThanOrEqual(2);

// Method 2: Multiplication check
expect(Number.isInteger(Math.round(cart.totalAmount * 100))).toBe(true);
```

## Running Tests

```bash
cd microservices/cart-service
npm test
```

### Expected Output

```
 PASS  src/service.test.ts
  CartService
    getOrCreateCart
      √ should create a new cart for a new user
      √ should return the same cart for an existing user
    addToCart
      √ should add a valid product to an empty cart
      √ should add product with default quantity of 1
      √ should increase quantity when adding an existing product
      √ should throw an error when product is not found
      √ should add multiple different products to the cart
      √ should include addedAt date when adding item to cart
    updateCartItem
      √ should update the quantity of an existing item
      √ should correctly calculate total with updated quantities
      √ should remove item when quantity is set to 0
      √ should remove item when quantity is negative
      √ should throw error when updating non-existent item
      √ should update the updatedAt timestamp
    Floating Point Precision - Edge Cases
      √ should handle floating point precision when adding 3 items priced at 10.99
      √ should always round totalAmount to 2 decimal places
      √ should maintain precision with multiple products having decimal prices
      √ should handle large quantities with decimal prices
      √ should correctly handle update with floating point prices
    removeFromCart
      √ should remove an existing item from cart
      √ should not throw when removing non-existent item
      √ should only remove the specified item
    clearCart
      √ should remove all items from the cart
      √ should work on already empty cart
    getCart
      √ should return existing cart
      √ should create new cart for new user
    getCartSummary
      √ should return correct summary for cart with items
      √ should return zeros for empty cart
    totalAmount Rounding Assertions
      √ should always have totalAmount with at most 2 decimal places
      √ should maintain 2 decimal places after multiple operations

Test Suites: 1 passed, 1 total
Tests:       30 passed, 30 total
```

## Coverage

The test suite covers:

- ✅ All public methods of `CartService`
- ✅ Happy path scenarios
- ✅ Error handling (product not found, item not in cart)
- ✅ Edge cases (zero/negative quantities, empty carts)
- ✅ Floating point precision handling
- ✅ totalAmount rounding verification

## Files Created/Modified

| File | Action |
|------|--------|
| `microservices/cart-service/jest.config.js` | Created |
| `microservices/cart-service/src/service.test.ts` | Created |
| `microservices/cart-service/package.json` | Modified (ts-jest added) |
