import request from 'supertest';
import express from 'express';
import { ProductService } from './service';

// Mock the ProductService
jest.mock('./service');

describe('GET /products/:id', () => {
  let app: express.Application;
  let mockProductService: jest.Mocked<ProductService>;

  beforeEach(() => {
    app = express();
    
    // Setup mock
    mockProductService = new ProductService() as jest.Mocked<ProductService>;
    
    // Define the route for Product Service GET /products/:id
    app.get('/products/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const product = await mockProductService.getProductById(id);
        
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(product);
      } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when product exists', () => {
    it('should return product with status 200', async () => {
      const mockProduct = {
        id: 'prod-123',
        name: 'Test Product',
        price: 29.99,
        description: 'A test product for unit testing',
        image: 'https://example.com/image.jpg',
        dataAiHint: 'electronics',
        category: 'Electronics',
        inStock: true,
      };

      mockProductService.getProductById.mockResolvedValue(mockProduct);

      const response = await request(app).get('/products/prod-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProduct);
      expect(mockProductService.getProductById).toHaveBeenCalledWith('prod-123');
    });

    it('should handle special characters in product ID', async () => {
      const productId = 'prod-abc-123';
      const mockProduct = {
        id: productId,
        name: 'Special Product',
        price: 49.99,
        description: 'Product with special ID',
        image: 'https://example.com/special.jpg',
        dataAiHint: 'special',
      };

      mockProductService.getProductById.mockResolvedValue(mockProduct);

      const response = await request(app).get(`/products/${productId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(productId);
    });
  });

  describe('when product does not exist', () => {
    it('should return 404 status with error message', async () => {
      mockProductService.getProductById.mockResolvedValue(null);

      const response = await request(app).get('/products/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Product not found' });
      expect(mockProductService.getProductById).toHaveBeenCalledWith('nonexistent-id');
    });
  });

  describe('when service throws an error', () => {
    it('should return 500 status with error message', async () => {
      mockProductService.getProductById.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app).get('/products/prod-123');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });
  });

  describe('edge cases', () => {
    it('should handle empty product ID', async () => {
      const response = await request(app).get('/products/');

      expect(response.status).toBe(404); // Route won't match
    });

    it('should handle very long product ID', async () => {
      const longId = 'a'.repeat(1000);
      mockProductService.getProductById.mockResolvedValue(null);

      const response = await request(app).get(`/products/${longId}`);

      expect(response.status).toBe(404);
      expect(mockProductService.getProductById).toHaveBeenCalledWith(longId);
    });
  });
});
