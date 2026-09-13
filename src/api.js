// ═══════════════════════════════════════
//  MITQC Dashboard — API client
//  Backend: Google Sheets via Apps Script
// ═══════════════════════════════════════

const API_URL = 'https://script.google.com/macros/s/AKfycbweY8tsHnlXUNloDu3-JFmanSX0uoBdK8lrdBCgTJeacDaUI0RUXe973xnYg3FgdSEOuw/exec';

export async function listRecords() {
  const res = await fetch(`${API_URL}?${new URLSearchParams({ action: 'list' })}`);
  const data = await res.json();
  if (!data || data.status !== 'ok') throw new Error(data?.message || 'Unknown error');
  return data.data || [];
}

export async function saveRecord(record) {
  const res = await fetch(`${API_URL}?${new URLSearchParams({ action: 'save', ...record })}`);
  const data = await res.json();
  if (!data || data.status !== 'ok') throw new Error(data?.message || 'Unknown error');
  return data;
}
