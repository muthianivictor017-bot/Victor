const http = require('http');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const app = require('./server');

const store = path.join(__dirname, 'data', 'store.json');
if (fs.existsSync(store)) fs.unlinkSync(store);

const server = app.listen(0, '127.0.0.1', () => {
  const { port } = server.address();

  const request = (method, urlPath, body, headers = {}) =>
    new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: urlPath,
          method,
          headers: {
            ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
            ...headers
          }
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve({ status: res.statusCode, body: data }));
        }
      );
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });

  (async () => {
    try {
      const health = await request('GET', '/health');
      assert.strictEqual(health.status, 200);
      assert.strictEqual(JSON.parse(health.body).name, 'Victor Atelier');

      const home = await request('GET', '/');
      assert.strictEqual(home.status, 200);
      assert.ok(home.body.includes('Victor Atelier'));
      assert.ok(home.body.includes('Book a consultation') || home.body.includes('Bespoke'));

      const servicesPage = await request('GET', '/services.html');
      assert.strictEqual(servicesPage.status, 200);
      assert.ok(servicesPage.body.includes('What the house will make'));

      const catalog = await request('GET', '/api/catalog');
      assert.strictEqual(catalog.status, 200);
      const list = JSON.parse(catalog.body);
      assert.ok(Array.isArray(list) && list.length > 0);

      const booked = await request('POST', '/api/book', {
        name: 'Test Client',
        phone: '+254 700 019 199',
        email: 'test@example.com',
        serviceId: list[0].id,
        date: '2026-09-01',
        time: '11:00',
        notes: 'Web app test'
      });
      assert.strictEqual(booked.status, 200);
      const ticket = JSON.parse(booked.body).ticket;
      assert.ok(ticket);

      const tracked = await request('GET', `/api/track?ticket=${encodeURIComponent(ticket)}&phone=${encodeURIComponent('+254 700 019 199')}`);
      assert.strictEqual(tracked.status, 200);
      assert.strictEqual(JSON.parse(tracked.body).ticket, ticket);

      const login = await request('POST', '/api/login', {
        shopId: 'ATELIER',
        email: 'owner@victoratelier.com',
        password: 'demo123'
      });
      assert.strictEqual(login.status, 200);
      const token = JSON.parse(login.body).token;
      const orders = await request('GET', '/api/orders', null, { Authorization: `Bearer ${token}` });
      assert.strictEqual(orders.status, 200);
      assert.ok(JSON.parse(orders.body).length >= 1);

      console.log('All tests passed');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error(err);
      server.close();
      process.exit(1);
    }
  })();
});
