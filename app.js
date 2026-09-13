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
let charts = {
  status: null,
  model: null,
};

const HEADERS = [
  'Index',
  'Date IN',
  'Sender by',
  'Route Card',
  'Part Name',
  'Part ID',
  'PO No',
  'RFM No',
  'Model',
  'Quantity',
  'Next Process',
  'Status',
  'Part Status',
  'Inspection Date',
  'Inspected By.',
  'Inspection Status',
  'Quantity OK',
  'Quantity NG',
  'Short',
  'NCR',
  'NCR Status',
  'Rejected',
  'Status (Final)',
  'IGT No.',
  'Remark',
];

const NORMALIZE_MAP = {
  '': 'Index',
  '  ': 'Index',
  'Date IN': 'DateIN',
  'Sender by': 'SenderBy',
  'Route Card': 'RouteCard',
  'Part Name': 'PartName',
  'Part ID': 'PartID',
  'PO No': 'PONo',
  'RFM No': 'RFMNo',
  'Model': 'Model',
  'Quantity': 'Quantity',
  'Next Process': 'NextProcess',
  'Status': 'Status',
  'Part Status': 'PartStatus',
  'Inspection Date': 'InspectionDate',
  'Inspected By.': 'InspectedBy',
  'Inspection Status': 'InspectionStatus',
  'Quantity OK': 'QuantityOK',
  'Quantity NG': 'QuantityNG',
  'Short': 'Short',
  'NCR': 'NCR',
  'NCR Status': 'NCRStatus',
  'Rejected': 'Rejected',
  'Status (Final)': 'FinalStatus',
  'IGT No.': 'IGTNo',
  'Remark': 'Remark',
};

const displayHeaders = [
  'Date IN',
  'Route Card',
  'Part Name',
  'Part ID',
  'Model',
  'Quantity',
  'Next Process',
  'Status',
  'Inspection Date',
  'InspectionStatus',
  'Quantity OK',
  'Quantity NG',
  'NCR',
  'NCR Status',
  'Remark',
];

function parseCsv(text) {
  const rows = [];
  let current = '';
  let insideQuotes = false;
  let row = [];

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }

  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0]));
}

function normalizeHeader(raw, index) {
  const clean = raw.trim();
  if (clean in NORMALIZE_MAP) {
    return NORMALIZE_MAP[clean];
  }
  if (clean === 'Status' && index === 22) {
    return 'FinalStatus';
  }
  return clean.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
}

