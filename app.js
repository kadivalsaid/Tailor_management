let tailor = null;
let cur = null;
const exCnt = { sp: 0, km: 0, sh: 0, pt: 0 };

// Measurements Map
const measurements = {
  sp: { 'Kamar': 'sp-w', 'Hip': 'sp-h', 'Lambai': 'sp-l', 'Paur': 'sp-b', 'Ghutna': 'sp-k', 'Kamarband': 'sp-band' },
  km: { 'Seena': 'km-c', 'Kamar': 'km-w', 'Lambai': 'km-l', 'Bagha': 'km-sl', 'Kandha': 'km-sh', 'Gala': 'km-n' },
  sh: { 'Seena': 'sh-c', 'Kandha': 'sh-sh', 'Lambai': 'sh-l', 'Bagha': 'sh-sl', 'Collar': 'sh-co', 'Kamar': 'sh-w' },
  pt: { 'Kamar': 'pt-w', 'Hip': 'pt-h', 'Lambai': 'pt-l', 'Paur': 'pt-b', 'Thigh': 'pt-t', 'Rise': 'pt-r' }
};

// LocalStorage Helper Functions
function getDB(key, def = []) {
  try { return JSON.parse(localStorage.getItem('tm_' + key)) || def; } catch(e) { return def; }
}
function setDB(key, val) {
  localStorage.setItem('tm_' + key, JSON.stringify(val));
}

// Render measurements
function renderMeasurements(type, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !measurements[type]) return;
  let html = '';
  Object.entries(measurements[type]).forEach(([name, id]) => {
    html += `<div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px; padding: 10px; background: rgba(0, 30, 80, 0.4); border-radius: 8px; border: 1px solid rgba(0, 255, 255, 0.2);">
      <label style="flex: 0 0 120px; font-size: 12px; color: rgba(0, 255, 255, 0.8); font-weight: 600; text-transform: uppercase;">${name}</label>
      <span style="color: var(--neon-cyan); font-weight: 600;">:</span>
      <input id="${id}" type="number" placeholder="0" style="flex: 1; padding: 8px 12px; border: 2px solid rgba(0, 255, 255, 0.3); border-radius: 6px; background: rgba(0, 20, 60, 0.6); color: var(--neon-cyan); font-size: 13px; outline: none;"/>
    </div>`;
  });
  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  renderMeasurements('sp', 'sp-container');
  renderMeasurements('km', 'km-container');
  renderMeasurements('sh', 'sh-container');
  renderMeasurements('pt', 'pt-container');
});

function go(s) {
  document.querySelectorAll('.screen').forEach(x => x.classList.remove('active'));
  const el = document.getElementById(s);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
  if (s === 's-dash') loadStats();
  if (s === 's-list') loadCustomers();
  if (s === 's-search') { document.getElementById('s-q').value = ''; document.getElementById('srch-res').innerHTML = ''; }
  if (s === 's-wa') loadWACustomers();
}

function toast(m) {
  const t = document.getElementById('toast-el');
  if (t) { t.textContent = m; t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 2800); }
}

function gv(id) { return document.getElementById(id)?.value?.trim() || ''; }
function nv(id) { const v = parseFloat(gv(id)); return isNaN(v) ? null : v; }
function inits(n) { return (n || 'C').split(' ').slice(0,2).map(w => w[0]?.toUpperCase() || '').join(''); }

function setBtn(id, loading, text) {
  const btn = document.getElementById(id);
  if (btn) { btn.disabled = loading; btn.innerHTML = loading ? `<span class="loader"></span> ${text}...` : text; }
}

function ensureTailor() {
  if (!tailor) {
    const saved = localStorage.getItem('tailor_session');
    if (saved) { tailor = JSON.parse(saved); }
  }
  if (!tailor) { toast('❌ Pehle login/register karo'); go('s-login'); return false; }
  return true;
}

function showRegister() { go('s-register'); }
function showLogin() { go('s-login'); }

