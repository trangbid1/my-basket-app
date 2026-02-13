# Product Service API Test Plan

**Service:** Product Service  
**Base URL:** http://localhost:3001  
**API Version:** 1.0.0  
**Test Plan Version:** 1.0  
**Date:** February 13, 2026  
**Authentication:** None required

---

## Overview

This test plan covers comprehensive testing of the Product Service API, including the newly added `discount` field (numeric, 0-100 range). The plan includes happy path scenarios, edge cases, validation testing, and error handling.

---

## 1. GET /api/products - List All Products

### 1.1 Happy Path: Get All Products (Default Pagination)

**Test ID:** PROD-GET-001  
**Priority:** High  
**Description:** Retrieve all products with default pagination settings

**Request:**
```http
GET /api/products HTTP/1.1
Host: localhost:3001
```

**Expected Response:**
```json
{
  "products": [
    {
      "id": "1",
      "name": "Organic Apples",
      "price": 3.99,
      "description": "Crisp and juicy organic apples, perfect for snacking or baking.",
      "image": "https://placehold.co/300x200.png",
      "dataAiHint": "apples fruit",
      "category": "fruits",
      "inStock": true,
      "discount": 10,
      "createdAt": "2026-02-13T00:00:00.000Z",
      "updatedAt": "2026-02-13T00:00:00.000Z"
    },
    {
      "id": "2",
      "name": "Whole Wheat Bread",
      "price": 4.49,
      "description": "Freshly baked whole wheat bread, rich in fiber.",
      "image": "https://placehold.co/300x200.png",
      "dataAiHint": "bread bakery",
      "category": "bakery",
      "inStock": true,
      "discount": 5,
      "createdAt": "2026-02-13T00:00:00.000Z",
      "updatedAt": "2026-02-13T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Validation Criteria:**
- ✅ Status code: 200
- ✅ Response contains `products` array
- ✅ Response contains `pagination` object
- ✅ Each product has `discount` field (number, 0-100)
- ✅ `discount` field is present for all products
- ✅ All required fields present: id, name, price, description, image, dataAiHint
- ✅ Optional fields may be present: category, inStock, discount, createdAt, updatedAt

---

### 1.2 Happy Path: Get Products with Custom Pagination

**Test ID:** PROD-GET-002  
**Priority:** Medium  
**Description:** Retrieve products with custom page and limit

**Request:**
```http
GET /api/products?page=1&limit=5 HTTP/1.1
Host: localhost:3001
```

**Expected Response:**
```json
{
  "products": [
    // Array of 5 products
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 5,
    "totalPages": 2
  }
}
```

**Validation Criteria:**
- ✅ Status code: 200
- ✅ Products array length ≤ limit (5)
- ✅ Pagination values match request: page=1, limit=5
- ✅ All products have discount field

---

### 1.3 Happy Path: Filter by Category

**Test ID:** PROD-GET-003  
**Priority:** High  
**Description:** Filter products by category

**Request:**
```http
GET /api/products?category=fruits HTTP/1.1
Host: localhost:3001
```

**Validation Criteria:**
- ✅ Status code: 200
- ✅ All returned products have category="fruits"
- ✅ All products have discount field

---

### 1.4 Happy Path: Filter by Price Range

**Test ID:** PROD-GET-004  
**Priority:** Medium  
**Description:** Filter products by minimum and maximum price

**Request:**
```http
GET /api/products?minPrice=3&maxPrice=5 HTTP/1.1
Host: localhost:3001
```

**Validation Criteria:**
- ✅ Status code: 200
- ✅ All returned products have price ≥ 3 and price ≤ 5
- ✅ All products have discount field

---

### 1.5 Happy Path: Search Products

**Test ID:** PROD-GET-005  
**Priority:** Medium  
**Description:** Search products by name/description

**Request:**
```http
GET /api/products?search=organic HTTP/1.1
Host: localhost:3001
```

**Validation Criteria:**
- ✅ Status code: 200
- ✅ All returned products contain "organic" in name or description (case-insensitive)
- ✅ All products have discount field

---

### 1.6 Edge Case: Invalid Pagination

**Test ID:** PROD-GET-006  
**Priority:** Medium  
**Description:** Test invalid pagination parameters

**Request:**
```http
GET /api/products?page=0&limit=150 HTTP/1.1
Host: localhost:3001
```

**Expected Response:**
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "page",
      "message": "Number must be greater than 0"
    },
    {
      "field": "limit",
      "message": "Number must be less than or equal to 100"
    }
  ]
}
```

