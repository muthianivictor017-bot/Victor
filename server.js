const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const PUBLIC = path.join(__dirname, 'public');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(PUBLIC));

const tokens = new Map();

function today() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(iso, n) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function uid(p) {
  return `${p}-${crypto.randomBytes(4).toString('hex')}`;
}
function seed() {
  const t = today();
  return {
    shop: {
      id: 'ATELIER',
      name: 'Victor Atelier',
      phone: '+1 (212) 555-0142',
      email: 'desk@victoratelier.com',
      address: '14 Cloth Lane',
      hours: 'Tue–Sat 10:00–18:00',
      city: 'Nairobi & New York'
    },
    users: [
      { id: 'u1', name: 'Victor Moreau', email: 'owner@victoratelier.com', pass: 'demo123', role: 'owner', phone: '+1 212 555 0101' },
      { id: 'u2', name: 'Elena Park', email: 'tailor@victoratelier.com', pass: 'demo123', role: 'tailor', phone: '+1 212 555 0102' },
      { id: 'u3', name: 'Sam Reed', email: 'front@victoratelier.com', pass: 'demo123', role: 'reception', phone: '+1 212 555 0103' }
    ],
    customers: [
      { id: 'c1', name: 'James Whitfield', phone: '+1 646 555 2211', email: 'james@whitfield.co', style: 'Classic English', notes: 'Prefers mid-grey flannel' },
      { id: 'c2', name: 'Amara Cole', phone: '+1 917 555 8844', email: 'amara@cole.studio', style: 'Soft Neapolitan', notes: 'Wedding party of 6' },
      { id: 'c3', name: 'Owen Hart', phone: '+1 347 555 1190', email: 'owen.hart@mail.com', style: 'Workwear', notes: 'Short right arm' }
    ],
    measures: [
      { id: 'm1', customerId: 'c1', date: t, takenBy: 'Elena Park', neck: 15.5, shoulder: 18, chest: 40, waist: 34, hips: 40, sleeve: 25, jacket: 30, shirt: 31, inseam: 32, outseam: 42, thigh: 24, cuff: 8.5, notes: 'Square shoulders' },
      { id: 'm2', customerId: 'c2', date: t, takenBy: 'Elena Park', neck: 13.5, shoulder: 15.5, chest: 35, waist: 27, hips: 38, sleeve: 23, jacket: 26, shirt: 27, inseam: 30, outseam: 39, thigh: 22, cuff: 7.5, notes: 'High hip' }
    ],
    services: [
      { id: 's1', name: 'Bespoke two-piece', category: 'Suiting', days: 21, price: 1850, blurb: 'Hand-cut jacket and trouser from the house block.', image: '/assets/lookbook-suit.jpg' },
      { id: 's2', name: 'Bespoke three-piece', category: 'Suiting', days: 28, price: 2400, blurb: 'Jacket, trouser, and waistcoat. Full canvas.', image: '/assets/lookbook-suit.jpg' },
      { id: 's3', name: 'City shirt, made to measure', category: 'Shirting', days: 10, price: 185, blurb: 'Two-ply cotton, mother-of-pearl, your collar.', image: '/assets/lookbook-shirt.jpg' },
      { id: 's4', name: 'Evening dress', category: 'Womenswear', days: 24, price: 980, blurb: 'Bias or structured. One muslin, two fittings.', image: '/assets/lookbook-dress.jpg' },
      { id: 's5', name: 'Hem, sleeve, or waist', category: 'Alterations', days: 4, price: 45, blurb: 'Clean, invisible work on garments you already own.', image: '/assets/hands-work.jpg' },
      { id: 's6', name: 'Jacket reline', category: 'Alterations', days: 8, price: 220, blurb: 'New lining, pockets reset, canvas checked.', image: '/assets/atelier-room.jpg' }
    ],
    tailors: [
      { id: 't1', name: 'Elena Park', craft: 'Coats & canvas', phone: '+1 212 555 0102' },
      { id: 't2', name: 'Ibrahim Diallo', craft: 'Trousers & finishing', phone: '+1 212 555 0104' },
      { id: 't3', name: 'Mei Chen', craft: 'Shirts & dresses', phone: '+1 212 555 0105' }
    ],
    fabrics: [
      { id: 'f1', name: 'Charcoal birdseye', mill: 'Fox Brothers', meters: 18, price: 86, min: 6 },
      { id: 'f2', name: 'Navy hopsack', mill: 'Dormeuil', meters: 9, price: 112, min: 5 },
      { id: 'f3', name: 'Ivory poplin', mill: 'Albini', meters: 42, price: 28, min: 12 },
      { id: 'f4', name: 'Midnight barathea', mill: 'Holland & Sherry', meters: 4, price: 140, min: 5 }
    ],
    orders: [
      { id: 'o1', ticket: 'VA-1042', customerId: 'c1', serviceId: 's1', tailorId: 't1', fabricId: 'f1', stage: 'Sewing', due: addDays(t, 8), price: 1850, paid: 800, notes: 'Two-button, side vents', created: addDays(t, -10) },
      { id: 'o2', ticket: 'VA-1048', customerId: 'c2', serviceId: 's4', tailorId: 't3', fabricId: '', stage: 'Fitting', due: addDays(t, 3), price: 980, paid: 400, notes: 'Ivory crepe, tea-length', created: addDays(t, -12) },
      { id: 'o3', ticket: 'VA-1051', customerId: 'c3', serviceId: 's5', tailorId: 't2', fabricId: '', stage: 'Ready', due: t, price: 45, paid: 0, notes: 'Hem chinos 31"', created: addDays(t, -3) },
      { id: 'o4', ticket: 'VA-1055', customerId: 'c1', serviceId: 's3', tailorId: 't3', fabricId: 'f3', stage: 'Received', due: addDays(t, 9), price: 185, paid: 185, notes: 'Semi-spread, French cuff', created: t }
    ],
    fittings: [
      { id: 'a1', customerId: 'c2', tailorId: 't3', date: t, time: '11:00', purpose: 'Baste fitting — evening dress', status: 'Confirmed', notes: '' },
      { id: 'a2', customerId: 'c1', tailorId: 't1', date: t, time: '15:30', purpose: 'Forward fitting — birdseye suit', status: 'Confirmed', notes: '' },
      { id: 'a3', customerId: 'c3', tailorId: 't2', date: addDays(t, 1), time: '10:00', purpose: 'Collect hem', status: 'Pending', notes: '' }
    ],
    invoices: [
      { id: 'i1', number: 'INV-2201', customerId: 'c1', orderId: 'o1', date: addDays(t, -10), amount: 1850, payments: [{ id: 'p1', amount: 800, method: 'Card', date: addDays(t, -10), ref: 'CH-8831' }], notes: 'Deposit on suit' },
      { id: 'i2', number: 'INV-2204', customerId: 'c2', orderId: 'o2', date: addDays(t, -12), amount: 980, payments: [{ id: 'p2', amount: 400, method: 'Transfer', date: addDays(t, -12), ref: 'WT-19' }], notes: '' },
      { id: 'i3', number: 'INV-2210', customerId: 'c3', orderId: 'o3', date: addDays(t, -3), amount: 45, payments: [], notes: 'Walk-in hem' }
    ],
    messages: []
  };
}

