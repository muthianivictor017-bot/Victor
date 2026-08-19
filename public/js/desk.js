const TOKEN_KEY = 'va_token';
const STAGES = ['Received', 'Measured', 'Cutting', 'Sewing', 'Fitting', 'Alterations', 'Ready', 'Delivered'];
let token = localStorage.getItem(TOKEN_KEY);
let me = null;
let cache = {};
let modal = { type: null, id: null };
let charts = {};

const money = (n) => 'KSh ' + Number(n || 0).toLocaleString('en-KE');
const slug = (s) => String(s || '').toLowerCase();
const toast = (t) => {
  const el = document.getElementById('toast');
  el.textContent = t;
  el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 2400);
};

async function req(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...(opts.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    token = null;
    showAuth();
    throw new Error(data.error || 'Please sign in');
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showAuth() {
  auth.style.display = 'grid';
  shell.style.display = 'none';
}
function showShell() {
  auth.style.display = 'none';
  shell.style.display = 'block';
}

async function login(e) {
  e.preventDefault();
  try {
    const out = await req('/api/login', {
      method: 'POST',
      body: JSON.stringify({ shopId: lgShop.value, email: lgEmail.value, password: lgPass.value })
    });
    token = out.token;
    localStorage.setItem(TOKEN_KEY, token);
    me = out.user;
    bootDesk();
  } catch (err) {
    const el = authMsg;
    el.className = 'notice on err';
    el.textContent = err.message;
  }
}
function demo(kind) {
  const map = {
    owner: 'owner@victoratelier.com',
    tailor: 'tailor@victoratelier.com',
    reception: 'front@victoratelier.com'
  };
  lgEmail.value = map[kind];
  lgPass.value = 'demo123';
  lgShop.value = 'ATELIER';
  document.querySelector('#auth form').requestSubmit();
}
async function logout() {
  try { await req('/api/logout', { method: 'POST' }); } catch {}
  localStorage.removeItem(TOKEN_KEY);
  token = null;
  showAuth();
}

async function bootDesk() {
  const info = await req('/api/me');
  me = info.user;
  whoName.textContent = me.name;
  whoRole.textContent = me.role;
  shopLabel.textContent = info.shop.name;
  document.querySelectorAll('.owner-only').forEach((el) => {
    el.style.display = me.role === 'owner' ? '' : 'none';
  });
  fOrder.innerHTML = '<option value="">All stages</option>' + STAGES.map((s) => `<option>${s}</option>`).join('');
  showShell();
  go('dash');
}

async function loadAll() {
  const [orders, customers, services, fittings, measures, fabrics, tailors, invoices, users] = await Promise.all([
    req('/api/orders'), req('/api/customers'), req('/api/services'), req('/api/fittings'),
    req('/api/measures'), req('/api/fabrics'), req('/api/tailors'), req('/api/invoices'), req('/api/users')
  ]);
  cache = { orders, customers, services, fittings, measures, fabrics, tailors, invoices, users };
}

const cust = (id) => cache.customers.find((c) => c.id === id) || { name: '—' };
const svc = (id) => cache.services.find((s) => s.id === id) || { name: '—', price: 0 };
const invBal = (i) => Math.max(0, Number(i.amount || 0) - (i.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0));
function invStatus(i) {
  const b = invBal(i);
  if (b <= 0.01) return 'Paid';
  if ((i.payments || []).length) return 'Partial';
  return 'Pending';
}

const titles = { dash: 'Desk', orders: 'Orders', fittings: 'Fittings', customers: 'Clients', measures: 'Measure cards', services: 'Services', fabrics: 'Cloth room', tailors: 'Tailors', billing: 'Invoices', reports: 'Reports', users: 'Staff' };
const creates = { dash: ['order', 'New order'], orders: ['order', 'New order'], fittings: ['fitting', 'New fitting'], customers: ['customer', 'New client'], measures: ['measure', 'New card'], services: ['service', 'New service'], fabrics: ['fabric', 'New cloth'], tailors: ['tailor', 'New tailor'], billing: ['invoice', 'New invoice'], users: ['user', 'Add staff'] };

async function go(page) {
  if ((page === 'reports' || page === 'users') && me.role !== 'owner') {
    toast('Owner desk only.');
    return;
  }
  document.querySelectorAll('.side nav button').forEach((b) => b.classList.toggle('active', b.dataset.page === page));
  document.querySelectorAll('.page').forEach((p) => p.classList.toggle('on', p.id === 'page-' + page));
  pageTitle.textContent = titles[page];
  const act = creates[page];
  if (!act) pageBtn.style.display = 'none';
  else {
    pageBtn.style.display = '';
    pageBtn.textContent = act[1];
    pageBtn.onclick = () => openCreate(act[0]);
  }
  document.getElementById('side').classList.remove('open');
  await loadAll();
  if (page === 'dash') drawDash();
  if (page === 'orders') drawOrders();
  if (page === 'fittings') drawFittings();
  if (page === 'customers') drawCustomers();
  if (page === 'measures') drawMeasures();
  if (page === 'services') drawServices();
  if (page === 'fabrics') drawFabrics();
  if (page === 'tailors') drawTailors();
  if (page === 'billing') drawBilling();
  if (page === 'reports') drawReports();
  if (page === 'users') drawUsers();
}

function drawDash() {
  const open = cache.orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.stage));
  stOpen.textContent = open.length;
  stReady.textContent = cache.orders.filter((o) => o.stage === 'Ready').length;
  const t = new Date().toISOString().slice(0, 10);
  stFit.textContent = cache.fittings.filter((f) => f.date === t).length;
  stDue.textContent = money(cache.invoices.reduce((s, i) => s + invBal(i), 0));
  const groups = [
    ['Received / Measured', (o) => ['Received', 'Measured'].includes(o.stage)],
    ['Cutting / Sewing', (o) => ['Cutting', 'Sewing'].includes(o.stage)],
    ['On the horse', (o) => ['Fitting', 'Alterations'].includes(o.stage)],
    ['Ready / Out', (o) => ['Ready', 'Delivered'].includes(o.stage)]
  ];
  board.innerHTML = `<div class="kanban">${groups.map(([title, fn]) => {
    const items = cache.orders.filter(fn);
    return `<div class="col"><strong>${title} · ${items.length}</strong>${items.map((o) => `<div class="ticket" onclick="openCreate('order','${o.id}')"><b>${o.ticket}</b><br>${cust(o.customerId).name}<br><span class="pill s-${slug(o.stage)}">${o.stage}</span></div>`).join('')}</div>`;
  }).join('')}</div>`;
  const fits = cache.fittings.filter((f) => f.date === t).sort((a, b) => a.time.localeCompare(b.time));
  todayFits.innerHTML = fits.length
    ? fits.map((f) => `<tr><td>${f.time}</td><td>${cust(f.customerId).name}</td><td>${f.purpose}</td><td><span class="pill s-${slug(f.status)}">${f.status}</span></td></tr>`).join('')
    : '<tr><td colspan="4" class="empty">No fittings today</td></tr>';
}