**Validation Criteria:**
- ✅ Status code: 400
- ✅ Response contains error message
- ✅ Validation details explain the issues

---

## 2. GET /api/products/:id - Get Single Product

### 2.1 Happy Path: Get Product by Valid ID

**Test ID:** PROD-GET-ID-001  
**Priority:** High  
**Description:** Retrieve a single product by its ID, verify discount field

**Request:**
```http
GET /api/products/1 HTTP/1.1
Host: localhost:3001
```

**Expected Response:**
```json
{
  "id": "1",
  "name": "Organic Apples",
  "price": 3.99,
  "description": "Crisp and juicy organic apples, perfect for snacking or baking.",
  "image": "https://placehold.co/300x200.png",
  "dataAiHint": "apples fruit",
  "category": "fruits",
  "inStock": true,
  "discount": 10,
  "createdAt": "2026-02-13T00:00:00.000Z",
  "updatedAt": "2026-02-13T00:00:00.000Z"
}
```

**Validation Criteria:**
- ✅ Status code: 200
- ✅ Product object returned (not array)
- ✅ `discount` field is present and is a number
- ✅ `discount` value is 10 (within 0-100 range)
- ✅ All required fields present
- ✅ Product ID matches requested ID

---

### 2.2 Happy Path: Get Products with Different Discount Values

**Test ID:** PROD-GET-ID-002  
**Priority:** High  
**Description:** Verify discount field for multiple products

**Test Cases:**

| Product ID | Expected Discount | Description |
|------------|-------------------|-------------|
| 1 | 10 | Organic Apples |
| 2 | 5 | Whole Wheat Bread |
| 3 | 15 | Free-Range Eggs |
| 4 | 0 | Organic Spinach (no discount) |
| 5 | 20 | Almond Milk |
| 6 | 25 | Chicken Breast |
| 7 | 12 | Quinoa |
| 8 | 8 | Greek Yogurt |

**Request Example:**
```http
GET /api/products/3 HTTP/1.1
Host: localhost:3001
```

**Validation Criteria (for each):**
- ✅ Status code: 200
- ✅ `discount` field present
- ✅ `discount` value matches expected value
- ✅ `discount` is within 0-100 range

---

### 2.3 Edge Case: Product Not Found

**Test ID:** PROD-GET-ID-003  
**Priority:** High  
**Description:** Request a non-existent product ID

**Request:**
```http
GET /api/products/999999 HTTP/1.1
Host: localhost:3001
```

**Expected Response:**
```json
{
  "error": "Product not found"
}
```

**Validation Criteria:**
- ✅ Status code: 404
- ✅ Error message indicates product not found

---

## 3. POST /api/products - Create Product with Discount

### 3.1 Happy Path: Create Product with Valid Discount (10%)

**Test ID:** PROD-POST-001  
**Priority:** High  
**Description:** Create a new product with a 10% discount

**Request:**
```http
POST /api/products HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "name": "Premium Coffee Beans",
  "price": 12.99,
  "description": "Freshly roasted Arabica coffee beans from Colombia",
  "image": "https://placehold.co/300x200.png",
  "dataAiHint": "coffee beans beverage",
  "category": "beverages",
  "inStock": true,
  "discount": 10
}
```

**Expected Response:**
```json
{
  "id": "9",
  "name": "Premium Coffee Beans",
  "price": 12.99,
  "description": "Freshly roasted Arabica coffee beans from Colombia",
  "image": "https://placehold.co/300x200.png",
  "dataAiHint": "coffee beans beverage",
  "category": "beverages",
  "inStock": true,
  "discount": 10,
  "createdAt": "2026-02-13T12:00:00.000Z",
  "updatedAt": "2026-02-13T12:00:00.000Z"
}
```

