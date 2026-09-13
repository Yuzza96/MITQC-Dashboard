// ═══════════════════════════════════════
//  MITQC Dashboard — app.js
//  Backend: Google Sheets via Apps Script
// ═══════════════════════════════════════

const API_URL = 'https://script.google.com/macros/s/AKfycbweY8tsHnlXUNloDu3-JFmanSX0uoBdK8lrdBCgTJeacDaUI0RUXe973xnYg3FgdSEOuw/exec';

let allRecords = [];
let charts = { status: null, material: null };

// ── NAVIGATION ───────────────────────
function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  document.querySelector(`[data-panel="${id}"]`).classList.add('active');
  if (id === 'home') renderHome();
  if (id === 'report') renderReport();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showPanel(btn.dataset.panel));
});

// ── TOAST ────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = (type === 'success' ? '✅ ' : '❌ ') + msg;
  t.className = 'toast show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.className = 'toast', 3500);
}

// ── STATUS BADGE ─────────────────────
function badge(status) {
  const s = (status || '').toLowerCase();
  let cls = 'badge-other';
  if (s === 'pass') cls = 'badge-pass';
  else if (s === 'fail') cls = 'badge-fail';
  else if (s === 'pending') cls = 'badge-pending';
  return `<span class="badge ${cls}">${status || '—'}</span>`;
}

// ── JSONP (bypass CORS for both GET & "POST") ─
function jsonp(params) {
  return new Promise((resolve, reject) => {
    const callbackName = 'mitqc_cb_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
    const script = document.createElement('script');
    const query  = new URLSearchParams({ ...params, callback: callbackName }).toString();

    window[callbackName] = function(data) {
      delete window[callbackName];
      script.remove();
      resolve(data);
    };

    script.src = API_URL + '?' + query;
    script.onerror = () => {
      delete window[callbackName];
      script.remove();
      reject(new Error('Script load failed'));
    };
    document.body.appendChild(script);
  });
}

async function fetchRecords() {
  const data = await jsonp({ action: 'list' });
  if (data && data.status === 'ok') {
    allRecords = data.data || [];
    return allRecords;
  }
  throw new Error(data?.message || 'Unknown error');
}

// ── HOME ─────────────────────────────
async function renderHome() {
  document.getElementById('home-stats').innerHTML = `
    <div class="stat-card"><div class="s-label">Loading...</div><div class="s-value">—</div></div>
    <div class="stat-card"><div class="s-label">Loading...</div><div class="s-value">—</div></div>
    <div class="stat-card"><div class="s-label">Loading...</div><div class="s-value">—</div></div>
    <div class="stat-card"><div class="s-label">Loading...</div><div class="s-value">—</div></div>
  `;

  try {
    await fetchRecords();
  } catch (err) {
    showToast('Gagal load data.', 'error');
    console.error(err);
  }

  const qtyOK = allRecords.reduce((s, r) => s + (Number(r['Qty OK']) || 0), 0);
  const qtyNG = allRecords.reduce((s, r) => s + (Number(r['Qty NG']) || 0), 0);
  const ncr   = allRecords.filter(r => r['NCR'] && r['NCR'].trim() && r['NCR'].toUpperCase() !== 'N/A').length;

  document.getElementById('home-stats').innerHTML = `
    <div class="stat-card">
      <div class="s-label">Total Rekod</div>
      <div class="s-value">${allRecords.length}</div>
      <div class="s-sub">Keseluruhan entri</div>
    </div>
    <div class="stat-card stat-ok">
      <div class="s-label">Quantity OK</div>
      <div class="s-value">${qtyOK}</div>
      <div class="s-sub">Unit lulus</div>
    </div>
    <div class="stat-card stat-ng">
      <div class="s-label">Quantity NG</div>
      <div class="s-value">${qtyNG}</div>
      <div class="s-sub">Unit gagal</div>
    </div>
    <div class="stat-card stat-ncr">
      <div class="s-label">NCR Aktif</div>
      <div class="s-value">${ncr}</div>
      <div class="s-sub">Perlu tindakan</div>
    </div>
  `;

  const tbody  = document.getElementById('home-tbody');
  const recent = allRecords.slice(0, 10);

  if (!recent.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><span>📭</span>Tiada rekod lagi. Tambah rekod baru!</div></td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(r => `
    <tr>
      <td>${r['Inspection Date'] || '—'}</td>
      <td>${r['Route Card'] || '—'}</td>
      <td>${r['Part Description'] || '—'}</td>
      <td>${r['Material'] || '—'}</td>
      <td>${badge(r['Inspection Status'])}</td>
      <td>${r['Qty OK'] || 0}</td>
      <td>${r['Qty NG'] || 0}</td>
    </tr>
  `).join('');
}

// ── FORM SUBMIT ──────────────────────
document.getElementById('qc-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Menyimpan...';

  const record = {
    date:        document.getElementById('f-date').value,
    routecard:   document.getElementById('f-routecard').value,
    po:          document.getElementById('f-po').value,
    drawing:     document.getElementById('f-drawing').value,
    part:        document.getElementById('f-part').value,
    qtypo:       document.getElementById('f-qtypo').value,
    material:    document.getElementById('f-material').value,
    nextprocess: document.getElementById('f-nextprocess').value,
    inspector:   document.getElementById('f-inspector').value,
    status:      document.getElementById('f-status').value,
    partstatus:  document.getElementById('f-partstatus').value,
    qtyok:       document.getElementById('f-qtyok').value,
    qtyng:       document.getElementById('f-qtyng').value,
    short:       document.getElementById('f-short').value,
    ncr:         document.getElementById('f-ncr').value,
    ncrstatus:   document.getElementById('f-ncrstatus').value,
    remark:      document.getElementById('f-remark').value,
  };

  try {
    const data = await jsonp({ action: 'save', ...record });
    if (!data || data.status !== 'ok') throw new Error(data?.message || 'Unknown error');
    showToast('Rekod berjaya disimpan!');
    this.reset();
    document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
  } catch (err) {
    showToast('Gagal simpan rekod.', 'error');
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Simpan Rekod';
  }
});

