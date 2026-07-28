const API = 'http://tailor-app.infinityfreeapp.com';
let tailor = null;
let cur = null;
const exCnt = { sp: 0, km: 0, sh: 0, pt: 0 };

// Measurements Map
const measurements = {
  sp: {
    'Kamar': 'sp-w',
    'Hip': 'sp-h',
    'Lambai': 'sp-l',
    'Paur': 'sp-b',
    'Ghutna': 'sp-k',
    'Kamarband': 'sp-band'
  },
  km: {
    'Seena': 'km-c',
    'Kamar': 'km-w',
    'Lambai': 'km-l',
    'Bagha': 'km-sl',
    'Kandha': 'km-sh',
    'Gala': 'km-n'
  },
  sh: {
    'Seena': 'sh-c',
    'Kandha': 'sh-sh',
    'Lambai': 'sh-l',
    'Bagha': 'sh-sl',
    'Collar': 'sh-co',
    'Kamar': 'sh-w'
  },
  pt: {
    'Kamar': 'pt-w',
    'Hip': 'pt-h',
    'Lambai': 'pt-l',
    'Paur': 'pt-b',
    'Thigh': 'pt-t',
    'Rise': 'pt-r'
  }
};

// Render measurements from map
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

// Initialize measurements on page load
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
function inits(n) { return n.split(' ').slice(0,2).map(w => w[0]?.toUpperCase() || '').join(''); }

async function api(file, data) {
  try {
    const res = await fetch(`${API}/${file}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return await res.json();
  } catch (e) { return { success: false, message: 'Server connection fail' }; }
}

async function apiGet(file, params = {}) {
  try {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API}/${file}?${q}`);
    return await res.json();
  } catch (e) { return { success: false, message: 'Server connection fail' }; }
}

function setBtn(id, loading, text) {
  const btn = document.getElementById(id);
  if (btn) { btn.disabled = loading; btn.innerHTML = loading ? `<span class="loader"></span> ${text}...` : text; }
}

function getTailorId() {
  if (!tailor) {
    const saved = localStorage.getItem('tailor_session');
    if (saved) {
      try { tailor = JSON.parse(saved); console.log('✅ Restored tailor:', tailor); } catch(e) { console.error('Parse error:', e); return null; }
    }
  }
  return tailor ? (tailor.id || tailor.tailor_id) : null;
}

function ensureTailor() {
  const tid = getTailorId();
  if (!tid) {
    toast('❌ Pehle login karo');
    go('s-login');
    return false;
  }
  return true;
}

function showRegister() { go('s-register'); }
function showLogin() { go('s-login'); }

async function doLogin() {
  const username = gv('l-user'), password = gv('l-pass');
  if (!username || !password) { toast('❗ Username aur password daalein'); return; }
  setBtn('login-btn', true, 'Login');
  const res = await api('auth.php', { action: 'login', username, password });
  setBtn('login-btn', false, '<i class="ti ti-login"></i> Login Karein');
  console.log('Login response:', res);
  if (res.success) {
    tailor = res.data;
    tailor.id = tailor.id || tailor.tailor_id;
    localStorage.setItem('tailor_session', JSON.stringify(tailor));
    console.log('✅ Session saved:', tailor);
    document.getElementById('shop-name-badge').textContent = tailor.shop_name;
    document.getElementById('shop-name-dash').textContent = tailor.shop_name;
    go('s-dash');
  } else { toast('❌ ' + res.message); }
}

async function doRegister() {
  const shop_name = gv('r-shop'), username = gv('r-user'), password = gv('r-pass'), phone = gv('r-phone'), address = gv('r-addr');
  if (!shop_name || !username || !password) { toast('❗ Zaroori fields bharo'); return; }
  setBtn('reg-btn', true, 'Register');
  const res = await api('auth.php', { action: 'register', shop_name, username, password, phone, address });
  setBtn('reg-btn', false, '<i class="ti ti-user-plus"></i> Register Karein');
  if (res.success) {
    toast('✅ Registration hua! Ab login karein.');
    ['r-shop','r-user','r-pass','r-phone','r-addr'].forEach(id => { const e = document.getElementById(id); if(e) e.value = ''; });
    setTimeout(() => go('s-login'), 1000);
  } else { toast('❌ ' + res.message); }
}

