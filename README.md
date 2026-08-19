# Duka — Small Business Manager

> **Sales • Purchases • Stock** — Offline-first mobile PWA for duka, kiosk, shop, mini-mart.

Duka runs 100% on-device (localStorage). No backend, no login, no data leaves the phone. Install to home screen for a native-feel experience. Works offline. Built mobile-first (≤520px) but great on desktop.

![PWA](https://img.shields.io/badge/PWA-offline--ready-0f766e)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

### ✨ Features

- **Dashboard**: today sales/purchases/profit, stock value, low/out alerts, 7-day chart, top products, recent sales
- **Stock**: products (name/SKU/category/unit/qty/low/buy/sell), profit & margin, grid/list, search/filter/sort, categories
- **Sales (POS)**: cart with stock check, discount/tax, payments `Cash / M-Pesa / Card / Credit (deni)`, balance & change, profit, receipt print (thermal 320px)
- **Purchases**: supplier, add stock, create new product inline, cost editing, invoice print (A4)
- **Reports**: revenue/COGS/profit, daily trend, by category & payment, best & slow sellers, period (today/week/month/all), CSV
- **More**: business profile, customers & suppliers auto-ranked, stock adjustments (+/- / set), backup/restore (JSON), CSV exports, notifications

### 🚀 Quick start

```bash
git clone https://github.com/muthianivictor017-bot/Victor.git
cd Victor
npm install
npm start
# open http://localhost:3000
```

Optional deps (auto-used if installed):

```bash
npm install compression helmet cors morgan
```

Health check:

```bash
curl http://localhost:3000/api/health
```

### 📱 Install as mobile app (PWA)

1. Open the site on your phone (Chrome / Safari)
2. **Chrome**: menu → *Add to Home screen* / *Install app*
3. **iOS Safari**: Share → *Add to Home Screen*
4. **Capabilities**: standalone, offline, shortcuts (New Sale / Purchase / Stock), theme `#0f766e`

PWA files:
- `manifest.json` — app metadata, icons, shortcuts
- `sw.js` — offline-first shell + stale-while-revalidate for CDN
- `offline.html` — fallback
- `public/icons/icon.svg` — local vector icon

### 🛠️ Configuration

Env (see `.env.example`):

```
PORT=3000
NODE_ENV=production
TRUST_PROXY=true
```

Node versions: see `.nvmrc` (`20`). Engines: `>=18`.

Capacitor (native wrapper):

```json
// capacitor.config.json
{ "appId": "ke.co.duka.app", "appName": "Duka", "webDir": "." }
```

```bash
npm i -g @capacitor/cli
npx cap add android
npx cap add ios
npx cap sync
npx cap open android
```

Deploy:

- **Vercel**: `vercel.json` routes `sw.js` & `manifest.json` with no-cache, SPA fallback via `server.js`
- **Docker**:

```bash
docker build -t duka .
docker run -p 3000:3000 duka
curl http://localhost:3000/api/health
```

- **Any static host**: just upload `index.html`, `manifest.json`, `sw.js`, `offline.html`, `public/` (the app needs no server; `server.js` is only for SPA routing + health).

### 📂 Project structure

```
.
├── index.html              # Single-file PWA app (offline localStorage)
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── offline.html            # Offline fallback
├── public/icons/icon.svg   # Local icon
├── server.js               # Express (static + SPA + /api/health)
├── capacitor.config.json   # Capacitor native config
├── Dockerfile              # Production image
├── vercel.json             # Vercel routing & headers
├── .github/workflows/      # CI (Node 18 & 20)
├── .env.example
├── .editorconfig, .nvmrc, .gitignore
└── package.json
```

### 🔒 Data & privacy

- All data in `localStorage` keys: `duka_products_v2`, `duka_sales_v2`, `duka_purchases_v2`, `duka_settings_v2`, `duka_categories_v2`, `duka_adjustments_v2`
- Use **More → Backup & Restore** to export JSON before clearing.
- `Clear all data` is destructive — export first.

### 🧪 Scripts

```bash
npm start   # production
npm run dev # development (NODE_ENV=development)
npm test    # placeholder (add tests in tests/)
npm run health # curl /api/health
```

### 📄 License

MIT — use freely for your duka.