function drawOrders() {
  const q = slug(qOrder.value);
  const st = fOrder.value;
  let rows = cache.orders.slice().sort((a, b) => (b.created || '').localeCompare(a.created || ''));
  if (st) rows = rows.filter((o) => o.stage === st);
  if (q) rows = rows.filter((o) => slug(o.ticket + cust(o.customerId).name + svc(o.serviceId).name).includes(q));
  orderRows.innerHTML = rows.map((o) => `<tr>
    <td><b>${o.ticket}</b></td><td>${cust(o.customerId).name}</td><td>${svc(o.serviceId).name}</td>
    <td>${o.due || ''}</td><td><span class="pill s-${slug(o.stage)}">${o.stage}</span></td>
    <td>${money(Math.max(0, Number(o.price) - Number(o.paid || 0)))}</td>
    <td>
      <button class="btn-sm btn-ink" onclick="openCreate('order','${o.id}')">Edit</button>
      <button class="btn-sm btn-ok" onclick="advance('${o.id}')">Advance</button>
    </td></tr>`).join('') || '<tr><td colspan="7" class="empty">No orders</td></tr>';
}

function drawFittings() {
  const day = fDate.value;
  const q = slug(qFit.value);
  let rows = cache.fittings.slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  if (day) rows = rows.filter((f) => f.date === day);
  if (q) rows = rows.filter((f) => slug(cust(f.customerId).name + f.purpose).includes(q));
  fitRows.innerHTML = rows.map((f) => `<tr>
    <td>${f.date} ${f.time}</td><td>${cust(f.customerId).name}</td><td>${f.purpose}</td>
    <td><span class="pill s-${slug(f.status)}">${f.status}</span></td>
    <td><button class="btn-sm btn-ink" onclick="openCreate('fitting','${f.id}')">Edit</button>
        <button class="btn-sm btn-wine" onclick="remove('fittings','${f.id}')">✕</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty">No fittings</td></tr>';
}

function drawCustomers() {
  const q = slug(qCust.value);
  const rows = cache.customers.filter((c) => !q || slug(c.name + c.phone + c.email).includes(q));
  custRows.innerHTML = rows.map((c) => `<tr><td><b>${c.name}</b><div style="color:#7d7264;font-size:12px">${c.email || ''}</div></td>
    <td>${c.phone}</td><td>${c.style || '—'}</td>
    <td><button class="btn-sm btn-ink" onclick="openCreate('customer','${c.id}')">Edit</button>
        <button class="btn-sm btn-wine" onclick="remove('customers','${c.id}')">✕</button></td></tr>`).join('');
}

function drawMeasures() {
  measGrid.innerHTML = cache.measures.map((m) => `<div class="mcard">
    <h3 class="serif">${cust(m.customerId).name}</h3>
    <div style="font-size:12px;color:#7d7264">${m.date} · ${m.takenBy || ''}</div>
    <div class="row2" style="margin-top:8px;font-size:12px">
      <div>Chest ${m.chest || '—'}</div><div>Waist ${m.waist || '—'}</div>
      <div>Sleeve ${m.sleeve || '—'}</div><div>Inseam ${m.inseam || '—'}</div>
    </div>
    <button class="btn-sm btn-ink" style="margin-top:10px" onclick="openCreate('measure','${m.id}')">Edit</button>
  </div>`).join('') || '<div class="empty">No cards</div>';
}

function drawServices() {
  svcRows.innerHTML = cache.services.map((s) => `<tr><td><b>${s.name}</b><div style="color:#7d7264;font-size:12px">${s.blurb || ''}</div></td>
    <td>${s.days} days</td><td>${money(s.price)}</td>
    <td><button class="btn-sm btn-ink" onclick="openCreate('service','${s.id}')">Edit</button>
        <button class="btn-sm btn-wine" onclick="remove('services','${s.id}')">✕</button></td></tr>`).join('');
}
function drawFabrics() {
  fabRows.innerHTML = cache.fabrics.map((f) => `<tr><td><b>${f.name}</b></td><td>${f.mill}</td><td>${f.meters} m</td>
    <td><button class="btn-sm btn-ink" onclick="openCreate('fabric','${f.id}')">Edit</button>
        <button class="btn-sm btn-wine" onclick="remove('fabrics','${f.id}')">✕</button></td></tr>`).join('');
}
function drawTailors() {
  tailorRows.innerHTML = cache.tailors.map((t) => {
    const load = cache.orders.filter((o) => o.tailorId === t.id && !['Delivered', 'Cancelled'].includes(o.stage)).length;
    return `<tr><td><b>${t.name}</b></td><td>${t.craft}</td><td>${load} open</td>
      <td><button class="btn-sm btn-ink" onclick="openCreate('tailor','${t.id}')">Edit</button></td></tr>`;
  }).join('');
}
function drawBilling() {
  const q = slug(qBill.value);
  const st = fBill.value;
  let rows = cache.invoices.slice();
  if (st) rows = rows.filter((i) => invStatus(i) === st);
  if (q) rows = rows.filter((i) => slug(i.number + cust(i.customerId).name).includes(q));
  billRows.innerHTML = rows.map((i) => {
    const stt = invStatus(i);
    return `<tr><td><b>${i.number}</b></td><td>${cust(i.customerId).name}</td><td>${money(i.amount)}</td>
      <td>${money(invBal(i))}</td><td><span class="pill s-${slug(stt)}">${stt}</span></td>
      <td>${stt !== 'Paid' ? `<button class="btn-sm btn-ok" onclick="takePay('${i.id}')">Pay</button>` : ''}</td></tr>`;
  }).join('') || '<tr><td colspan="6" class="empty">No invoices</td></tr>';
}
async function drawReports() {
  const r = await req('/api/reports?period=' + repPeriod.value);
  rpOrders.textContent = r.orders;
  rpRev.textContent = money(r.revenue);
  rpAvg.textContent = money(r.average);
  rpDel.textContent = r.delivered;
  const labels = Object.keys(r.daily).sort().slice(-12);
  drawChart('chWeek', 'line', labels, labels.map((k) => r.daily[k]), '#c4a35a');
  drawChart('chStage', 'doughnut', Object.keys(r.stages), Object.values(r.stages), ['#c4a35a', '#2d4a3e', '#7a2e2e', '#8a7d6b', '#221b14', '#e4c77a', '#4a3728', '#9aa']);
}
function drawChart(id, type, labels, data, color) {
  const ctx = document.getElementById(id);
  if (!ctx || !window.Chart) return;
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(ctx, {
    type,
    data: { labels, datasets: [{ data, backgroundColor: Array.isArray(color) ? color : color + '55', borderColor: Array.isArray(color) ? color : color, fill: type === 'line', tension: 0.3 }] },
    options: { plugins: { legend: { display: type !== 'line' } }, scales: type === 'line' ? { y: { beginAtZero: true } } : {} }
  });
}
function drawUsers() {
  userList.innerHTML = cache.users.map((u) => `<div style="display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #eee3d2;background:#fffaf2;padding:12px">
    <div><b>${u.name}</b><div style="font-size:12px;color:#7d7264">${u.email} · ${u.role}</div></div>
    <button class="btn-sm btn-ink" style="margin-left:auto" onclick="openCreate('user','${u.id}')">Edit</button>
  </div>`).join('');
}

function opts(list, val, lab) {
  return list.map((x) => `<option value="${x.id}" ${x.id === val ? 'selected' : ''}>${lab(x)}</option>`).join('');
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function val(id) {
  return document.getElementById(id)?.value;
}

function openCreate(type, id) {
  modal = { type, id };
  const map = { order: 'orders', fitting: 'fittings', customer: 'customers', measure: 'measures', service: 'services', fabric: 'fabrics', tailor: 'tailors', invoice: 'invoices', user: 'users' };
  const item = id ? cache[map[type]].find((x) => x.id === id) || {} : {};
  mTitle.textContent = (id ? 'Edit ' : 'New ') + type;
  const cOpts = opts(cache.customers, item.customerId, (c) => c.name);
  const sOpts = opts(cache.services, item.serviceId, (s) => s.name);
  const tOpts = opts(cache.tailors, item.tailorId, (t) => t.name);
  if (type === 'customer') mBody.innerHTML = `<div class="row2">
    <div class="field"><label>Name</label><input id="f_name" value="${esc(item.name)}"></div>
    <div class="field"><label>Phone</label><input id="f_phone" value="${esc(item.phone)}"></div>
    <div class="field"><label>Email</label><input id="f_email" value="${esc(item.email)}"></div>
    <div class="field"><label>Style</label><input id="f_style" value="${esc(item.style)}"></div>
    <div class="field" style="grid-column:1/-1"><label>Notes</label><textarea id="f_notes">${esc(item.notes)}</textarea></div></div>`;
  if (type === 'order') mBody.innerHTML = `<div class="row2">
    <div class="field"><label>Client</label><select id="f_customerId">${cOpts}</select></div>
    <div class="field"><label>Service</label><select id="f_serviceId">${sOpts}</select></div>
    <div class="field"><label>Tailor</label><select id="f_tailorId">${tOpts}</select></div>
    <div class="field"><label>Due</label><input id="f_due" type="date" value="${item.due || ''}"></div>
    <div class="field"><label>Stage</label><select id="f_stage">${STAGES.concat('Cancelled').map((s) => `<option ${s === (item.stage || 'Received') ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    <div class="field"><label>Price</label><input id="f_price" type="number" value="${item.price || 0}"></div>
    <div class="field"><label>Paid</label><input id="f_paid" type="number" value="${item.paid || 0}"></div>
    <div class="field" style="grid-column:1/-1"><label>Notes</label><textarea id="f_notes">${esc(item.notes)}</textarea></div></div>`;
  if (type === 'fitting') mBody.innerHTML = `<div class="row2">
    <div class="field"><label>Client</label><select id="f_customerId">${cOpts}</select></div>
    <div class="field"><label>Tailor</label><select id="f_tailorId">${tOpts}</select></div>
    <div class="field"><label>Date</label><input id="f_date" type="date" value="${item.date || ''}"></div>
    <div class="field"><label>Time</label><input id="f_time" type="time" value="${item.time || '11:00'}"></div>
    <div class="field"><label>Purpose</label><input id="f_purpose" value="${esc(item.purpose)}"></div>
    <div class="field"><label>Status</label><select id="f_status">${['Pending', 'Confirmed', 'Completed', 'Cancelled'].map((s) => `<option ${s === (item.status || 'Pending') ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div>`;
  if (type === 'measure') mBody.innerHTML = `<div class="row2">
    <div class="field"><label>Client</label><select id="f_customerId">${cOpts}</select></div>
    <div class="field"><label>Date</label><input id="f_date" type="date" value="${item.date || ''}"></div>
    <div class="field"><label>Taken by</label><input id="f_takenBy" value="${esc(item.takenBy || me.name)}"></div>
    ${['neck', 'shoulder', 'chest', 'waist', 'hips', 'sleeve', 'jacket', 'inseam'].map((k) => `<div class="field"><label>${k}</label><input id="f_${k}" type="number" step="0.1" value="${item[k] ?? ''}"></div>`).join('')}
    <div class="field" style="grid-column:1/-1"><label>Notes</label><textarea id="f_notes">${esc(item.notes)}</textarea></div></div>`;
  if (type === 'service') mBody.innerHTML = `<div class="row2">
    <div class="field"><label>Name</label><input id="f_name" value="${esc(item.name)}"></div>
    <div class="field"><label>Category</label><input id="f_category" value="${esc(item.category)}"></div>
    <div class="field"><label>Days</label><input id="f_days" type="number" value="${item.days || 7}"></div>
    <div class="field"><label>Price</label><input id="f_price" type="number" value="${item.price || 0}"></div>
    <div class="field" style="grid-column:1/-1"><label>Blurb</label><textarea id="f_blurb">${esc(item.blurb)}</textarea></div></div>`;
  if (type === 'fabric') mBody.innerHTML = `<div class="row2">
    <div class="field"><label>Cloth</label><input id="f_name" value="${esc(item.name)}"></div>
    <div class="field"><label>Mill</label><input id="f_mill" value="${esc(item.mill)}"></div>
    <div class="field"><label>Meters</label><input id="f_meters" type="number" step="0.1" value="${item.meters || 0}"></div>
    <div class="field"><label>KSh / m</label><input id="f_price" type="number" value="${item.price || 0}"></div></div>`;
  if (type === 'tailor') mBody.innerHTML = `<div class="row2">
    <div class="field"><label>Name</label><input id="f_name" value="${esc(item.name)}"></div>
    <div class="field"><label>Craft</label><input id="f_craft" value="${esc(item.craft)}"></div>
    <div class="field"><label>Phone</label><input id="f_phone" value="${esc(item.phone)}"></div></div>`;
  if (type === 'invoice') mBody.innerHTML = `<div class="row2">
    <div class="field"><label>Client</label><select id="f_customerId">${cOpts}</select></div>
    <div class="field"><label>Amount</label><input id="f_amount" type="number" value="${item.amount || 0}"></div>
    <div class="field"><label>Date</label><input id="f_date" type="date" value="${item.date || new Date().toISOString().slice(0, 10)}"></div>
    <div class="field" style="grid-column:1/-1"><label>Notes</label><textarea id="f_notes">${esc(item.notes)}</textarea></div></div>`;
  if (type === 'user') mBody.innerHTML = `<div class="row2">
    <div class="field"><label>Name</label><input id="f_name" value="${esc(item.name)}"></div>
    <div class="field"><label>Email</label><input id="f_email" value="${esc(item.email)}"></div>
    <div class="field"><label>Password</label><input id="f_pass" value="${esc(item.pass || 'demo123')}"></div>
    <div class="field"><label>Role</label><select id="f_role">${['owner', 'tailor', 'reception'].map((r) => `<option ${r === (item.role || 'tailor') ? 'selected' : ''}>${r}</option>`).join('')}</select></div></div>`;
  overlay.classList.add('on');
}
function closeModal() {
  overlay.classList.remove('on');
}

async function saveModal() {
  const t = modal.type;
  const builders = {
    customer: () => ({ name: val('f_name'), phone: val('f_phone'), email: val('f_email'), style: val('f_style'), notes: val('f_notes') }),
    order: () => ({ customerId: val('f_customerId'), serviceId: val('f_serviceId'), tailorId: val('f_tailorId'), due: val('f_due'), stage: val('f_stage'), price: Number(val('f_price')), paid: Number(val('f_paid')), notes: val('f_notes') }),
    fitting: () => ({ customerId: val('f_customerId'), tailorId: val('f_tailorId'), date: val('f_date'), time: val('f_time'), purpose: val('f_purpose'), status: val('f_status') }),
    measure: () => {
      const o = { customerId: val('f_customerId'), date: val('f_date'), takenBy: val('f_takenBy'), notes: val('f_notes') };
      ['neck', 'shoulder', 'chest', 'waist', 'hips', 'sleeve', 'jacket', 'inseam'].forEach((k) => { o[k] = val('f_' + k); });
      return o;
    },
    service: () => ({ name: val('f_name'), category: val('f_category'), days: Number(val('f_days')), price: Number(val('f_price')), blurb: val('f_blurb'), image: '/assets/lookbook-suit.jpg' }),
    fabric: () => ({ name: val('f_name'), mill: val('f_mill'), meters: Number(val('f_meters')), price: Number(val('f_price')), min: 5 }),
    tailor: () => ({ name: val('f_name'), craft: val('f_craft'), phone: val('f_phone') }),
    invoice: () => ({ customerId: val('f_customerId'), amount: Number(val('f_amount')), date: val('f_date'), notes: val('f_notes'), payments: [] }),
    user: () => ({ name: val('f_name'), email: val('f_email'), pass: val('f_pass'), role: val('f_role') })
  };
  const col = { order: 'orders', fitting: 'fittings', customer: 'customers', measure: 'measures', service: 'services', fabric: 'fabrics', tailor: 'tailors', invoice: 'invoices', user: 'users' }[t];
  const body = builders[t]();
  if (modal.id) await req(`/api/${col}/${modal.id}`, { method: 'PUT', body: JSON.stringify(body) });
  else await req(`/api/${col}`, { method: 'POST', body: JSON.stringify(body) });
  closeModal();
  toast('Saved');
  go(document.querySelector('.page.on').id.replace('page-', ''));
}

async function remove(col, id) {
  if (!confirm('Remove this record?')) return;
  await req(`/api/${col}/${id}`, { method: 'DELETE' });
  toast('Removed');
  go(document.querySelector('.page.on').id.replace('page-', ''));
}
async function advance(id) {
  try {
    const o = await req(`/api/orders/${id}/advance`, { method: 'POST', body: '{}' });
    toast(o.ticket + ' → ' + o.stage);
    go('orders');
  } catch (err) {
    toast(err.message);
  }
}
async function takePay(id) {
  const amt = prompt('Amount received');
  if (amt === null) return;
  await req(`/api/invoices/${id}/pay`, { method: 'POST', body: JSON.stringify({ amount: Number(amt), method: 'M-Pesa' }) });
  toast('Payment noted');
  go('billing');
}

(async function init() {
  if (!token) return showAuth();
  try {
    await req('/api/me');
    bootDesk();
  } catch {
    showAuth();
  }
})();
