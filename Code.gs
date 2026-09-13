// ═══════════════════════════════════════
//  MITQC Dashboard — Apps Script backend
//  Paste this into the Apps Script project
//  bound to the "Inspection record" sheet,
//  then redeploy the web app (New deployment
//  or "Manage deployments" → edit → new version).
//
//  Kept separate from the "route card import range" tab
//  on purpose — that tab has a live IMPORTRANGE formula,
//  and appendRow() here would clash with its spill range.
//
//  Plain JSON over GET — no JSONP. Apps Script
//  web app responses already carry permissive
//  CORS headers for simple GET requests, so a
//  normal fetch() from the browser can read the
//  response body directly.
// ═══════════════════════════════════════

const SHEET_NAME = 'Inspection record';
const IMPORT_SHEET_NAME = 'route card import range';
const IMPORT_WO_COLUMN = 'WO#';

function doGet(e) {
  const action = (e.parameter.action || 'list');

  let result;
  try {
    if (action === 'save') result = saveRecord(e.parameter);
    else if (action === 'findRouteCard') result = findRouteCard(e.parameter.wo);
    else result = listRecords();
  } catch (err) {
    result = { status: 'error', message: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + SHEET_NAME + '" not found');
  return sheet;
}

function getImportSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(IMPORT_SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + IMPORT_SHEET_NAME + '" not found');
  return sheet;
}

// Looks up a row in the IMPORTRANGE-fed tab by its WO# (used as the
// Route Card No.). Read-only — never writes to this tab, since its
// content is owned by a live IMPORTRANGE formula (see Code.gs header
// comment).
function findRouteCard(wo) {
  wo = (wo || '').toString().trim();
  if (!wo) return { status: 'error', message: 'Route Card No. diperlukan' };

  const sheet = getImportSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  const woIndex = headers.indexOf(IMPORT_WO_COLUMN);
  if (woIndex === -1) return { status: 'error', message: 'Column "' + IMPORT_WO_COLUMN + '" tidak dijumpai' };

  const row = values.find(r => r[woIndex].toString().trim().toLowerCase() === wo.toLowerCase());
  if (!row) return { status: 'ok', found: false };

  const data = {};
  headers.forEach((h, i) => { if (h) data[h] = row[i]; });
  return { status: 'ok', found: true, data };
}

function listRecords() {
  const sheet  = getSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  const data = values
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
  return { status: 'ok', data };
}

// Maps the lowercase field names sent by app.js's form to the
// Sheet's actual column headers. Keep in sync with the `record`
// object built in app.js's submit handler.
function saveRecord(params) {
  const sheet   = getSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const fieldMap = {
    'Inspection Date':   params.date        || '',
    'Route Card':        params.routecard   || '',
    'PO#':               params.po          || '',
    'Drawing No.':       params.drawing     || '',
    'Part Description':  params.part        || '',
    'Qty PO':            params.qtypo       || '',
    'Material':          params.material    || '',
    'Next Process':      params.nextprocess || '',
    'Inspected By':      params.inspector   || '',
    'Inspection Status': params.status      || '',
    'Part Status':       params.partstatus  || '',
    'Qty OK':            params.qtyok       || '',
    'Qty NG':            params.qtyng       || '',
    'Short':             params.short       || '',
    'NCR':               params.ncr         || '',
    'NC Status':         params.ncrstatus   || '',
    'Remark':            params.remark      || ''
  };

  const row = headers.map(h => fieldMap.hasOwnProperty(h) ? fieldMap[h] : '');
  sheet.appendRow(row);
  return { status: 'ok' };
}