// AUTHENTICATION (LocalStorage)
async function doRegister() {
  const shop_name = gv('r-shop'), username = gv('r-user'), password = gv('r-pass'), phone = gv('r-phone'), address = gv('r-addr');
  if (!shop_name || !username || !password) { toast('❗ Zaroori fields bharo'); return; }

  const users = getDB('users');
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    toast('❌ Username pehle se registered hai!');
    return;
  }

  const newUser = { id: Date.now(), shop_name, username, password, phone, address };
  users.push(newUser);
  setDB('users', users);

  toast('✅ Registration Successful! Login karein.');
  ['r-shop','r-user','r-pass','r-phone','r-addr'].forEach(id => { const e = document.getElementById(id); if(e) e.value = ''; });
  setTimeout(() => go('s-login'), 800);
}

async function doLogin() {
  const username = gv('l-user'), password = gv('l-pass');
  if (!username || !password) { toast('❗ Username aur password daalein'); return; }

  const users = getDB('users');
  const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

  if (found) {
    tailor = found;
    localStorage.setItem('tailor_session', JSON.stringify(tailor));
    document.getElementById('shop-name-badge').textContent = tailor.shop_name;
    document.getElementById('shop-name-dash').textContent = tailor.shop_name;
    toast('✅ Welcome ' + tailor.shop_name);
    go('s-dash');
  } else {
    toast('❌ Username ya Password galat hai!');
  }
}

function doLogout() { tailor = null; localStorage.removeItem('tailor_session'); go('s-login'); }

// DASHBOARD STATS
function loadStats() {
  if (!ensureTailor()) return;
  const customers = getDB('customers_' + tailor.id);
  let income = 0, paid = 0, balance = 0;

  customers.forEach(c => {
    const tot = parseFloat(c.total_price) || 0;
    const pd = parseFloat(c.paid_amount) || 0;
    income += tot;
    paid += pd;
    balance += (tot - pd);
  });

  document.getElementById('st-c').textContent = customers.length;
  document.getElementById('st-r').textContent = '₹' + income.toFixed(0);
  document.getElementById('st-p').textContent = '₹' + paid.toFixed(0);
  document.getElementById('st-b').textContent = '₹' + balance.toFixed(0);
}

function switchTab(t) {
  document.querySelectorAll('.tab').forEach((x, i) => x.classList.toggle('active', (i === 0 && t === 'sp') || (i === 1 && t === 'sh')));
  document.getElementById('tab-sp').style.display = t === 'sp' ? 'block' : 'none';
  document.getElementById('tab-sh').style.display = t === 'sh' ? 'block' : 'none';
  if (t === 'sp') { renderMeasurements('sp', 'sp-container'); renderMeasurements('km', 'km-container'); } 
  else if (t === 'sh') { renderMeasurements('sh', 'sh-container'); renderMeasurements('pt', 'pt-container'); }
}

function calcBal() {
  const t = parseFloat(document.getElementById('nc-total').value) || 0;
  const p = parseFloat(document.getElementById('nc-paid').value) || 0;
  document.getElementById('nc-bal').textContent = '₹' + (t - p);
}

