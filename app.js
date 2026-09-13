// ═══════════════════════════════════════
//  MITQC Dashboard — app.js
//  Storage: localStorage
// ═══════════════════════════════════════

const DB_KEY = 'mitqc_records';
let deleteTargetId = null;
let charts = { status: null, material: null };

// ── STORAGE ──────────────────────────
function getRecords() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; }
  catch { return []; }
}

function saveRecords(records) {
  localStorage.setItem(DB_KEY, JSON.stringify(records));
}

function addRecord(record) {
  const records = getRecords();
  record.id = Date.now().toString();
  record.createdAt = new Date().toISOString();
  records.unshift(record);
  saveRecords(records);
  return record;
}

function deleteRecord(id) {
  const records = getRecords().filter(r => r.id !== id);
  saveRecords(records);
}

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

// ── HOME ─────────────────────────────
function renderHome() {
  const records = getRecords();
  const qtyOK = records.reduce((s, r) => s + (Number(r.qtyok) || 0), 0);
  const qtyNG = records.reduce((s, r) => s + (Number(r.qtyng) || 0), 0);
  const ncr = records.filter(r => r.ncr && r.ncr.trim() && r.ncr.toUpperCase() !== 'N/A').length;

  document.getElementById('home-stats').innerHTML = `
    <div class="stat-card">
      <div class="s-label">Total Rekod</div>
      <div class="s-value">${records.length}</div>
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

  const tbody = document.getElementById('home-tbody');
  const recent = records.slice(0, 10);

  if (!recent.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><span>📭</span>Tiada rekod lagi. Tambah rekod baru!</div></td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(r => `
    <tr>
      <td>${r.date || '—'}</td>
      <td>${r.routecard || '—'}</td>
      <td>${r.part || '—'}</td>
      <td>${r.material || '—'}</td>
      <td>${badge(r.status)}</td>
      <td>${r.qtyok || 0}</td>
      <td>${r.qtyng || 0}</td>
    </tr>
  `).join('');
}

// ── FORM ─────────────────────────────
document.getElementById('qc-form').addEventListener('submit', function(e) {
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

  addRecord(record);
  showToast('Rekod berjaya disimpan!');
  this.reset();
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];

  btn.disabled = false;
  btn.textContent = '💾 Simpan Rekod';
});

document.getElementById('reset-btn').addEventListener('click', () => {
  document.getElementById('qc-form').reset();
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
});

// ── REPORT ───────────────────────────
function getFiltered() {
  const status   = document.getElementById('filter-status').value;
  const material = document.getElementById('filter-material').value;
  const start    = document.getElementById('filter-start').value;
  const end      = document.getElementById('filter-end').value;

  return getRecords().filter(r => {
    if (status && r.status !== status) return false;
    if (material && r.material !== material) return false;
    if (start && r.date && r.date < start) return false;
    if (end && r.date && r.date > end) return false;
    return true;
  });
}

function renderReport() {
  const records = getRecords();

  // Populate filters
  const statuses  = [...new Set(records.map(r => r.status).filter(Boolean))].sort();
  const materials = [...new Set(records.map(r => r.material).filter(Boolean))].sort();
  fillSelect('filter-status', statuses);
  fillSelect('filter-material', materials);

  renderReportTable();
  renderCharts();
}

function fillSelect(id, options) {
  const sel = document.getElementById(id);
  const val = sel.value;
  sel.innerHTML = '<option value="">Semua</option>' + options.map(o => `<option>${o}</option>`).join('');
  if (val) sel.value = val;
}

function renderReportTable() {
  const data = getFiltered();
  const tbody = document.getElementById('report-tbody');

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="12"><div class="empty-state"><span>📭</span>Tiada rekod dijumpai.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${r.date || '—'}</td>
      <td>${r.routecard || '—'}</td>
      <td>${r.po || '—'}</td>
      <td>${r.part || '—'}</td>
      <td>${r.material || '—'}</td>
      <td>${badge(r.status)}</td>
      <td>${r.qtyok || 0}</td>
      <td>${r.qtyng || 0}</td>
      <td>${r.ncr || '—'}</td>
      <td>${r.ncrstatus || '—'}</td>
      <td>${r.remark || '—'}</td>
      <td><button class="icon-btn" onclick="confirmDelete('${r.id}')" title="Padam">🗑</button></td>
    </tr>
  `).join('');
}

