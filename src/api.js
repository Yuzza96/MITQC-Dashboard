// ═══════════════════════════════════════
//  MITQC Dashboard — API client
//  Backend: Google Sheets via Apps Script
// ═══════════════════════════════════════

const API_URL = 'https://script.google.com/macros/s/AKfycbwC1zCFq_hUiEDpLnPJP4dCOdi3lmGFvMo4o2LQLJAKDes5nBVNfj9Chia2pW34Xt2H/exec';

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
