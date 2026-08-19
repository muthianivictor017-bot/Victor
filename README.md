# Victor Atelier

A complete tailor shop service app — customer storefront plus staff atelier desk.

## What it does

**Customers**
- Browse bespoke services and pricing
- Book a consultation or fitting
- Track an order with ticket number and phone

**Shop staff**
- Dashboard with pipeline, revenue, and today’s fittings
- Customers and measurement cards
- Orders with a full workroom status flow
- Fittings calendar, fabric inventory, invoices, reports
- Role-based access: owner, master tailor, receptionist

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Demo login

| Role | Shop ID | Email | Password |
| --- | --- | --- | --- |
| Owner | `ATELIER` | `owner@victoratelier.com` | `demo123` |
| Master Tailor | `ATELIER` | `tailor@victoratelier.com` | `demo123` |
| Reception | `ATELIER` | `front@victoratelier.com` | `demo123` |

Data is stored in the browser (`localStorage`) so the shop works offline.

## Tests

```bash
npm test
```
