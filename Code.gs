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

// Only these columns are returned/shown for a matched route card -
// the import tab has dozens of per-operation (OP 10..OP 150) tracking
// columns that aren't relevant to this lookup.
const IMPORT_DISPLAY_COLUMNS = [
  'PO#', 'RFM / IHM / RGAF', 'PURPOSE / PROJECT', 'DRAWING NUMBER',
  'PART DESCRIPTION', 'QTY\nPO', 'MATERIAL', 'COATING', 'COATING2',
  'WO#', 'REV', 'QTY',
];

function doGet(e) {
  const action = (e.parameter.action || 'list');

  let result;
  try {
    if (action === 'save') result = saveRecord(e.parameter);
    else if (action === 'findRouteCard') result = findRouteCard(e.parameter.wo, e.parameter.index);
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

// A blank REV cell doesn't mean "no revision" - the import tab has
// real rows with an empty REV alongside rows with a lettered one for
// the same WO#, and they're genuinely different rows (different QTY,
// different OP tracking columns filled in). Keep a real REV value
// when the cell has one; fill blank ones with the next letter in
// A, B, C, ... by row position, so every row still gets a distinct,
// stable label instead of disappearing.
const REV_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function revLabel(rawRev, position) {
  const rev = (rawRev || '').toString().trim();
  if (rev) return rev;
  return REV_LETTERS[position] || String(position + 1);
}

// Looks up rows in the IMPORTRANGE-fed tab by WO# (used as the Route
// Card No.). Read-only — never writes to this tab, since its content
// is owned by a live IMPORTRANGE formula (see Code.gs header comment).
//
// A route card can have several revisions (rows sharing the same
// WO#). When more than one row matches and no `index` was given,
// this returns a labeled list instead of a row, so the caller can
// ask the user to pick one and call again with that `index` - matched
// by row position within this same filtered list, not by REV text,
// since REV alone doesn't uniquely identify a row (see revLabel above).
// Rebuilding the WO# index means reading one 3000+-row column, which
// dominates request time even after trimming the old full-sheet scan.
// Cache it for a few minutes so repeated searches skip that read
// entirely - the import tab doesn't change often enough for a short
// staleness window to matter here.
const IMPORT_INDEX_CACHE_KEY = 'importWoIndex_v1';
const IMPORT_INDEX_CACHE_TTL_SECONDS = 300;

function getImportIndex() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(IMPORT_INDEX_CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const sheet = getImportSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const woCol = headers.indexOf(IMPORT_WO_COLUMN) + 1; // 1-based
  if (woCol === 0) throw new Error('Column "' + IMPORT_WO_COLUMN + '" not found');
  const woValues = sheet.getRange(2, woCol, lastRow - 1, 1).getValues().map(r => (r[0] || '').toString());

  const index = { headers, lastCol, woValues };
  cache.put(IMPORT_INDEX_CACHE_KEY, JSON.stringify(index), IMPORT_INDEX_CACHE_TTL_SECONDS);
  return index;
}

function findRouteCard(wo, index) {
  wo = (wo || '').toString().trim();
  if (!wo) return { status: 'error', message: 'Route Card No. is required' };

  const { headers, lastCol, woValues } = getImportIndex();
  const revCol = headers.indexOf('REV') + 1;

  const wanted = wo.toLowerCase();
  const matchedRows = [];
  for (let i = 0; i < woValues.length; i++) {
    if (woValues[i].trim().toLowerCase() === wanted) {
      matchedRows.push(i + 2); // 1-based sheet row number
    }
  }
  if (matchedRows.length === 0) return { status: 'ok', found: false };

  const sheet = getImportSheet();

  if (matchedRows.length > 1 && (index === undefined || index === null || index === '')) {
    // Only need REV for the few matched rows - one bounded range read,
    // not a full-sheet scan.
    let revValues = [];
    if (revCol > 0) {
      const minRow = Math.min(...matchedRows);
      const maxRow = Math.max(...matchedRows);
      const revBlock = sheet.getRange(minRow, revCol, maxRow - minRow + 1, 1).getValues();
      revValues = matchedRows.map(r => revBlock[r - minRow][0]);
    }
    const revisions = matchedRows.map((_, i) => ({
      index: i,
      label: revLabel(revValues[i], i),
    }));
    return { status: 'ok', found: true, multiple: true, revisions };
  }

  const rowNumber = matchedRows.length > 1 ? matchedRows[Number(index)] : matchedRows[0];
  if (!rowNumber) return { status: 'ok', found: false };

  const rowValues = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
  const data = {};
  headers.forEach((h, i) => { if (IMPORT_DISPLAY_COLUMNS.includes(h)) data[h] = rowValues[i]; });
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
