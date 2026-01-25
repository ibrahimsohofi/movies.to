import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth.js';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const newUser = {
        username: `testuser${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      // Note: Adjust status code based on actual implementation
      expect([200, 201]).toContain(response.status);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser' }); // Missing email and password

      expect(response.status).toBe(400);
    });

    it('should return error for weak password', async () => {
      const weakPasswordUser = {
        username: `testuser${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: '123', // Weak password
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordUser);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'wrongpassword',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