document.getElementById('reset-btn').addEventListener('click', () => {
  document.getElementById('qc-form').reset();
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
});

// ── REPORT ───────────────────────────
async function renderReport() {
  try { await fetchRecords(); } catch (err) { showToast('Gagal load data.', 'error'); }
  populateFilters();
  renderReportTable();
  renderCharts();
}

function getFiltered() {
  const status   = document.getElementById('filter-status').value;
  const material = document.getElementById('filter-material').value;
  const start    = document.getElementById('filter-start').value;
  const end      = document.getElementById('filter-end').value;

  return allRecords.filter(r => {
    if (status   && r['Inspection Status'] !== status) return false;
    if (material && r['Material'] !== material)         return false;
    if (start    && r['Inspection Date'] < start)       return false;
    if (end      && r['Inspection Date'] > end)         return false;
    return true;
  });
}

function populateFilters() {
  const unique = key => [...new Set(allRecords.map(r => r[key]).filter(Boolean))].sort();
  fillSelect('filter-status',   unique('Inspection Status'));
  fillSelect('filter-material', unique('Material'));
}

function fillSelect(id, options) {
  const sel = document.getElementById(id);
  const val = sel.value;
  sel.innerHTML = '<option value="">Semua</option>' + options.map(o => `<option>${o}</option>`).join('');
  if (val) sel.value = val;
}

function renderReportTable() {
  const data  = getFiltered();
  const tbody = document.getElementById('report-tbody');

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="12"><div class="empty-state"><span>📭</span>Tiada rekod dijumpai.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${r['Inspection Date'] || '—'}</td>
      <td>${r['Route Card'] || '—'}</td>
      <td>${r['PO#'] || '—'}</td>
      <td>${r['Part Description'] || '—'}</td>
      <td>${r['Material'] || '—'}</td>
      <td>${badge(r['Inspection Status'])}</td>
      <td>${r['Qty OK'] || 0}</td>
      <td>${r['Qty NG'] || 0}</td>
      <td>${r['NCR'] || '—'}</td>
      <td>${r['NC Status'] || '—'}</td>
      <td>${r['Remark'] || '—'}</td>
      <td>—</td>
    </tr>
  `).join('');
}

function renderCharts() {
  const data = getFiltered();

  const statusCount = data.reduce((a, r) => {
    const k = r['Inspection Status'] || 'Unknown';
    a[k] = (a[k] || 0) + 1; return a;
  }, {});

  const matCount = data.reduce((a, r) => {
    const k = r['Material'] || 'Unknown';
    a[k] = (a[k] || 0) + 1; return a;
  }, {});

  const statusColors = { 'Pass':'#4ade80','Fail':'#f87171','Conditional Pass':'#60a5fa','Pending':'#fbbf24','Unknown':'#94a3b8' };
  const top = Object.entries(matCount).sort((a,b) => b[1]-a[1]).slice(0,8);

  if (charts.status) charts.status.destroy();
  charts.status = new Chart(document.getElementById('chart-status'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(statusCount),
      datasets: [{ data: Object.values(statusCount), backgroundColor: Object.keys(statusCount).map(k => statusColors[k] || '#94a3b8'), borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#eef2ff', font: { size: 12 } } } } }
  });

  if (charts.material) charts.material.destroy();
  charts.material = new Chart(document.getElementById('chart-material'), {
    type: 'bar',
    data: {
      labels: top.map(m => m[0]),
      datasets: [{ label: 'Rekod', data: top.map(m => m[1]), backgroundColor: '#4f8ef7', borderRadius: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8', maxRotation: 35 }, grid: { display: false } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
      }
    }
  });
}

['filter-status','filter-material','filter-start','filter-end'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => { renderReportTable(); renderCharts(); });
});

document.getElementById('clear-filter-btn').addEventListener('click', () => {
  ['filter-status','filter-material','filter-start','filter-end'].forEach(id => document.getElementById(id).value = '');
  renderReportTable(); renderCharts();
});

// ── EXPORT CSV ───────────────────────
document.getElementById('export-btn').addEventListener('click', () => {
  const data = getFiltered();
  if (!data.length) { showToast('Tiada data untuk export.', 'error'); return; }
  const keys = ['Inspection Date','Route Card','PO#','Drawing No.','Part Description','Qty PO','Material','Next Process','Inspected By','Inspection Status','Part Status','Qty OK','Qty NG','Short','NCR','NC Status','Remark'];
  const csv  = [keys.join(','), ...data.map(r => keys.map(k => `"${(r[k]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n');
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `MITQC_Export_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  showToast('Export berjaya!');
});

// ── INIT ─────────────────────────────
document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
renderHome();