function addField(cid, pfx) {
  const container = document.getElementById(cid);
  if (!container) return;
  const uid = pfx + '_x_' + (++exCnt[pfx]);
  const d = document.createElement('div');
  d.className = 'row3';
  d.id = 'r_' + uid;
  d.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-bottom: 10px; padding: 10px; background: rgba(0, 30, 80, 0.4); border-radius: 8px; border: 1px solid rgba(0, 255, 255, 0.2);';
  d.innerHTML = `
    <input type="text" id="${uid}_l" placeholder="Cup, Length..." style="flex: 0 0 110px; padding: 8px 10px; border: 2px solid rgba(0, 255, 255, 0.3); border-radius: 6px; font-size: 12px; background: rgba(0, 20, 60, 0.6); color: var(--neon-cyan); outline: none; font-weight: 500;"/>
    <span style="color: var(--neon-cyan); font-weight: 700; flex: 0 0 20px; text-align: center;">:</span>
    <input type="number" id="${uid}_v" placeholder="35" step="0.5" style="flex: 1; padding: 8px 10px; border: 2px solid rgba(0, 255, 255, 0.3); border-radius: 6px; font-size: 12px; background: rgba(0, 20, 60, 0.6); color: var(--neon-cyan); outline: none;"/>
    <button onclick="document.getElementById('r_${uid}').remove()" style="background: linear-gradient(135deg, rgba(255, 107, 107, 0.6), rgba(255, 80, 80, 0.5)); border: 2px solid rgba(255, 107, 107, 0.4); color: #ff6b6b; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; flex: 0 0 35px;">❌</button>
  `;
  container.appendChild(d);
}

function getExtras(cid, type) {
  const rows = document.querySelectorAll('#' + cid + ' .row3');
  const out = [];
  rows.forEach(r => {
    const inp = r.querySelectorAll('input');
    if (inp.length >= 2) {
      const label = inp[0].value.trim();
      const val = parseFloat(inp[1].value);
      if (label) out.push({ type, field_name: label, field_value: isNaN(val) ? null : val });
    }
  });
  return out;
}

function clearForm() {
  ['nc-name','nc-phone','nc-addr','nc-notes','nc-total','nc-paid'].forEach(id => { const e = document.getElementById(id); if(e) e.value = ''; });
  Object.values(measurements).forEach(section => { Object.values(section).forEach(id => { const e = document.getElementById(id); if(e) e.value = ''; }); });
  ['sp-extra','km-extra','sh-extra','pt-extra'].forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML = ''; });
  document.getElementById('nc-bal').textContent = '₹0';
  exCnt.sp = exCnt.km = exCnt.sh = exCnt.pt = 0;
}

function openAdd() { clearForm(); renderMeasurements('sp', 'sp-container'); renderMeasurements('km', 'km-container'); switchTab('sp'); go('s-add'); document.getElementById('nc-name').focus(); }

// CUSTOMER MANAGEMENT
async function saveCustomer() {
  if (!ensureTailor()) return;
  const name = gv('nc-name'), phone = gv('nc-phone');
  if (!name) { toast('❗ Naam daalein'); return; }
  if (!phone || phone.length < 10) { toast('❗ Sahi mobile number daalein'); return; }

  const mList = [
    { type:'salwar', field_name:'Kamar', field_value: nv('sp-w') }, { type:'salwar', field_name:'Hip', field_value: nv('sp-h') }, { type:'salwar', field_name:'Lambai', field_value: nv('sp-l') }, { type:'salwar', field_name:'Paur', field_value: nv('sp-b') }, { type:'salwar', field_name:'Ghutna', field_value: nv('sp-k') }, { type:'salwar', field_name:'Kamarband', field_value: nv('sp-band') },
    { type:'kameez', field_name:'Seena', field_value: nv('km-c') }, { type:'kameez', field_name:'Kamar', field_value: nv('km-w') }, { type:'kameez', field_name:'Lambai', field_value: nv('km-l') }, { type:'kameez', field_name:'Bagha', field_value: nv('km-sl') }, { type:'kameez', field_name:'Kandha', field_value: nv('km-sh') }, { type:'kameez', field_name:'Gala', field_value: nv('km-n') },
    { type:'shirt', field_name:'Seena', field_value: nv('sh-c') }, { type:'shirt', field_name:'Kandha', field_value: nv('sh-sh') }, { type:'shirt', field_name:'Lambai', field_value: nv('sh-l') }, { type:'shirt', field_name:'Bagha', field_value: nv('sh-sl') }, { type:'shirt', field_name:'Collar', field_value: nv('sh-co') }, { type:'shirt', field_name:'Kamar', field_value: nv('sh-w') },
    { type:'pant', field_name:'Kamar', field_value: nv('pt-w') }, { type:'pant', field_name:'Hip', field_value: nv('pt-h') }, { type:'pant', field_name:'Lambai', field_value: nv('pt-l') }, { type:'pant', field_name:'Paur', field_value: nv('pt-b') }, { type:'pant', field_name:'Thigh', field_value: nv('pt-t') }, { type:'pant', field_name:'Rise', field_value: nv('pt-r') }
  ].filter(m => m.field_value !== null);

  const custom_measurements = [...getExtras('sp-extra', 'salwar'), ...getExtras('km-extra', 'kameez'), ...getExtras('sh-extra', 'shirt'), ...getExtras('pt-extra', 'pant')];

  const newCust = {
    id: Date.now(),
    name, phone,
    address: gv('nc-addr'),
    notes: gv('nc-notes'),
    total_price: nv('nc-total') || 0,
    paid_amount: nv('nc-paid') || 0,
    measurements: mList,
    custom_measurements,
    created_at: new Date().toISOString().split('T')[0]
  };

  const customers = getDB('customers_' + tailor.id);
  customers.unshift(newCust);
  setDB('customers_' + tailor.id, customers);

  toast('✅ Customer save ho gaya!');
  setTimeout(() => go('s-list'), 500);
}