function doLogout() { tailor = null; localStorage.removeItem('tailor_session'); go('s-login'); }

async function loadStats() {
  if (!ensureTailor()) return;
  const tid = getTailorId();
  const res = await apiGet('customers.php', { action: 'stats', tailor_id: tid });
  if (res.success) {
    const d = res.data;
    document.getElementById('st-c').textContent = d.total_customers;
    document.getElementById('st-r').textContent = '₹' + parseFloat(d.total_income).toFixed(0);
    document.getElementById('st-p').textContent = '₹' + parseFloat(d.total_paid).toFixed(0);
    document.getElementById('st-b').textContent = '₹' + parseFloat(d.total_balance).toFixed(0);
  }
}

function switchTab(t) {
  document.querySelectorAll('.tab').forEach((x, i) => x.classList.toggle('active', (i === 0 && t === 'sp') || (i === 1 && t === 'sh')));
  document.getElementById('tab-sp').style.display = t === 'sp' ? 'block' : 'none';
  document.getElementById('tab-sh').style.display = t === 'sh' ? 'block' : 'none';
  
  if (t === 'sp') {
    renderMeasurements('sp', 'sp-container');
    renderMeasurements('km', 'km-container');
  } else if (t === 'sh') {
    renderMeasurements('sh', 'sh-container');
    renderMeasurements('pt', 'pt-container');
  }
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
      if (label) out.push({ type, label, val: isNaN(val) ? null : val });
    }
  });
  return out;
}

function clearForm() {
  // Clear basic fields
  ['nc-name','nc-phone','nc-addr','nc-notes','nc-total','nc-paid'].forEach(id => { 
    const e = document.getElementById(id); 
    if(e) e.value = ''; 
  });
  
  // Clear all measurement inputs (from map)
  Object.values(measurements).forEach(section => {
    Object.values(section).forEach(id => {
      const e = document.getElementById(id);
      if(e) e.value = '';
    });
  });
  
  // Clear extra fields
  ['sp-extra','km-extra','sh-extra','pt-extra'].forEach(id => { 
    const el = document.getElementById(id);
    if(el) el.innerHTML = ''; 
  });
  
  document.getElementById('nc-bal').textContent = '₹0';
  exCnt.sp = exCnt.km = exCnt.sh = exCnt.pt = 0;
}

function openAdd() { clearForm(); renderMeasurements('sp', 'sp-container'); renderMeasurements('km', 'km-container'); switchTab('sp'); go('s-add'); document.getElementById('nc-name').focus(); }