**Validation Criteria:**
- ✅ Status code: 201
- ✅ Product created successfully
- ✅ `discount` field is 10
- ✅ Response includes generated ID
- ✅ All fields match request data
- ✅ `createdAt` and `updatedAt` timestamps present

---

### 3.2 Happy Path: Create Product with 0% Discount (Minimum)

**Test ID:** PROD-POST-002  
**Priority:** High  
**Description:** Create product with minimum discount value (0)

**Request:**
```http
POST /api/products HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "name": "Mineral Water",
  "price": 1.99,
  "description": "Pure mineral water from natural springs",
  "image": "https://placehold.co/300x200.png",
  "dataAiHint": "water beverage",
  "category": "beverages",
  "inStock": true,
  "discount": 0
}
```

**Validation Criteria:**
- ✅ Status code: 201
- ✅ `discount` field is 0
- ✅ Product created successfully

---

### 3.3 Happy Path: Create Product with 100% Discount (Maximum)

**Test ID:** PROD-POST-003  
**Priority:** High  
**Description:** Create product with maximum discount value (100)

**Request:**
```http
POST /api/products HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "name": "Clearance Item",
  "price": 9.99,
  "description": "Final clearance sale item",
  "image": "https://placehold.co/300x200.png",
  "dataAiHint": "clearance sale",
  "category": "clearance",
  "inStock": true,
  "discount": 100
}
```

**Validation Criteria:**
- ✅ Status code: 201
- ✅ `discount` field is 100
- ✅ Product created successfully

---

### 3.4 Happy Path: Create Product with Mid-Range Discounts

**Test ID:** PROD-POST-004  
**Priority:** Medium  
**Description:** Create products with various mid-range discount values

**Test Cases:**

| Discount | Product Name | Expected Result |
|----------|--------------|-----------------|
| 25 | "Flash Sale Item" | Success (201) |
| 50 | "Half Price Special" | Success (201) |
| 75 | "Mega Discount Product" | Success (201) |

**Request Example (25% discount):**
```http
POST /api/products HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "name": "Flash Sale Item",
  "price": 19.99,
  "description": "Limited time flash sale",
  "image": "https://placehold.co/300x200.png",
  "dataAiHint": "flash sale",
  "category": "deals",
  "inStock": true,
  "discount": 25
}
```

**Validation Criteria:**
- ✅ Status code: 201
- ✅ `discount` field matches request value

---

### 3.5 Happy Path: Create Product Without Discount (Optional Field)

**Test ID:** PROD-POST-005  
**Priority:** High  
**Description:** Create product without specifying discount field

**Request:**
```http
POST /api/products HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "name": "Regular Priced Item",
  "price": 8.99,
  "description": "Product with no discount",
  "image": "https://placehold.co/300x200.png",
  "dataAiHint": "regular product",
  "category": "general",
  "inStock": true
}
```

**Validation Criteria:**
- ✅ Status code: 201
- ✅ Product created successfully
- ✅ `discount` field may be undefined, null, or 0

---

## 4. Discount Field Validation Tests

### 4.1 Validation: Negative Discount Value

**Test ID:** PROD-VALID-001  
**Priority:** High  
**Description:** Attempt to create product with negative discount

**Request:**
```http
POST /api/products HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "name": "Invalid Discount Product",
  "price": 10.99,
  "description": "Testing negative discount",
  "image": "https://placehold.co/300x200.png",
  "dataAiHint": "test",
  "discount": -10
}
```

**Expected Response:**
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "discount",
      "message": "Discount must be between 0 and 100"
    }
  ]
}
```

**Validation Criteria:**
- ✅ Status code: 400
- ✅ Error indicates invalid discount range
- ✅ Product not created

---

### 4.2 Validation: Discount Over 100

**Test ID:** PROD-VALID-002  
**Priority:** High  
**Description:** Attempt to create product with discount > 100

**Request:**
```http
POST /api/products HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "name": "Invalid Discount Product",
  "price": 10.99,
  "description": "Testing excessive discount",
  "image": "https://placehold.co/300x200.png",
  "dataAiHint": "test",
  "discount": 150
}
```

**Expected Response:**
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "discount",
      "message": "Discount must be between 0 and 100"
    }
  ]
}
```

