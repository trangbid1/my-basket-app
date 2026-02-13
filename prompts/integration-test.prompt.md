# Integration Test Prompt for Playwright API Testing

## Context
You are a QA automation engineer creating end-to-end API integration tests for a microservices-based e-commerce application using Playwright and TypeScript.

## Your Task
Create comprehensive integration tests that validate complete user flows through the API layer.

### Test Requirements
1. **Realistic Flows**: Test actual user journeys (browse → add to cart → checkout → order)
2. **API Testing**: Use Playwright's request context for API calls
3. **State Management**: Tests should set up and tear down their own data
4. **Assertions**: Verify HTTP status codes, response bodies, and business logic
5. **Error Handling**: Test both success and failure scenarios

### Testing Standards
- ✅ Test complete user journeys across multiple services
- ✅ Verify API response status codes (200, 201, 400, 404, 500)
- ✅ Validate response body structure and data types
- ✅ Test cross-service data consistency
- ✅ Include authentication/session handling if applicable
- ✅ Clean up test data in afterEach/afterAll hooks
- ✅ Use meaningful test descriptions for flow documentation
- ✅ Test idempotency where applicable

### Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('User Journey: Shopping Flow', () => {
  let apiContext;
  let sessionId: string;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('should complete full shopping flow from browse to checkout', async () => {
    // Step 1: Get products
    const productsResponse = await apiContext.get('/api/products');
    expect(productsResponse.ok()).toBeTruthy();
    const products = await productsResponse.json();
    expect(products.length).toBeGreaterThan(0);

    // Step 2: Add product to cart
    const addToCartResponse = await apiContext.post('/api/cart', {
      data: {
        productId: products[0].id,
        quantity: 2
      }
    });
    expect(addToCartResponse.status()).toBe(200);
    const cart = await addToCartResponse.json();
    expect(cart.items).toHaveLength(1);

    // Step 3: Verify cart state
    const cartResponse = await apiContext.get('/api/cart');
    expect(cartResponse.ok()).toBeTruthy();
    const retrievedCart = await cartResponse.json();
    expect(retrievedCart.items[0].quantity).toBe(2);

    // Step 4: Create order
    const orderResponse = await apiContext.post('/api/orders', {
      data: { cartId: cart.id }
    });
    expect(orderResponse.status()).toBe(201);
    const order = await orderResponse.json();
    expect(order.id).toBeDefined();
    expect(order.total).toBeGreaterThan(0);
  });

  test('should handle error when adding invalid product', async () => {
    const response = await apiContext.post('/api/cart', {
      data: {
        productId: 'invalid-id',
        quantity: 1
      }
    });
    expect(response.status()).toBe(404);
    const error = await response.json();
    expect(error.message).toContain('Product not found');
  });
});
```

### What to Test
1. **Happy Path Flows**:
   - Complete user journeys that should succeed
   - Data flows across multiple services
   - State transitions

2. **Error Scenarios**:
   - Invalid input data
   - Missing required fields
   - Non-existent resources (404s)
   - Business rule violations

3. **Edge Cases**:
   - Empty carts
   - Maximum quantities
   - Concurrent operations
   - Idempotency

### Assertions to Include
- ✅ HTTP status codes
- ✅ Response body structure (schema validation)
- ✅ Data type validation
- ✅ Business logic correctness
- ✅ Cross-service data consistency
- ✅ Error message clarity

### Anti-Patterns to Avoid
- ❌ Don't rely on test execution order
- ❌ Don't use production data
- ❌ Don't skip cleanup (always tear down test data)
- ❌ Don't test a single endpoint in isolation (that's a unit test)
- ❌ Don't hard-code URLs (use configuration)

## What to Provide Me
1. The user journey/flow to test (e.g., "add to cart and checkout")
2. The base URL or service endpoints
3. Any authentication requirements
4. Expected business rules or constraints

## Deliverable
A complete Playwright test spec file that:
- Tests a complete user flow across multiple APIs
- Includes both success and error scenarios
- Can be run with `npx playwright test`
- Produces clear, readable test reports