function load() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(seed(), null, 2));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return seed();
  }
}
function save(db) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

const STAGES = ['Received', 'Measured', 'Cutting', 'Sewing', 'Fitting', 'Alterations', 'Ready', 'Delivered'];

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = tokens.get(token);
  if (!user) return res.status(401).json({ error: 'Sign in to the desk first.' });
  req.user = user;
  next();
}
function ownerOnly(req, res, next) {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Owner desk only.' });
  next();
}
function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone };
}
function nextTicket(db) {
  return `VA-${1000 + db.orders.length + 1}`;
}
function nextInv(db) {
  return `INV-${2200 + db.invoices.length + 1}`;
}
function invBalance(inv) {
  const paid = (inv.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  return Math.max(0, Number(inv.amount || 0) - paid);
}
function invStatus(inv) {
  const bal = invBalance(inv);
  if (bal <= 0.01) return 'Paid';
  if ((inv.payments || []).length) return 'Partial';
  if (inv.date && addDays(inv.date, 14) < today()) return 'Overdue';
  return 'Pending';
}
function findById(list, id) {
  return list.find((x) => x.id === id);
}
function upsert(list, rec) {
  const i = list.findIndex((x) => x.id === rec.id);
  if (i >= 0) list[i] = rec;
  else list.push(rec);
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, name: 'Victor Atelier' });
});
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'Victor Atelier' });
});
app.get('/api/shop', (_req, res) => {
  const db = load();
  res.json(db.shop);
});
app.get('/api/catalog', (_req, res) => {
  const db = load();
  res.json(db.services);
});