function cCard(c) {
  const bal = parseFloat(c.total_price) - parseFloat(c.paid_amount);
  return `<div class="ccard" onclick="viewC(${c.id})"><div class="crow"><div class="ava">${inits(c.name)}</div><div style="flex:1"><div class="c-name">${c.name}</div><div class="c-ph"><i class="ti ti-phone" style="font-size:11px"></i> ${c.phone}</div></div><div style="text-align:right">${c.total_price > 0 ? `<div style="font-size:12px;font-weight:500;color:${bal > 0 ? 'var(--danger)' : 'var(--success)'};">${bal > 0 ? 'Baaki ₹' + bal.toFixed(0) : 'Paid ✓'}</div>` : ''}<div style="font-size:11px;color:var(--muted)">${c.created_at || ''}</div></div></div></div>`;
}

function loadCustomers(search = '') {
  if (!ensureTailor()) return;
  const el = document.getElementById('list-body');
  let customers = getDB('customers_' + tailor.id);
  
  if (search) {
    customers = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));
  }

  el.innerHTML = !customers.length ? `<div class="empty"><i class="ti ti-users"></i>Koi customer nahi.<br>Naya jodein!</div>` : customers.map(cCard).join('');
}

let searchTimer = null;
function doSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const q = document.getElementById('s-q').value.trim();
    const el = document.getElementById('srch-res');
    if (!q) { el.innerHTML = ''; return; }
    let customers = getDB('customers_' + tailor.id).filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));
    el.innerHTML = customers.length ? customers.map(cCard).join('') : `<div class="empty"><i class="ti ti-search"></i>"${q}" se koi nahi mila</div>`;
  }, 200);
}

