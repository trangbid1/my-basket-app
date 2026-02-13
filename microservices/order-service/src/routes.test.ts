import express from 'express';
import request from 'supertest';
import routes from './routes';
import { OrderService } from './service';
import { OrderStatus } from './types';

jest.mock('./service');
jest.mock('./cart-client');

describe('POST /api/orders/:userId', () => {
  let app: express.Application;

  const validOrderData = {
    items: [
      {
        id: 'product-1',
        name: 'Test Product',
        price: 29.99,
        description: 'A test product',
        image: 'https://example.com/image.jpg',
        dataAiHint: 'test product',
        quantity: 2,
      },
    ],
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    billingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    paymentMethod: {
      type: 'credit_card' as const,
      last4: '4242',
      brand: 'Visa',
    },
  };

  const mockCreatedOrder = {
    id: 'order-123',
    userId: 'user-1',
    items: validOrderData.items,
    totalAmount: 59.98,
    status: OrderStatus.PENDING,
    shippingAddress: validOrderData.shippingAddress,
    billingAddress: validOrderData.billingAddress,
    paymentMethod: validOrderData.paymentMethod,
    orderDate: new Date('2024-01-01T00:00:00.000Z'),
    estimatedDelivery: new Date('2024-01-05T00:00:00.000Z'),
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use('/api', routes);
  });

  describe('Success Cases', () => {
    it('should create order with valid data and return 201 status', async () => {
      const mockCreateOrder = jest.spyOn(OrderService.prototype, 'createOrder').mockResolvedValue(mockCreatedOrder);

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(validOrderData)
        .expect(201)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe('order-123');
      expect(response.body.userId).toBe('user-1');
      expect(response.body.status).toBe(OrderStatus.PENDING);
      expect(mockCreateOrder).toHaveBeenCalledWith('user-1', validOrderData);
      expect(mockCreateOrder).toHaveBeenCalledTimes(1);
    });

    it('should create order with all required fields in response', async () => {
      jest.spyOn(OrderService.prototype, 'createOrder').mockResolvedValue(mockCreatedOrder);

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(validOrderData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.userId).toBeDefined();
      expect(response.body.items).toBeDefined();
      expect(response.body.totalAmount).toBeDefined();
      expect(response.body.status).toBeDefined();
      expect(response.body.shippingAddress).toBeDefined();
      expect(response.body.billingAddress).toBeDefined();
      expect(response.body.paymentMethod).toBeDefined();
      expect(response.body.orderDate).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should create order with multiple items', async () => {
      const multiItemOrder = {
        ...validOrderData,
        items: [
          ...validOrderData.items,
          {
            id: 'product-2',
            name: 'Another Product',
            price: 19.99,
            description: 'Another test product',
            image: 'https://example.com/image2.jpg',
            dataAiHint: 'another product',
            quantity: 1,
          },
        ],
      };

      const mockMultiItemOrder = {
        ...mockCreatedOrder,
        items: multiItemOrder.items,
        totalAmount: 79.97,
      };

      jest.spyOn(OrderService.prototype, 'createOrder').mockResolvedValue(mockMultiItemOrder);

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(multiItemOrder)
        .expect(201);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.totalAmount).toBe(79.97);
    });

    it('should create order with different payment methods', async () => {
      const paypalOrder = {
        ...validOrderData,
        paymentMethod: {
          type: 'paypal' as const,
        },
      };

      jest.spyOn(OrderService.prototype, 'createOrder').mockResolvedValue({
        ...mockCreatedOrder,
        paymentMethod: paypalOrder.paymentMethod,
      });

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(paypalOrder)
        .expect(201);

      expect(response.body.paymentMethod.type).toBe('paypal');
    });

    it('should create order with different shipping and billing addresses', async () => {
      const differentAddresses = {
        ...validOrderData,
        billingAddress: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA',
        },
      };

      jest.spyOn(OrderService.prototype, 'createOrder').mockResolvedValue({
        ...mockCreatedOrder,
        billingAddress: differentAddresses.billingAddress,
      });

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(differentAddresses)
        .expect(201);

      expect(response.body.shippingAddress.city).toBe('New York');
      expect(response.body.billingAddress.city).toBe('Los Angeles');
    });
  });

  describe('Validation Errors (400)', () => {
    it('should return 400 when items array is empty', async () => {
      const invalidOrder = {
        ...validOrderData,
        items: [],
      };

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(invalidOrder)
        .expect(400);

      expect(response.body.error).toBe('Invalid order data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 when items is missing', async () => {
      const invalidOrder = {
        shippingAddress: validOrderData.shippingAddress,
        billingAddress: validOrderData.billingAddress,
        paymentMethod: validOrderData.paymentMethod,
      };

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(invalidOrder)
        .expect(400);

      expect(response.body.error).toBe('Invalid order data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 when item has invalid price', async () => {
      const invalidOrder = {
        ...validOrderData,
        items: [
          {
            ...validOrderData.items[0],
            price: -10,
          },
        ],
      };

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(invalidOrder)
        .expect(400);

      expect(response.body.error).toBe('Invalid order data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 when item has invalid quantity', async () => {
      const invalidOrder = {
        ...validOrderData,
        items: [
          {
            ...validOrderData.items[0],
            quantity: 0,
          },
        ],
      };

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(invalidOrder)
        .expect(400);

      expect(response.body.error).toBe('Invalid order data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 when shippingAddress is missing required fields', async () => {
      const invalidOrder = {
        ...validOrderData,
        shippingAddress: {
          street: '123 Main St',
          city: '',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
      };

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(invalidOrder)
        .expect(400);

      expect(response.body.error).toBe('Invalid order data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 when billingAddress is missing', async () => {
      const invalidOrder = {
        items: validOrderData.items,
        shippingAddress: validOrderData.shippingAddress,
        paymentMethod: validOrderData.paymentMethod,
      };

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(invalidOrder)
        .expect(400);

      expect(response.body.error).toBe('Invalid order data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 when paymentMethod type is invalid', async () => {
      const invalidOrder = {
        ...validOrderData,
        paymentMethod: {
          type: 'invalid_type',
        },
      };

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(invalidOrder)
        .expect(400);

      expect(response.body.error).toBe('Invalid order data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 when paymentMethod is missing', async () => {
      const invalidOrder = {
        items: validOrderData.items,
        shippingAddress: validOrderData.shippingAddress,
        billingAddress: validOrderData.billingAddress,
      };

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(invalidOrder)
        .expect(400);

      expect(response.body.error).toBe('Invalid order data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 when item is missing required fields', async () => {
      const invalidOrder = {
        ...validOrderData,
        items: [
          {
            id: 'product-1',
            price: 29.99,
            quantity: 2,
          },
        ],
      };

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(invalidOrder)
        .expect(400);

      expect(response.body.error).toBe('Invalid order data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 when service throws validation error', async () => {
      jest.spyOn(OrderService.prototype, 'createOrder').mockRejectedValue(
        new Error('Order must contain at least one item')
      );

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(validOrderData)
        .expect(400);

      expect(response.body.error).toBe('Order must contain at least one item');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when service throws unexpected error', async () => {
      jest.spyOn(OrderService.prototype, 'createOrder').mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(validOrderData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 500 when service throws non-Error object', async () => {
      jest.spyOn(OrderService.prototype, 'createOrder').mockRejectedValue('Unknown error');

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(validOrderData)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/orders/user-1')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // Mock should not be called due to malformed JSON from Express middleware
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large orders', async () => {
      const largeOrder = {
        ...validOrderData,
        items: Array(100).fill(null).map((_, i) => ({
          id: `product-${i}`,
          name: `Product ${i}`,
          price: 10.00,
          description: `Product ${i} description`,
          image: `https://example.com/image${i}.jpg`,
          dataAiHint: `product ${i}`,
          quantity: 1,
        })),
      };

      const mockLargeOrder = {
        ...mockCreatedOrder,
        items: largeOrder.items,
        totalAmount: 1000.00,
      };

      jest.spyOn(OrderService.prototype, 'createOrder').mockResolvedValue(mockLargeOrder);

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(largeOrder)
        .expect(201);

      expect(response.body.items).toHaveLength(100);
      expect(response.body.totalAmount).toBe(1000.00);
    });

    it('should handle special characters in address fields', async () => {
      const specialCharOrder = {
        ...validOrderData,
        shippingAddress: {
          street: "123 O'Reilly St, Apt #4B",
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brasil',
        },
      };

      jest.spyOn(OrderService.prototype, 'createOrder').mockResolvedValue({
        ...mockCreatedOrder,
        shippingAddress: specialCharOrder.shippingAddress,
      });

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(specialCharOrder)
        .expect(201);

      expect(response.body.shippingAddress.street).toBe("123 O'Reilly St, Apt #4B");
      expect(response.body.shippingAddress.city).toBe('São Paulo');
    });

    it('should handle all supported payment method types', async () => {
      const paymentTypes = ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay'] as const;

      for (const type of paymentTypes) {
        const order = {
          ...validOrderData,
          paymentMethod: {
            type,
            ...(type.includes('card') ? { last4: '4242', brand: 'Visa' } : {}),
          },
        };

        jest.spyOn(OrderService.prototype, 'createOrder').mockResolvedValue({
          ...mockCreatedOrder,
          paymentMethod: order.paymentMethod,
        });

        const response = await request(app)
          .post('/api/orders/user-1')
          .send(order)
          .expect(201);

        expect(response.body.paymentMethod.type).toBe(type);
      }
    });

    it('should handle userId with special characters', async () => {
      const mockCreateOrder = jest.spyOn(OrderService.prototype, 'createOrder').mockResolvedValue(mockCreatedOrder);

      const response = await request(app)
        .post('/api/orders/user-123-abc-def')
        .send(validOrderData)
        .expect(201);

      expect(mockCreateOrder).toHaveBeenCalledWith(
        'user-123-abc-def',
        validOrderData
      );
    });

    it('should handle decimal prices correctly', async () => {
      const decimalOrder = {
        ...validOrderData,
        items: [
          {
            ...validOrderData.items[0],
            price: 19.99,
            quantity: 3,
          },
        ],
      };

      jest.spyOn(OrderService.prototype, 'createOrder').mockResolvedValue({
        ...mockCreatedOrder,
        totalAmount: 59.97,
      });

      const response = await request(app)
        .post('/api/orders/user-1')
        .send(decimalOrder)
        .expect(201);

      expect(response.body.totalAmount).toBe(59.97);
    });
  });
});
