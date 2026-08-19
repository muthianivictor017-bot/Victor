function toggleNav() {
  document.getElementById('nav')?.classList.toggle('open');
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function money(n) {
  return '$' + Number(n || 0).toFixed(2);
}

function showNotice(id, text, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'notice on ' + (ok ? 'ok' : 'err');
  el.textContent = text;
}

async function fillServices(selectId) {
  const list = await api('/api/catalog');
  const sel = document.getElementById(selectId);
  if (!sel) return list;
  sel.innerHTML = list.map((s) => `<option value="${s.id}">${s.name} — ${money(s.price)}</option>`).join('');
  return list;
}

async function renderServiceCards(targetId) {
  const list = await api('/api/catalog');
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = list.map((s) => `
    <article class="svc card">
      <img src="${s.image || '/assets/lookbook-suit.jpg'}" alt="${s.name}">
      <div class="pad">
        <div class="eyebrow">${s.category}</div>
        <h3>${s.name}</h3>
        <p>${s.blurb}</p>
        <div class="meta">${money(s.price)} · ${s.days} days</div>
        <a class="btn btn-ink" style="margin-top:14px" href="/book.html?service=${s.id}">Book this</a>
      </div>
    </article>`).join('');
}

async function submitBook(e) {
  e.preventDefault();
  try {
    const body = {
      name: bkName.value.trim(),
      phone: bkPhone.value.trim(),
      email: bkEmail.value.trim(),
      serviceId: bkService.value,
      date: bkDate.value,
      time: bkTime.value,
      notes: bkNotes.value.trim()
    };
    const out = await api('/api/book', { method: 'POST', body: JSON.stringify(body) });
    showNotice('bookMsg', `${out.message} Keep ${out.ticket} for tracking. Ready around ${out.due}.`, true);
    e.target.reset();
    const d = new Date();
    d.setDate(d.getDate() + 2);
    bkDate.value = d.toISOString().slice(0, 10);
  } catch (err) {
    showNotice('bookMsg', err.message, false);
  }
}

async function submitTrack(e) {
  e.preventDefault();
  const box = document.getElementById('trackBox');
  try {
    const q = new URLSearchParams({ ticket: trTicket.value.trim(), phone: trPhone.value.trim() });
    const o = await api('/api/track?' + q);
    const idx = o.stages.indexOf(o.stage);
    box.innerHTML = `<div class="track">
      <strong>${o.ticket}</strong> · ${o.client}<br>${o.service}
      <div style="margin:10px 0">Stage: <b>${o.stage}</b> · due ${o.due}</div>
      <div class="pills">${o.stages.map((st, i) => `<span class="pill ${i <= idx ? 'on' : ''}">${st}</span>`).join('')}</div>
      <div style="margin-top:10px">Balance ${money(o.balance)}</div>
    </div>`;
  } catch (err) {
    box.innerHTML = `<div class="track">${err.message}</div>`;
  }
}

async function submitContact(e) {
  e.preventDefault();
  try {
    const out = await api('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: cName.value, email: cEmail.value, message: cMessage.value })
    });
    showNotice('contactMsg', out.message, true);
    e.target.reset();
  } catch (err) {
    showNotice('contactMsg', err.message, false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const here = location.pathname.replace(/\/+$/, '') || '/';
  document.querySelectorAll('.nav a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === here || (here === '/' && href === '/index.html')) a.classList.add('active');
    if (here.endsWith(href) && href !== '/') a.classList.add('active');
  });
  const date = document.getElementById('bkDate');
  if (date) {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    date.min = new Date().toISOString().slice(0, 10);
    if (!date.value) date.value = d.toISOString().slice(0, 10);
  }
  if (document.getElementById('serviceCards')) renderServiceCards('serviceCards');
  if (document.getElementById('homeServices')) renderServiceCards('homeServices');
  if (document.getElementById('bkService')) {
    fillServices('bkService').then(() => {
      const pick = new URLSearchParams(location.search).get('service');
      if (pick) bkService.value = pick;
    });
  }
});