**Validation Criteria:**
- ✅ Status code: 400
- ✅ Error indicates invalid discount range
- ✅ Product not created

---

### 4.3 Validation: Non-Numeric Discount Value

**Test ID:** PROD-VALID-003  
**Priority:** High  
**Description:** Attempt to create product with non-numeric discount

**Request:**
```http
POST /api/products HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "name": "Invalid Discount Product",
  "price": 10.99,
  "description": "Testing string discount",
  "image": "https://placehold.co/300x200.png",
  "dataAiHint": "test",
  "discount": "twenty"
}
```

**Expected Response:**
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "discount",
      "message": "Expected number, received string"
    }
  ]
}
```

**Validation Criteria:**
- ✅ Status code: 400
- ✅ Error indicates type mismatch
- ✅ Product not created

---

### 4.4 Validation: Decimal Discount Values

**Test ID:** PROD-VALID-004  
**Priority:** Medium  
**Description:** Test if decimal discount values are accepted

**Request:**
```http
POST /api/products HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "name": "Decimal Discount Product",
  "price": 15.99,
  "description": "Testing decimal discount",
  "image": "https://placehold.co/300x200.png",
  "dataAiHint": "test",
  "discount": 12.5
}
```

**Validation Criteria:**
- ✅ Status code: 201 (if decimals accepted) OR 400 (if only integers accepted)
- ✅ If accepted: `discount` field is 12.5
- ✅ If rejected: Error message explains integer requirement

---

### 4.5 Validation: Boundary Values

**Test ID:** PROD-VALID-005  
**Priority:** High  
**Description:** Test boundary values for discount

**Test Cases:**

| Discount Value | Expected Result | Notes |
|----------------|-----------------|-------|
| -0.001 | 400 - Validation Error | Just below minimum |
| 0 | 201 - Success | Minimum valid value |
| 0.001 | 201 or 400 | Depends on decimal support |
| 50 | 201 - Success | Mid-range |
| 99.999 | 201 or 400 | Just below maximum |
| 100 | 201 - Success | Maximum valid value |
| 100.001 | 400 - Validation Error | Just above maximum |

---

## 5. Additional Test Scenarios

### 5.1 Create Product with Missing Required Fields

**Test ID:** PROD-POST-006  
**Priority:** High  
**Description:** Verify validation of required fields

**Request:**
```http
POST /api/products HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "name": "Incomplete Product",
  "discount": 15
}
```

**Validation Criteria:**
- ✅ Status code: 400
- ✅ Error lists missing required fields (price, description, image, dataAiHint)

---

### 5.2 Verify Discount Field in Product List Response

**Test ID:** PROD-GET-007  
**Priority:** High  
**Description:** Ensure all products in list have discount field

**Request:**
```http
GET /api/products HTTP/1.1
Host: localhost:3001
```

**Validation Criteria:**
- ✅ Status code: 200
- ✅ Each product in array has `discount` property
- ✅ All discount values are numbers or null/undefined
- ✅ All discount values are within 0-100 range (if present)

---

## 6. Health Check Endpoint

### 6.1 Service Health Check

**Test ID:** PROD-HEALTH-001  
**Priority:** High  
**Description:** Verify service health endpoint

**Request:**
```http
GET /api/health HTTP/1.1
Host: localhost:3001
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "product-service",
  "timestamp": "2026-02-13T12:00:00.000Z"
}
```

**Validation Criteria:**
- ✅ Status code: 200
- ✅ Status field is "healthy"
- ✅ Service name is correct
- ✅ Timestamp is recent

---

## 7. Test Data Summary

### Sample Products with Discounts

| ID | Product Name | Price | Discount |
|----|--------------|-------|----------|
| 1 | Organic Apples | 3.99 | 10 |
| 2 | Whole Wheat Bread | 4.49 | 5 |
| 3 | Free-Range Eggs | 5.99 | 15 |
| 4 | Organic Spinach | 2.99 | 0 |
| 5 | Almond Milk | 4.99 | 20 |
| 6 | Chicken Breast | 8.99 | 25 |
| 7 | Quinoa | 6.49 | 12 |
| 8 | Greek Yogurt | 3.49 | 8 |

---

## 8. Test Execution Checklist

### Prerequisites
- [ ] Product Service is running on http://localhost:3001
- [ ] Service is healthy (GET /api/health returns 200)
- [ ] Test environment is isolated
- [ ] Sample data is loaded

### GET /api/products Tests
- [ ] PROD-GET-001: Default pagination
- [ ] PROD-GET-002: Custom pagination
- [ ] PROD-GET-003: Filter by category
- [ ] PROD-GET-004: Filter by price range
- [ ] PROD-GET-005: Search products
- [ ] PROD-GET-006: Invalid pagination
- [ ] PROD-GET-007: Verify discount field in all products

### GET /api/products/:id Tests
- [ ] PROD-GET-ID-001: Get product by valid ID
- [ ] PROD-GET-ID-002: Verify discount for all sample products
- [ ] PROD-GET-ID-003: Product not found (404)

### POST /api/products Tests
- [ ] PROD-POST-001: Create with 10% discount
- [ ] PROD-POST-002: Create with 0% discount (minimum)
- [ ] PROD-POST-003: Create with 100% discount (maximum)
- [ ] PROD-POST-004: Create with mid-range discounts (25, 50, 75)
- [ ] PROD-POST-005: Create without discount field
- [ ] PROD-POST-006: Missing required fields

### Discount Validation Tests
- [ ] PROD-VALID-001: Negative discount value
- [ ] PROD-VALID-002: Discount over 100
- [ ] PROD-VALID-003: Non-numeric discount
- [ ] PROD-VALID-004: Decimal discount values
- [ ] PROD-VALID-005: Boundary values

### Health Check
- [ ] PROD-HEALTH-001: Service health check

---

## 9. Expected Test Coverage

### Total Test Cases: 26

**By Priority:**
- High: 18 tests
- Medium: 8 tests

**By Category:**
- GET /api/products: 7 tests
- GET /api/products/:id: 3 tests
- POST /api/products: 6 tests
- Discount Validation: 5 tests
- Other: 5 tests

**Discount Field Coverage:**
- Minimum value (0): ✅
- Maximum value (100): ✅
- Mid-range values (5, 10, 12, 15, 20, 25, 50, 75): ✅
- Invalid negative: ✅
- Invalid over 100: ✅
- Invalid non-numeric: ✅
- Optional field (not provided): ✅
- Decimal values: ✅

---

## 10. Notes and Recommendations

### Current Implementation Status
Based on the service code review:
- ✅ Discount field is defined in Product type (0-100 range)
- ✅ Discount field is included in OpenAPI schema
- ✅ Sample products include various discount values
- ⚠️ CreateProductSchema validation does NOT include discount validation (as of review date)
- ⚠️ No authentication/authorization implemented

### Recommendations
1. **Add Discount Validation**: Update CreateProductSchema to include:
   ```typescript
   discount: z.number().min(0).max(100).optional()
   ```

2. **Consider Decimal Precision**: Decide if discount should accept decimals (e.g., 12.5%) or only integers

3. **Default Discount Value**: Consider setting default discount to 0 if not provided

4. **Update Documentation**: Ensure all API consumers are aware of the new discount field

5. **Monitor Performance**: Track API response times after discount field addition

6. **Future Enhancements**: Consider adding:
   - Discount start/end dates
   - Discount types (percentage vs. fixed amount)
   - Bulk discount updates

---

## Appendix: cURL Commands for Quick Testing

### Get all products
```bash
curl http://localhost:3001/api/products
```

### Get product by ID
```bash
curl http://localhost:3001/api/products/1
```

### Create product with discount
```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "price": 9.99,
    "description": "Test description",
    "image": "https://placehold.co/300x200.png",
    "dataAiHint": "test",
    "discount": 15
  }'
```

### Test invalid discount
```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "price": 9.99,
    "description": "Test description",
    "image": "https://placehold.co/300x200.png",
    "dataAiHint": "test",
    "discount": 150
  }'
```

---

**End of Test Plan**