app.post('/api/book', (req, res) => {
  const { name, phone, email, serviceId, date, time, notes } = req.body || {};
  if (!name || !phone || !serviceId || !date || !time) {
    return res.status(400).json({ error: 'Name, phone, service, date and time are required.' });
  }
  const db = load();
  const service = findById(db.services, serviceId);
  if (!service) return res.status(400).json({ error: 'Unknown service.' });
  const digits = String(phone).replace(/\s/g, '');
  let customer = db.customers.find((c) => c.phone.replace(/\s/g, '') === digits);
  if (!customer) {
    customer = { id: uid('c'), name, phone, email: email || '', style: '', notes: notes || '' };
    db.customers.push(customer);
  }
  const fitting = {
    id: uid('a'),
    customerId: customer.id,
    tailorId: db.tailors[0].id,
    date,
    time,
    purpose: `Consultation — ${service.name}`,
    status: 'Pending',
    notes: notes || ''
  };
  db.fittings.push(fitting);
  const order = {
    id: uid('o'),
    ticket: nextTicket(db),
    customerId: customer.id,
    serviceId: service.id,
    tailorId: db.tailors[0].id,
    fabricId: '',
    stage: 'Received',
    due: addDays(date, service.days || 14),
    price: service.price,
    paid: 0,
    notes: notes || '',
    created: today()
  };
  db.orders.push(order);
  save(db);
  res.json({
    ok: true,
    ticket: order.ticket,
    due: order.due,
    service: service.name,
    message: `Saved. Your ticket is ${order.ticket}.`
  });
});

app.get('/api/track', (req, res) => {
  const ticket = String(req.query.ticket || '').trim().toUpperCase();
  const phone = String(req.query.phone || '').replace(/\s/g, '');
  const db = load();
  const order = db.orders.find((o) => o.ticket === ticket);
  if (!order) return res.status(404).json({ error: 'No ticket by that number.' });
  const customer = findById(db.customers, order.customerId);
  if (!customer || customer.phone.replace(/\s/g, '') !== phone) {
    return res.status(403).json({ error: 'Phone does not match this ticket.' });
  }
  const service = findById(db.services, order.serviceId) || { name: 'Atelier service' };
  res.json({
    ticket: order.ticket,
    client: customer.name,
    service: service.name,
    stage: order.stage,
    stages: STAGES,
    due: order.due,
    price: order.price,
    paid: order.paid,
    balance: Math.max(0, Number(order.price) - Number(order.paid || 0)),
    notes: order.notes
  });
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'All fields are required.' });
  const db = load();
  db.messages.push({ id: uid('n'), name, email, message, date: today(), read: false });
  save(db);
  res.json({ ok: true, message: 'The house has your note. We write back within a working day.' });
});

app.post('/api/login', (req, res) => {
  const shopId = String(req.body.shopId || '').trim().toUpperCase();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const db = load();
  if (shopId !== db.shop.id) return res.status(401).json({ error: 'Unknown shop ID.' });
  const user = db.users.find((u) => u.email === email && u.pass === password);
  if (!user) return res.status(401).json({ error: 'Those credentials do not open the desk.' });
  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(token, publicUser(user));
  res.json({ token, user: publicUser(user), shop: db.shop });
});

app.post('/api/logout', auth, (req, res) => {
  const header = req.headers.authorization || '';
  tokens.delete(header.slice(7));
  res.json({ ok: true });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ user: req.user, shop: load().shop });
});

