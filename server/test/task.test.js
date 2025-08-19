
const request = require('supertest');
const { app, server } = require('../server');
const mongoose = require('mongoose');

describe('Task API', () => {
  it('should return 401 for unauthenticated requests', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(401);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
  server.close();
});