async function saveCustomer() {
  if (!ensureTailor()) return;
  const tid = getTailorId();
  console.log('💾 Saving with tailor_id:', tid);
  if (!tid) { toast('❌ Tailor ID missing'); return; }
  
  const name = gv('nc-name'), phone = gv('nc-phone');
  if (!name) { toast('❗ Naam daalein'); return; }
  if (!phone || phone.length < 10) { toast('❗ Sahi mobile number daalein'); return; }
  
  const measurements = [
    { type:'salwar', name:'Kamar', value: nv('sp-w') }, { type:'salwar', name:'Hip', value: nv('sp-h') }, { type:'salwar', name:'Lambai', value: nv('sp-l') }, { type:'salwar', name:'Paur', value: nv('sp-b') }, { type:'salwar', name:'Ghutna', value: nv('sp-k') }, { type:'salwar', name:'Kamarband', value: nv('sp-band') },
    { type:'kameez', name:'Seena', value: nv('km-c') }, { type:'kameez', name:'Kamar', value: nv('km-w') }, { type:'kameez', name:'Lambai', value: nv('km-l') }, { type:'kameez', name:'Bagha', value: nv('km-sl') }, { type:'kameez', name:'Kandha', value: nv('km-sh') }, { type:'kameez', name:'Gala', value: nv('km-n') },
    { type:'shirt', name:'Seena', value: nv('sh-c') }, { type:'shirt', name:'Kandha', value: nv('sh-sh') }, { type:'shirt', name:'Lambai', value: nv('sh-l') }, { type:'shirt', name:'Bagha', value: nv('sh-sl') }, { type:'shirt', name:'Collar', value: nv('sh-co') }, { type:'shirt', name:'Kamar', value: nv('sh-w') },
    { type:'pant', name:'Kamar', value: nv('pt-w') }, { type:'pant', name:'Hip', value: nv('pt-h') }, { type:'pant', name:'Lambai', value: nv('pt-l') }, { type:'pant', name:'Paur', value: nv('pt-b') }, { type:'pant', name:'Thigh', value: nv('pt-t') }, { type:'pant', name:'Rise', value: nv('pt-r') }
  ].filter(m => m.value !== null);
  
  const custom_measurements = [...getExtras('sp-extra', 'salwar'), ...getExtras('km-extra', 'kameez'), ...getExtras('sh-extra', 'shirt'), ...getExtras('pt-extra', 'pant')];
  
  setBtn('save-btn', true, 'Save');
  const res = await api('customers.php', { action: 'add', tailor_id: tid, name, phone, address: gv('nc-addr'), notes: gv('nc-notes'), total_price: nv('nc-total') || 0, paid_amount: nv('nc-paid') || 0, measurements, custom_measurements });
  setBtn('save-btn', false, '<i class="ti ti-device-floppy"></i> Customer Save Karein');
  console.log('Save response:', res);
  if (res.success) { toast('✅ Customer save ho gaya!'); setTimeout(() => go('s-list'), 700); } else { toast('❌ ' + res.message); }
}

function cCard(c) {
  const bal = parseFloat(c.total_price) - parseFloat(c.paid_amount);
  return `<div class="ccard" onclick="viewC(${c.id})"><div class="crow"><div class="ava">${inits(c.name)}</div><div style="flex:1"><div class="c-name">${c.name}</div><div class="c-ph"><i class="ti ti-phone" style="font-size:11px"></i> ${c.phone}</div></div><div style="text-align:right">${c.total_price > 0 ? `<div style="font-size:12px;font-weight:500;color:${bal > 0 ? 'var(--danger)' : 'var(--success)'};">${bal > 0 ? 'Baaki ₹' + bal.toFixed(0) : 'Paid ✓'}</div>` : ''}<div style="font-size:11px;color:var(--muted)">${c.created_at ? c.created_at.split(' ')[0] : ''}</div></div></div></div>`;
}

async function loadCustomers(search = '') {
  if (!ensureTailor()) return;
  const tid = getTailorId();
  const el = document.getElementById('list-body');
  el.innerHTML = `<div class="empty"><span class="loader" style="border-color:var(--gold);border-top-color:var(--navy)"></span> Load ho raha hai...</div>`;
  const res = await apiGet('customers.php', { action: 'get_all', tailor_id: tid, search });
  if (res.success) { el.innerHTML = !res.data.length ? `<div class="empty"><i class="ti ti-users"></i>Koi customer nahi.<br>Naya jodein!</div>` : res.data.map(cCard).join(''); } else { el.innerHTML = `<div class="empty" style="color:var(--danger)">${res.message}</div>`; }
}

