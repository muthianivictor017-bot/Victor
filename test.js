const http = require('http');
const assert = require('assert');
const app = require('./server');

const server = app.listen(0, '127.0.0.1', () => {
  const { port } = server.address();

  const get = (path) =>
    new Promise((resolve, reject) => {
      http
        .get({ hostname: '127.0.0.1', port, path }, (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => resolve({ status: res.statusCode, body }));
        })
        .on('error', reject);
    });

  (async () => {
    try {
      const health = await get('/health');
      assert.strictEqual(health.status, 200);
      const payload = JSON.parse(health.body);
      assert.strictEqual(payload.ok, true);
      assert.strictEqual(payload.name, 'Victor Atelier');

      const home = await get('/');
      assert.strictEqual(home.status, 200);
      assert.ok(home.body.includes('Victor Atelier'));
      assert.ok(home.body.includes('Bespoke'));

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