function viewC(id) {
  if (!ensureTailor()) return;
  const customers = getDB('customers_' + tailor.id);
  cur = customers.find(c => c.id === id);
  if (!cur) return;

  const c = cur;
  document.getElementById('d-ava').textContent = inits(c.name);
  document.getElementById('d-name').textContent = c.name;
  document.getElementById('d-ph').textContent = '📱 ' + c.phone;
  document.getElementById('d-addr').textContent = c.address ? '📍 ' + c.address : '';
  document.getElementById('d-notes').textContent = c.notes ? '📝 ' + c.notes : '';
  const total = parseFloat(c.total_price) || 0, paid = parseFloat(c.paid_amount) || 0, bal = total - paid;
  document.getElementById('d-total').textContent = '₹' + total.toFixed(0);
  document.getElementById('d-paid').textContent = '₹' + paid.toFixed(0);
  document.getElementById('d-bal').textContent = '₹' + bal.toFixed(0);
  document.getElementById('extra-pay').value = '';

  const mByType = {}, cmByType = {};
  (c.measurements || []).forEach(m => { if (!mByType[m.type]) mByType[m.type] = []; mByType[m.type].push(m); });
  (c.custom_measurements || []).forEach(m => { if (!cmByType[m.type]) cmByType[m.type] = []; cmByType[m.type].push(m); });

  function buildSection(secId, rowId, type) {
    const rows = mByType[type] || [], customs = cmByType[type] || [], sec = document.getElementById(secId), row = document.getElementById(rowId);
    sec.style.display = (rows.length || customs.length) ? 'block' : 'none';
    row.innerHTML = rows.map(m => `<div class="mrow"><span class="mk">${m.field_name}</span><span class="mv">${m.field_value}"</span></div>`).join('') + customs.map(m => `<div class="mrow"><span class="mk">${m.field_name}</span><span class="mv">${m.field_value}"</span></div>`).join('');
  }
  buildSection('d-sp-sec','d-sp-rows','salwar');
  buildSection('d-km-sec','d-km-rows','kameez');
  buildSection('d-sh-sec','d-sh-rows','shirt');
  buildSection('d-pt-sec','d-pt-rows','pant');
  buildWA(c);
  go('s-detail');
}

function addPayment() {
  if (!ensureTailor() || !cur) return;
  const amount = parseFloat(document.getElementById('extra-pay').value) || 0;
  if (amount <= 0) { toast('❗ Sahi amount daalein'); return; }

  const customers = getDB('customers_' + tailor.id);
  const idx = customers.findIndex(c => c.id === cur.id);
  if (idx !== -1) {
    customers[idx].paid_amount = (parseFloat(customers[idx].paid_amount) || 0) + amount;
    setDB('customers_' + tailor.id, customers);
    cur = customers[idx];

    const total = parseFloat(cur.total_price), paid = parseFloat(cur.paid_amount);
    document.getElementById('d-paid').textContent = '₹' + paid.toFixed(0);
    document.getElementById('d-bal').textContent = '₹' + (total - paid).toFixed(0);
    document.getElementById('extra-pay').value = '';
    buildWA(cur);
    loadStats();
    toast('✅ ₹' + amount + ' payment add hua!');
  }
}

function delCustomer() {
  if (!ensureTailor() || !cur) return;
  if (!confirm('"' + cur.name + '" ko delete karein?')) return;
  let customers = getDB('customers_' + tailor.id);
  customers = customers.filter(c => c.id !== cur.id);
  setDB('customers_' + tailor.id, customers);
  toast('🗑️ Customer delete hua');
  go('s-list');
}

function buildWA(c) {
  const total = parseFloat(c.total_price) || 0, paid = parseFloat(c.paid_amount) || 0, bal = total - paid;
  const pm = `Welcome ${c.name} ji 🙏\n\nAapke kapde ki silai ki jankari:\n\n💰 Kul Daam: ₹${total.toFixed(0)}\n✅ Aapne Diya: ₹${paid.toFixed(0)}\n${bal > 0 ? `⚠️ Baaki Hai: ₹${bal.toFixed(0)}` : '✅ Pura Payment Ho Gaya!'}`;
  const rm = `Welcome ${c.name} ji 🙏\n\n👔 Khushkhabri! Aapke kapde taiyaar ho gaye hain! 🎉\n\n📦 Kab bhi aake le ja sakte hain.\n${bal > 0 ? `\n💰 Baaki: ₹${bal.toFixed(0)}\n` : '\n✅ Payment poori ho gayi!\n'}\nDhanywad aapke vishwas ke liye! 🙏\n\n- ${tailor.shop_name} 🧵`;
  document.getElementById('wa-price-prev').textContent = pm;
  document.getElementById('wa-ready-prev').textContent = rm;
}