function crud(col, opts = {}) {
  app.get(`/api/${col}`, auth, (_req, res) => res.json(load()[col]));
  app.post(`/api/${col}`, auth, (req, res) => {
    const db = load();
    const rec = { ...req.body, id: req.body.id || uid(opts.prefix || col[0]) };
    if (opts.onCreate) opts.onCreate(db, rec);
    upsert(db[col], rec);
    save(db);
    res.json(rec);
  });
  app.put(`/api/${col}/:id`, auth, (req, res) => {
    const db = load();
    const existing = findById(db[col], req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const rec = { ...existing, ...req.body, id: req.params.id };
    upsert(db[col], rec);
    save(db);
    res.json(rec);
  });
  app.delete(`/api/${col}/:id`, auth, (req, res) => {
    const db = load();
    db[col] = db[col].filter((x) => x.id !== req.params.id);
    save(db);
    res.json({ ok: true });
  });
}

crud('customers', { prefix: 'c' });
crud('measures', { prefix: 'm' });
crud('services', { prefix: 's' });
crud('fabrics', { prefix: 'f' });
crud('tailors', { prefix: 't' });
crud('fittings', { prefix: 'a' });
crud('users', { prefix: 'u' });
crud('orders', {
  prefix: 'o',
  onCreate: (db, rec) => {
    rec.ticket = rec.ticket || nextTicket(db);
    rec.created = rec.created || today();
    rec.stage = rec.stage || 'Received';
    rec.paid = Number(rec.paid || 0);
  }
});
crud('invoices', {
  prefix: 'i',
  onCreate: (db, rec) => {
    rec.number = rec.number || nextInv(db);
    rec.payments = rec.payments || [];
  }
});

app.post('/api/orders/:id/advance', auth, (req, res) => {
  const db = load();
  const order = findById(db.orders, req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  const i = STAGES.indexOf(order.stage);
  if (i < 0 || i === STAGES.length - 1) return res.status(400).json({ error: 'Already at the end of the rail.' });
  order.stage = STAGES[i + 1];
  save(db);
  res.json(order);
});

app.post('/api/invoices/:id/pay', auth, (req, res) => {
  const amount = Number(req.body.amount);
  const method = req.body.method || 'Cash';
  if (!(amount > 0)) return res.status(400).json({ error: 'Enter a real amount.' });
  const db = load();
  const inv = findById(db.invoices, req.params.id);
  if (!inv) return res.status(404).json({ error: 'Not found' });
  inv.payments = inv.payments || [];
  inv.payments.push({ id: uid('p'), amount, method, date: today(), ref: req.body.ref || '' });
  const order = findById(db.orders, inv.orderId);
  if (order) order.paid = Number(order.paid || 0) + amount;
  save(db);
  res.json(inv);
});

app.get('/api/summary', auth, (_req, res) => {
  const db = load();
  const open = db.orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.stage));
  const ready = db.orders.filter((o) => o.stage === 'Ready');
  const fits = db.fittings.filter((f) => f.date === today());
  const due = db.invoices.reduce((s, i) => s + invBalance(i), 0);
  res.json({
    open: open.length,
    ready: ready.length,
    fittingsToday: fits.length,
    outstanding: due,
    stages: STAGES,
    board: db.orders,
    todayFittings: fits,
    invoices: db.invoices.map((i) => ({ ...i, balance: invBalance(i), status: invStatus(i) })),
    customers: db.customers,
    services: db.services,
    tailors: db.tailors
  });
});

app.put('/api/shop', auth, ownerOnly, (req, res) => {
  const db = load();
  db.shop = { ...db.shop, ...req.body, id: db.shop.id };
  save(db);
  res.json(db.shop);
});

app.get('/api/reports', auth, ownerOnly, (req, res) => {
  const db = load();
  const period = req.query.period || 'month';
  const start =
    period === 'all'
      ? '2000-01-01'
      : period === 'year'
        ? `${today().slice(0, 4)}-01-01`
        : period === 'quarter'
          ? quarterStart()
          : `${today().slice(0, 7)}-01`;
  const ords = db.orders.filter((o) => o.created >= start);
  const invs = db.invoices.filter((i) => i.date >= start);
  const rev = invs.reduce((s, i) => (i.payments || []).reduce((a, p) => a + Number(p.amount), s), 0);
  const daily = {};
  invs.forEach((i) => (i.payments || []).forEach((p) => {
    const k = (p.date || i.date).slice(0, 10);
    daily[k] = (daily[k] || 0) + Number(p.amount);
  }));
  const stages = {};
  db.orders.forEach((o) => { stages[o.stage] = (stages[o.stage] || 0) + 1; });
  res.json({
    orders: ords.length,
    revenue: rev,
    average: ords.length ? ords.reduce((s, o) => s + Number(o.price), 0) / ords.length : 0,
    delivered: ords.filter((o) => o.stage === 'Delivered').length,
    daily,
    stages
  });
});

function quarterStart() {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), q, 1).toISOString().slice(0, 10);
}

if (require.main === module) {
  load();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Victor Atelier running on port ${PORT}`);
  });
}

module.exports = app;
