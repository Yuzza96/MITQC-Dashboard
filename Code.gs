// ═══════════════════════════════════════
//  MITQC Dashboard — Apps Script backend
//  Paste this into the Apps Script project
//  bound to the "route card import range" sheet,
//  then redeploy the web app (New deployment
//  or "Manage deployments" → edit → new version).
//
//  Plain JSON over GET — no JSONP. Apps Script
//  web app responses already carry permissive
//  CORS headers for simple GET requests, so a
//  normal fetch() from the browser can read the
//  response body directly.
// ═══════════════════════════════════════

const SHEET_NAME = 'route card import range';

function doGet(e) {
  const action = (e.parameter.action || 'list');

  let result;
  try {
    result = (action === 'save') ? saveRecord(e.parameter) : listRecords();
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
