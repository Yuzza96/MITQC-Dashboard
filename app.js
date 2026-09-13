const elements = {
  sheetName: document.getElementById('sheet-name'),
  sheetUrl: document.getElementById('sheet-url'),
  loadButton: document.getElementById('load-data'),
  recordCount: document.getElementById('record-count'),
  summaryCards: document.getElementById('summary-cards'),
  filterModel: document.getElementById('filter-model'),
  filterInspectionStatus: document.getElementById('filter-inspection-status'),
  filterPartStatus: document.getElementById('filter-part-status'),
  filterNextProcess: document.getElementById('filter-next-process'),
  filterStartDate: document.getElementById('filter-start-date'),
  filterEndDate: document.getElementById('filter-end-date'),
  clearFilters: document.getElementById('clear-filters'),
  tableHead: document.querySelector('#records-table thead'),
  tableBody: document.querySelector('#records-table tbody'),
  statusChart: document.getElementById('status-chart'),
  modelChart: document.getElementById('model-chart'),
};

let rawData = [];
let currentData = [];
let charts = { status: null, model: null };

// Map actual Google Sheet column headers → normalized field names
const NORMALIZE_MAP = {
  'Inspection Date': 'InspectionDate',
  'Route Card': 'RouteCard',
  'PO#': 'PONo',
  'DRAWING NUM': 'DrawingNum',
  'PART DESCRIPTION': 'PartDescription',
  'QTY PO': 'QtyPO',
  'MATERIAL': 'Material',
  'Inspection Status': 'InspectionStatus',
  'Quantity OK': 'QuantityOK',
  'Quantity Not Good': 'QuantityNG',
  'Short': 'Short',
  'NCR': 'NCR',
  'NC Status': 'NCRStatus',
  'Part Status': 'PartStatus',
  'Next Process': 'NextProcess',
  'Remark': 'Remark',
  'IGT No.': 'IGTNo',
  'Inspected By': 'InspectedBy',
  'Inspected By.': 'InspectedBy',
};

// Columns to show in the table
const tableHeaders = [
  { key: 'InspectionDate', label: 'Inspection Date' },
  { key: 'RouteCard',      label: 'Route Card' },
  { key: 'PONo',           label: 'PO#' },
  { key: 'DrawingNum',     label: 'Drawing No.' },
  { key: 'PartDescription',label: 'Part Description' },
  { key: 'QtyPO',          label: 'Qty PO' },
  { key: 'Material',       label: 'Material' },
  { key: 'InspectionStatus',label: 'Insp. Status' },
  { key: 'QuantityOK',     label: 'Qty OK' },
  { key: 'QuantityNG',     label: 'Qty NG' },
  { key: 'Short',          label: 'Short' },
  { key: 'NCR',            label: 'NCR' },
  { key: 'NCRStatus',      label: 'NC Status' },
];

function parseCsv(text) {
  const rows = [];
  let current = '';
  let insideQuotes = false;
  let row = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') { current += '"'; i++; }
      else { insideQuotes = !insideQuotes; }
      continue;
    }
    if (char === ',' && !insideQuotes) { row.push(current); current = ''; continue; }
    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(current);
      rows.push(row);
      row = []; current = '';
      continue;
    }
    current += char;
  }
  if (current || row.length) { row.push(current); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0]));
}

function normalizeHeader(raw) {
  const clean = raw.trim();
  if (NORMALIZE_MAP[clean]) return NORMALIZE_MAP[clean];
  return clean.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
}

function parseDate(value) {
  if (!value && value !== 0) return '';
  if (!isNaN(Number(value)) && value !== '') {
    const raw = Number(value);
    if (raw > 1000 && raw < 60000) {
      const epoch = (raw - 25569) * 86400 * 1000;
      const date = new Date(epoch);
      if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    }
  }
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return String(value);
}

function buildRecords(rows) {
  if (!rows.length) return [];
  const headerRow = rows[0].map(cell => normalizeHeader(String(cell || '')));
  return rows.slice(1).map(rawRow => {
    const record = {};
    headerRow.forEach((field, idx) => {
      record[field] = rawRow[idx] !== undefined ? rawRow[idx] : '';
    });
    record.InspectionDate = parseDate(record.InspectionDate);
    record.QuantityOK = Number(record.QuantityOK) || 0;
    record.QuantityNG = Number(record.QuantityNG) || 0;
    record.QtyPO = Number(record.QtyPO) || 0;
    record.InspectionStatus = String(record.InspectionStatus || '').trim();
    record.PartStatus = String(record.PartStatus || '').trim();
    record.NextProcess = String(record.NextProcess || '').trim();
    record.Material = String(record.Material || '').trim();
    return record;
  }).filter(r => r.RouteCard || r.PartDescription || r.PONo);
}

async function loadData() {
  const config = window.SHEET_CONFIG || {};
  if (!config.sheetId || config.sheetId === 'YOUR_GOOGLE_SHEET_ID') {
    alert('Sila update config.js dengan Google Sheet ID korang.');
    return;
  }

  const url = config.getSheetUrl();
  elements.sheetName.textContent = config.sheetLabel;
  elements.sheetUrl.textContent = url;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const text = await response.text();
    const rows = parseCsv(text);
    rawData = buildRecords(rows);
    currentData = [...rawData];
    refreshUI();
  } catch (error) {
    console.error(error);
    alert('Tak dapat load Google Sheet. Pastikan sheet dah published to web.');
  }
}