function parseDate(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (!Number.isNaN(Number(value)) && value !== '') {
    const raw = Number(value);
    if (raw > 1000 && raw < 60000) {
      const epoch = (raw - 25569) * 86400 * 1000;
      const date = new Date(epoch);
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    }
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return String(value);
}

function buildRecords(rows) {
  if (!rows.length) return [];
  const headerRow = rows[0].map((cell, index) => normalizeHeader(String(cell || ''), index));
  return rows.slice(1).map(rawRow => {
    const record = {};
    headerRow.forEach((field, idx) => {
      record[field] = rawRow[idx] !== undefined ? rawRow[idx] : '';
    });
    record.DateIN = parseDate(record.DateIN);
    record.InspectionDate = parseDate(record.InspectionDate);
    record.Quantity = Number(record.Quantity) || 0;
    record.QuantityOK = Number(record.QuantityOK) || 0;
    record.QuantityNG = Number(record.QuantityNG) || 0;
    record.Model = String(record.Model || 'Unknown').trim();
    record.InspectionStatus = String(record.InspectionStatus || '').trim();
    record.PartStatus = String(record.PartStatus || '').trim();
    record.NextProcess = String(record.NextProcess || '').trim();
    record.Status = String(record.Status || '').trim();
    return record;
  }).filter(record => record.PartName || record.PartID || record.Model);
}

function getSheetUrl() {
  const config = window.SHEET_CONFIG || {};
  return config.useCsvExport ? config.getSheetUrl() : '';
}

async function loadData() {
  const config = window.SHEET_CONFIG || {};
  const url = getSheetUrl();

  if (!config.sheetId || config.sheetId === 'YOUR_GOOGLE_SHEET_ID') {
    alert('Please update dashboard/config.js with your Google Sheet ID.');
    return;
  }

  elements.sheetName.textContent = config.sheetLabel || config.sheetName;
  elements.sheetUrl.textContent = url;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    const rows = parseCsv(text);
    rawData = buildRecords(rows);
    currentData = [...rawData];
    refreshUI();
  } catch (error) {
    console.error(error);
    alert('Unable to load the Google Sheet. Make sure the sheet is published to the web and the ID is correct.');
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
  const ok = data.reduce((sum, record) => sum + (record.QuantityOK || 0), 0);
  const ng = data.reduce((sum, record) => sum + (record.QuantityNG || 0), 0);
  const ncr = data.filter(record => String(record.NCR || '').trim() !== '' && String(record.NCR || '').trim().toUpperCase() !== 'N/A').length;
  const rejected = data.filter(record => String(record.Rejected || '').trim() !== '').length;

  elements.recordCount.textContent = total;
  elements.summaryCards.innerHTML = '';

  const cards = [
    { label: 'Total Records', value: total },
    { label: 'Quantity OK', value: ok },
    { label: 'Quantity NG', value: ng },
    { label: 'NCR Records', value: ncr },
  ];

  cards.forEach(card => {
    const node = document.createElement('div');
    node.className = 'card';
    node.innerHTML = `<h3>${card.label}</h3><strong>${card.value}</strong>`;
    elements.summaryCards.appendChild(node);
  });
}

function renderFilters(data) {
  const models = Array.from(new Set(data.map(r => r.Model).filter(Boolean))).sort();
  const inspectionStatuses = Array.from(new Set(data.map(r => r.InspectionStatus).filter(Boolean))).sort();
  const partStatuses = Array.from(new Set(data.map(r => r.PartStatus).filter(Boolean))).sort();
  const nextProcesses = Array.from(new Set(data.map(r => r.NextProcess).filter(Boolean))).sort();

  populateSelect(elements.filterModel, models);
  populateSelect(elements.filterInspectionStatus, inspectionStatuses);
  populateSelect(elements.filterPartStatus, partStatuses);
  populateSelect(elements.filterNextProcess, nextProcesses);
}

function populateSelect(select, options) {
  const selectedValue = select.value;
  select.innerHTML = '<option value="">All</option>' + options.map(value => `<option value="${value}">${value}</option>`).join('');
  if (selectedValue) {
    select.value = selectedValue;
  }
}

function renderTable(data) {
  const headers = ['DateIN', 'RouteCard', 'PartName', 'PartID', 'Model', 'Quantity', 'InspectionDate', 'InspectionStatus', 'QuantityOK', 'QuantityNG', 'NCR', 'NCRStatus', 'Remark'];
  elements.tableHead.innerHTML = `<tr>${headers.map(h => `<th>${h.replace(/([A-Z])/g, ' $1').trim()}</th>`).join('')}</tr>`;
  elements.tableBody.innerHTML = data.map(record => `<tr>${headers.map(key => `<td>${record[key] !== undefined ? record[key] : ''}</td>`).join('')}</tr>`).join('');
}

function renderCharts(data) {
  const statusCounts = data.reduce((acc, record) => {
    const key = record.InspectionStatus || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const modelCounts = data.reduce((acc, record) => {
    const key = record.Model || 'Unknown';
    acc[key] = (acc[key] || 0) + (record.Quantity || 1);
    return acc;
  }, {});

  const statusLabels = Object.keys(statusCounts);
  const statusValues = statusLabels.map(key => statusCounts[key]);
  const topModels = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const modelLabels = topModels.map(item => item[0]);
  const modelValues = topModels.map(item => item[1]);

  if (charts.status) charts.status.destroy();
  charts.status = new Chart(elements.statusChart, {
    type: 'doughnut',
    data: {
      labels: statusLabels,
      datasets: [{ data: statusValues, backgroundColor: ['#2f855a', '#dd6b20', '#3182ce', '#d53f8c', '#718096'] }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
  });

  if (charts.model) charts.model.destroy();
  charts.model = new Chart(elements.modelChart, {
    type: 'bar',
    data: {
      labels: modelLabels,
      datasets: [{ label: 'Quantity', data: modelValues, backgroundColor: '#3182ce' }],
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { maxRotation: 45, minRotation: 0 } }, y: { beginAtZero: true } } },
  });
}

function applyFilters() {
  const model = elements.filterModel.value;
  const inspectionStatus = elements.filterInspectionStatus.value;
  const partStatus = elements.filterPartStatus.value;
  const nextProcess = elements.filterNextProcess.value;
  const startDate = elements.filterStartDate.value;
  const endDate = elements.filterEndDate.value;

  currentData = rawData.filter(record => {
    if (model && record.Model !== model) return false;
    if (inspectionStatus && record.InspectionStatus !== inspectionStatus) return false;
    if (partStatus && record.PartStatus !== partStatus) return false;
    if (nextProcess && record.NextProcess !== nextProcess) return false;
    if (startDate && record.InspectionDate && record.InspectionDate < startDate) return false;
    if (endDate && record.InspectionDate && record.InspectionDate > endDate) return false;
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
