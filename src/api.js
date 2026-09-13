// ═══════════════════════════════════════
//  MITQC Dashboard — API client
//  Backend: Google Sheets via Apps Script
// ═══════════════════════════════════════

const API_URL = 'https://script.google.com/macros/s/AKfycbwC1zCFq_hUiEDpLnPJP4dCOdi3lmGFvMo4o2LQLJAKDes5nBVNfj9Chia2pW34Xt2H/exec';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Apps Script web apps occasionally return a transient HTML error page
// (a "Sorry, unable to open the file" Drive page, not our JSON) instead
// of the real response - a known quirk under back-to-back requests,
// not something our code can prevent server-side. Retry once after a
// short delay before giving up, since a second attempt almost always
// succeeds.
async function callApi(params) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${API_URL}?${new URLSearchParams(params)}`);
      const text = await res.text();
      const data = JSON.parse(text);
      if (!data || data.status !== 'ok') throw new Error(data?.message || 'Unknown error');
      return data;
    } catch (err) {
      if (attempt === 0 && err instanceof SyntaxError) {
        await sleep(800);
        continue;
      }
      throw err;
    }
  }
}

export async function listRecords() {
  const data = await callApi({ action: 'list' });
  return data.data || [];
}

export async function saveRecord(record) {
  return callApi({ action: 'save', ...record });
}

export async function findRouteCard(wo, index) {
  const params = { action: 'findRouteCard', wo };
  if (index !== undefined && index !== null) params.index = index;
  return callApi(params); // { found: boolean, multiple?: boolean, revisions?: {index,label}[], data?: {...} }
}

export async function registerRouteCard(wo, index) {
  const params = { action: 'registerRouteCard', wo };
  if (index !== undefined && index !== null) params.index = index;
  return callApi(params);
}

export async function listPendingInspections() {
  const data = await callApi({ action: 'listPending' });
  return data.data || [];
}