function refreshUI() {
  renderSummary(currentData);
  renderFilters(rawData);
  renderTable(currentData);
  renderCharts(currentData);
}

function renderSummary(data) {
  const total = data.length;
  const qtyOK = data.reduce((s, r) => s + (r.QuantityOK || 0), 0);
  const qtyNG = data.reduce((s, r) => s + (r.QuantityNG || 0), 0);
  const ncr = data.filter(r => String(r.NCR || '').trim() !== '' && String(r.NCR || '').toUpperCase() !== 'N/A').length;

  elements.recordCount.textContent = total;
  elements.summaryCards.innerHTML = '';

  [
    { label: 'Total Records', value: total },
    { label: 'Quantity OK', value: qtyOK },
    { label: 'Quantity NG', value: qtyNG },
    { label: 'NCR Records', value: ncr },
  ].forEach(card => {
    const node = document.createElement('div');
    node.className = 'card';
    node.innerHTML = `<h3>${card.label}</h3><strong>${card.value}</strong>`;
    elements.summaryCards.appendChild(node);
  });
}

function renderFilters(data) {
  const unique = key => [...new Set(data.map(r => r[key]).filter(Boolean))].sort();
  populateSelect(elements.filterModel, unique('Material'));
  populateSelect(elements.filterInspectionStatus, unique('InspectionStatus'));
  populateSelect(elements.filterPartStatus, unique('PartStatus'));
  populateSelect(elements.filterNextProcess, unique('NextProcess'));
}

function populateSelect(select, options) {
  const val = select.value;
  select.innerHTML = '<option value="">All</option>' + options.map(v => `<option value="${v}">${v}</option>`).join('');
  if (val) select.value = val;
}

function renderTable(data) {
  elements.tableHead.innerHTML = `<tr>${tableHeaders.map(h => `<th>${h.label}</th>`).join('')}</tr>`;
  elements.tableBody.innerHTML = data.map(r =>
    `<tr>${tableHeaders.map(h => `<td>${r[h.key] !== undefined ? r[h.key] : ''}</td>`).join('')}</tr>`
  ).join('');
}

function renderCharts(data) {
  const statusCounts = data.reduce((acc, r) => {
    const key = r.InspectionStatus || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const materialCounts = data.reduce((acc, r) => {
    const key = r.Material || 'Unknown';
    acc[key] = (acc[key] || 0) + (r.QtyPO || 1);
    return acc;
  }, {});

  const statusLabels = Object.keys(statusCounts);
  const topMaterials = Object.entries(materialCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  if (charts.status) charts.status.destroy();
  charts.status = new Chart(elements.statusChart, {
    type: 'doughnut',
    data: {
      labels: statusLabels,
      datasets: [{ data: statusLabels.map(k => statusCounts[k]), backgroundColor: ['#2f855a','#dd6b20','#3182ce','#d53f8c','#718096'] }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });

  if (charts.model) charts.model.destroy();
  charts.model = new Chart(elements.modelChart, {
    type: 'bar',
    data: {
      labels: topMaterials.map(m => m[0]),
      datasets: [{ label: 'Qty PO', data: topMaterials.map(m => m[1]), backgroundColor: '#3182ce' }]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { maxRotation: 45 } }, y: { beginAtZero: true } } }
  });
}

function applyFilters() {
  const material = elements.filterModel.value;
  const inspStatus = elements.filterInspectionStatus.value;
  const partStatus = elements.filterPartStatus.value;
  const nextProcess = elements.filterNextProcess.value;
  const startDate = elements.filterStartDate.value;
  const endDate = elements.filterEndDate.value;

  currentData = rawData.filter(r => {
    if (material && r.Material !== material) return false;
    if (inspStatus && r.InspectionStatus !== inspStatus) return false;
    if (partStatus && r.PartStatus !== partStatus) return false;
    if (nextProcess && r.NextProcess !== nextProcess) return false;
    if (startDate && r.InspectionDate && r.InspectionDate < startDate) return false;
    if (endDate && r.InspectionDate && r.InspectionDate > endDate) return false;
    return true;
  });
  refreshUI();
}

function clearFilters() {
  elements.filterModel.value = '';
  elements.filterInspectionStatus.value = '';
  elements.filterPartStatus.value = '';
  elements.filterNextProcess.value = '';
  elements.filterStartDate.value = '';
  elements.filterEndDate.value = '';
  currentData = [...rawData];
  refreshUI();
}

function attachEvents() {
  elements.loadButton.addEventListener('click', loadData);
  elements.filterModel.addEventListener('change', applyFilters);
  elements.filterInspectionStatus.addEventListener('change', applyFilters);
  elements.filterPartStatus.addEventListener('change', applyFilters);
  elements.filterNextProcess.addEventListener('change', applyFilters);
  elements.filterStartDate.addEventListener('change', applyFilters);
  elements.filterEndDate.addEventListener('change', applyFilters);
  elements.clearFilters.addEventListener('click', clearFilters);
}

attachEvents();
