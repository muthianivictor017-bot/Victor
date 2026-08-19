# Victor Atelier

A tailor shop **web app**: public website plus a staff workroom desk.

## Pages

| URL | What it is |
| --- | --- |
| `/` | House homepage |
| `/services.html` | Service list and prices |
| `/lookbook.html` | Gallery |
| `/book.html` | Book a consultation |
| `/track.html` | Track a ticket |
| `/about.html` | The workroom |
| `/contact.html` | Write the house |
| `/desk.html` | Staff login and ledger |

Bookings, tracking, and the desk all talk to a real Express API. Data is saved in `data/store.json`.

## Run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Demo

Nairobi house on Biashara Street. Prices in Kenyan shillings. Pay by M-Pesa.

Track ticket **VA-1042** with phone **+254 712 345 221**.

Staff desk (`/desk.html`):

| Role | Shop ID | Email | Password |
| --- | --- | --- | --- |
| Owner | `ATELIER` | `owner@victoratelier.com` | `demo123` |
| Tailor | `ATELIER` | `tailor@victoratelier.com` | `demo123` |
| Front | `ATELIER` | `front@victoratelier.com` | `demo123` |

## Tests

```bash
npm test
```