function renderCharts() {
  const data = getFiltered();

  // Status chart
  const statusCount = data.reduce((a, r) => { a[r.status || 'Unknown'] = (a[r.status || 'Unknown'] || 0) + 1; return a; }, {});
  const statusColors = { 'Pass': '#34C759', 'Fail': '#FF3B30', 'Conditional Pass': '#007AFF', 'Pending': '#FF9500', 'Unknown': '#a1a1a6' };

  if (charts.status) charts.status.destroy();
  charts.status = new Chart(document.getElementById('chart-status'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(statusCount),
      datasets: [{ data: Object.values(statusCount), backgroundColor: Object.keys(statusCount).map(k => statusColors[k] || '#a1a1a6'), borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#1d1d1f', font: { size: 12 } } } } }
  });

  // Material chart
  const matCount = data.reduce((a, r) => { const k = r.material || 'Unknown'; a[k] = (a[k] || 0) + 1; return a; }, {});
  const top = Object.entries(matCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

  if (charts.material) charts.material.destroy();
  charts.material = new Chart(document.getElementById('chart-material'), {
    type: 'bar',
    data: {
      labels: top.map(m => m[0]),
      datasets: [{ label: 'Rekod', data: top.map(m => m[1]), backgroundColor: '#007AFF', borderRadius: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#6e6e73', maxRotation: 35 }, grid: { display: false } },
        y: { ticks: { color: '#6e6e73' }, grid: { color: 'rgba(0,0,0,0.06)' }, beginAtZero: true }
      }
    }
  });
}

// Filter events
['filter-status','filter-material','filter-start','filter-end'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    renderReportTable();
    renderCharts();
  });
});

document.getElementById('clear-filter-btn').addEventListener('click', () => {
  ['filter-status','filter-material','filter-start','filter-end'].forEach(id => document.getElementById(id).value = '');
  renderReportTable();
  renderCharts();
});

// ── DELETE ───────────────────────────
function confirmDelete(id) {
  deleteTargetId = id;
  document.getElementById('modal').style.display = 'flex';
}

document.getElementById('modal-cancel').addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
  deleteTargetId = null;
});

document.getElementById('modal-confirm').addEventListener('click', () => {
  if (deleteTargetId) {
    deleteRecord(deleteTargetId);
    showToast('Rekod dipadam.', 'error');
    document.getElementById('modal').style.display = 'none';
    deleteTargetId = null;
    renderReport();
  }
});

// ── EXPORT CSV ───────────────────────
document.getElementById('export-btn').addEventListener('click', () => {
  const data = getFiltered();
  if (!data.length) { showToast('Tiada data untuk export.', 'error'); return; }

  const headers = ['Date','Route Card','PO','Drawing','Part Description','Qty PO','Material','Next Process','Inspector','Insp. Status','Part Status','Qty OK','Qty NG','Short','NCR','NC Status','Remark'];
  const keys = ['date','routecard','po','drawing','part','qtypo','material','nextprocess','inspector','status','partstatus','qtyok','qtyng','short','ncr','ncrstatus','remark'];

  const csv = [headers.join(','), ...data.map(r => keys.map(k => `"${(r[k] || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `MITQC_Export_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  showToast('Export berjaya!');
});

// ── CLEAR ALL ────────────────────────
document.getElementById('clear-all-btn').addEventListener('click', () => {
  if (confirm('Padam SEMUA rekod? Tindakan ini tidak boleh dibatalkan.')) {
    localStorage.removeItem(DB_KEY);
    showToast('Semua data dipadam.', 'error');
    renderHome();
  }
});

// ── INIT ─────────────────────────────
document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
renderHome();