function openWA(type) {
  if (!cur) return;
  const total = parseFloat(cur.total_price) || 0, paid = parseFloat(cur.paid_amount) || 0, bal = total - paid;
  let msg = (type === 'price')
    ? `Welcome ${cur.name} ji 🙏\n\nAapke kapde ki silai ki jankari:\n\n💰 Kul Daam: ₹${total.toFixed(0)}\n✅ Aapne Diya: ₹${paid.toFixed(0)}\n${bal > 0 ? `⚠️ Baaki Hai: ₹${bal.toFixed(0)}` : '✅ Pura Payment Ho Gaya!'}\n\n- ${tailor.shop_name} 🧵`
    : `Welcome ${cur.name} ji 🙏\n\n👔 Khushkhabri! Aapke kapde taiyaar ho gaye hain! 🎉\n\n- ${tailor.shop_name} 🧵`;
  
  const phone = '91' + cur.phone.replace(/\D/g, '');
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

window.addEventListener('load', () => {
  const saved = localStorage.getItem('tailor_session');
  if (saved) {
    try {
      tailor = JSON.parse(saved);
      document.getElementById('shop-name-badge').textContent = tailor.shop_name;
      document.getElementById('shop-name-dash').textContent = tailor.shop_name;
      go('s-dash');
    } catch(e) { go('s-login'); }
  } else { go('s-login'); }
});

function loadWACustomers() {
  if (!ensureTailor()) return;
  const customers = getDB('customers_' + tailor.id);
  const listBody = document.getElementById('wa-list-body');
  if (!listBody) return;
  if (!customers.length) { listBody.innerHTML = '<div class="empty">📭 Koi customer nahi hai</div>'; return; }

  let html = '';
  customers.forEach(c => {
    const total = parseFloat(c.total_price) || 0, paid = parseFloat(c.paid_amount) || 0, bal = total - paid;
    html += `<div class="ccard" style="padding: 16px;">
      <div class="crow">
        <div class="ava">${inits(c.name)}</div>
        <div style="flex: 1;">
          <div class="c-name">${c.name}</div>
          <div class="c-ph">📱 ${c.phone}</div>
          <div style="font-size: 11px; color: rgba(0, 255, 255, 0.6); margin-top: 4px;">💰 Baaki: ₹${bal.toFixed(0)}</div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
        <button onclick="sendWAMessage('${c.id}', '${c.name}', '${c.phone}', ${total}, ${paid}, 'price')" style="background: linear-gradient(135deg, rgba(37, 211, 102, 0.8), rgba(46, 168, 104, 0.7)); border: 2px solid rgba(37, 211, 102, 0.5); color: #fff; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600;">💰 Price Message</button>
        <button onclick="sendWAMessage('${c.id}', '${c.name}', '${c.phone}', ${total}, ${paid}, 'ready')" style="background: linear-gradient(135deg, rgba(37, 211, 102, 0.8), rgba(46, 168, 104, 0.7)); border: 2px solid rgba(37, 211, 102, 0.5); color: #fff; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600;">✅ Ready Message</button>
      </div>
    </div>`;
  });
  listBody.innerHTML = html;
}

function sendWAMessage(id, name, phone, total, paid, type) {
  const bal = total - paid;
  let msg = (type === 'price')
    ? `Welcome ${name} ji 🙏\n\nAapke kapde ki silai ki jankari:\n\n💰 Kul Daam: ₹${total.toFixed(0)}\n✅ Aapne Diya: ₹${paid.toFixed(0)}\n${bal > 0 ? `⚠️ Baaki Hai: ₹${bal.toFixed(0)}` : '✅ Pura Payment Ho Gaya!'}\n\n- ${tailor.shop_name} 🧵`
    : `Welcome ${name} ji 🙏\n\n👔 Khushkhabri! Aapke kapde taiyaar ho gaye hain! 🎉\n\n- ${tailor.shop_name} 🧵`;
  
  const pn = '91' + phone.replace(/\D/g, '');
  window.open(`https://wa.me/${pn}?text=${encodeURIComponent(msg)}`, '_blank');
}
