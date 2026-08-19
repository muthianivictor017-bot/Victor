/**
 * Duka Business Manager — production-ready Express server
 * - Security headers
 * - Compression (if available)
 * - Static caching
 * - Health check
 * - SPA fallback
 */
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Trust proxy if behind Vercel / Nginx
if (process.env.TRUST_PROXY === 'true' || isProd) {
  app.set('trust proxy', 1);
}

// Optional middleware — gracefully degrade if not installed
try { app.use(require('compression')()); } catch (_) {}
try { app.use(require('cors')()); } catch (_) {}
try { app.use(require('morgan')(isProd ? 'combined' : 'dev')); } catch (_) {}

// Security headers (manual, no helmet required but use it if present)
let helmetMiddleware = null;
try { helmetMiddleware = require('helmet')({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}); } catch (_) {}
if (helmetMiddleware) app.use(helmetMiddleware);
else {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    // Allow PWA to be installed
    res.setHeader('X-Powered-By', 'Duka');
    next();
  });
}

// Body parsing for future API
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Health & API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'duka-business-manager',
    version: '1.0.0',
    uptime: process.uptime(),
    time: new Date().toISOString()
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    name: 'Duka — Small Business Manager',
    currency: 'KSh',
    offline: true,
    features: ['sales','purchases','stock','reports','pwa']
  });
});

// Static with aggressive caching for assets, no-cache for shell
const staticOpts = {
  maxAge: isProd ? '7d' : 0,
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Service-Worker-Allowed', '/');
    } else if (filePath.endsWith('manifest.json')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.setHeader('Content-Type', 'application/manifest+json');
    } else if (filePath.endsWith('offline.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (/\.(js|css|svg|png|jpg|woff2?)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
};

app.use(express.static(path.join(__dirname), staticOpts));
app.use('/public', express.static(path.join(__dirname, 'public'), staticOpts));

// SPA fallback — serve index.html for all non-API, non-file routes
app.get('*', (req, res) => {
  // Don't interfere with API
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  // If file exists with extension, 404
  if (path.extname(req.path)) {
    const file = path.join(__dirname, req.path);
    if (fs.existsSync(file)) return res.sendFile(file);
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Duka Business Manager running on port ${PORT} [${isProd ? 'production' : 'development'}]`);
});

module.exports = app;