let searchTimer = null;
function doSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    const q = document.getElementById('s-q').value.trim();
    const el = document.getElementById('srch-res');
    if (!q) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="empty"><span class="loader" style="border-color:var(--gold);border-top-color:var(--navy)"></span></div>`;
    const tid = getTailorId();
    const res = await apiGet('customers.php', { action: 'get_all', tailor_id: tid, search: q });
    if (res.success && res.data.length) { el.innerHTML = res.data.map(cCard).join(''); } else { el.innerHTML = `<div class="empty"><i class="ti ti-search"></i>"${q}" se koi nahi mila</div>`; }
  }, 400);
}

async function viewC(id) {
  if (!ensureTailor()) return;
  const tid = getTailorId();
  const res = await apiGet('customers.php', { action: 'get_one', tailor_id: tid, customer_id: id });
  if (!res.success) { toast('❌ ' + res.message); return; }
  cur = res.data;
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

async function addPayment() {
  if (!ensureTailor()) return;
  const tid = getTailorId();
  const amount = parseFloat(document.getElementById('extra-pay').value) || 0;
  if (amount <= 0) { toast('❗ Sahi amount daalein'); return; }
  const res = await api('customers.php', { action: 'add_payment', tailor_id: tid, customer_id: cur.id, amount });
  if (res.success) {
    const d = res.data, total = parseFloat(d.total_price), paid = parseFloat(d.paid_amount);
    document.getElementById('d-paid').textContent = '₹' + paid.toFixed(0);
    document.getElementById('d-bal').textContent = '₹' + (total - paid).toFixed(0);
    document.getElementById('extra-pay').value = '';
    cur.paid_amount = paid;
    cur.total_price = total;
    buildWA(cur);
    loadStats();
    toast('✅ ₹' + amount + ' payment add hua!');
  } else { toast('❌ ' + res.message); }
}

async function delCustomer() {
  if (!ensureTailor()) return;
  const tid = getTailorId();
  if (!cur) return;
  if (!confirm('"' + cur.name + '" ko delete karein?')) return;
  const res = await api('customers.php', { action: 'delete', tailor_id: tid, customer_id: cur.id });
  if (res.success) { toast('🗑️ Customer delete hua'); go('s-list'); } else { toast('❌ ' + res.message); }
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
  let msg = '';
  if (type === 'price') {
    msg = `Welcome ${cur.name} ji 🙏\n\nAapke kapde ki silai ki jankari:\n\n💰 Kul Daam: ₹${total.toFixed(0)}\n✅ Aapne Diya: ₹${paid.toFixed(0)}\n${bal > 0 ? `⚠️ Baaki Hai: ₹${bal.toFixed(0)}` : '✅ Pura Payment Ho Gaya!'}\n\nKoi sawaal ho toh zaroor batao.\n\n- ${tailor.shop_name} 🧵`;
  } else {
    msg = `Welcome ${cur.name} ji 🙏\n\n👔 Khushkhabri! Aapke kapde taiyaar ho gaye hain! 🎉\n\n📦 Kab bhi aake le ja sakte hain.\n${bal > 0 ? `\n💰 Baaki Payment: ₹${bal.toFixed(0)}\n` : '\n✅ Payment poori ho gayi!\n'}\nDhanywad aapke vishwas ke liye! 🙏\n\n- ${tailor.shop_name} 🧵`;
  }
  const phone = '91' + cur.phone.replace(/\D/g, '');
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

window.addEventListener('load', () => {
  const saved = localStorage.getItem('tailor_session');
  if (saved) {
    try { tailor = JSON.parse(saved); tailor.id = tailor.id || tailor.tailor_id; document.getElementById('shop-name-badge').textContent = tailor.shop_name; document.getElementById('shop-name-dash').textContent = tailor.shop_name; go('s-dash'); } catch(e) { go('s-login'); }
  } else { go('s-login'); }
});

// ===== WHATSAPP SCREEN =====
async function loadWACustomers() {
  if (!ensureTailor()) return;
  const tid = getTailorId();
  const res = await apiGet('customers.php', { action: 'get_all', tailor_id: tid });

  const listBody = document.getElementById('wa-list-body');
  if (!listBody) return;

  if (!res.success || !Array.isArray(res.data)) {
    listBody.innerHTML = '<div class="empty">📭 Koi customer nahi hai</div>';
    return;
  }

  if (res.data.length === 0) {
    listBody.innerHTML = '<div class="empty">📭 Koi customer nahi hai</div>';
    return;
  }

  let html = '';
  res.data.forEach(c => {
    const total = parseFloat(c.total_price) || 0;
    const paid = parseFloat(c.paid_amount) || 0;
    const bal = total - paid;
    html += `<div class="ccard" style="padding: 16px;">
      <div class="crow">
        <div class="ava">${c.name.charAt(0).toUpperCase()}</div>
        <div style="flex: 1;">
          <div class="c-name">${c.name}</div>
          <div class="c-ph">📱 ${c.phone}</div>
          <div style="font-size: 11px; color: rgba(0, 255, 255, 0.6); margin-top: 4px;">💰 Baaki: ₹${bal.toFixed(0)}</div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
        <button onclick="sendWAMessage('${c.id}', '${c.name}', '${c.phone}', ${total}, ${paid}, 'price')" style="background: linear-gradient(135deg, rgba(37, 211, 102, 0.8), rgba(46, 168, 104, 0.7)); border: 2px solid rgba(37, 211, 102, 0.5); color: rgba(37, 211, 102, 0.9); padding: 10px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600;">💰 Price Message</button>
        <button onclick="sendWAMessage('${c.id}', '${c.name}', '${c.phone}', ${total}, ${paid}, 'ready')" style="background: linear-gradient(135deg, rgba(37, 211, 102, 0.8), rgba(46, 168, 104, 0.7)); border: 2px solid rgba(37, 211, 102, 0.5); color: rgba(37, 211, 102, 0.9); padding: 10px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600;">✅ Ready Message</button>
      </div>
    </div>`;
  });
  listBody.innerHTML = html;
}

function filterWACustomers() {
  const query = document.getElementById('wa-search').value.toLowerCase();
  const cards = document.querySelectorAll('#wa-list-body .ccard');
  let found = false;

  cards.forEach(c => {
    const text = c.textContent.toLowerCase();
    const shouldShow = text.includes(query);
    c.style.display = shouldShow ? 'block' : 'none';
    if (shouldShow) found = true;
  });

  const noResults = document.getElementById('wa-no-results');
  if (query && !found) {
    if (!noResults) {
      const msg = document.createElement('div');
      msg.id = 'wa-no-results';
      msg.className = 'empty';
      msg.textContent = '🔎 Koi customer match nahi hua';
      document.getElementById('wa-list-body').appendChild(msg);
    }
  } else if (noResults) {
    noResults.remove();
  }
}

function sendWAMessage(id, name, phone, total, paid, type) {
  const bal = total - paid;
  let msg = '';
  
  if (type === 'price') {
    msg = `Welcome ${name} ji 🙏\n\nAapke kapde ki silai ki jankari:\n\n💰 Kul Daam: ₹${total.toFixed(0)}\n✅ Aapne Diya: ₹${paid.toFixed(0)}\n${bal > 0 ? `⚠️ Baaki Hai: ₹${bal.toFixed(0)}` : '✅ Pura Payment Ho Gaya!'}\n\nKoi sawaal ho toh zaroor batao.\n\n- ${tailor.shop_name} 🧵`;
  } else if (type === 'ready') {
    msg = `Welcome ${name} ji 🙏\n\n👔 Khushkhabri! Aapke kapde taiyaar ho gaye hain! 🎉\n\n📦 Kab bhi aake le ja sakte hain.\n${bal > 0 ? `\n💰 Baaki Payment: ₹${bal.toFixed(0)}\n` : '\n✅ Payment poori ho gayi!\n'}Dhanywad aapke vishwas ke liye! 🙏\n\n- ${tailor.shop_name} 🧵`;
  }
  
  const pn = '91' + phone.replace(/\D/g, '');
  window.open(`https://wa.me/${pn}?text=${encodeURIComponent(msg)}`, '_blank');
  toast('✅ WhatsApp khul gaya! Message bhejo!');
}
