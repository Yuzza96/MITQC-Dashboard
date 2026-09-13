window.SHEET_CONFIG = {
  sheetId: '16ancoOykw7JhYoBB-wh5QCmx-UG7xdQl1JMZPsmGTyI',
  sheetName: 'Database',
  sheetLabel: 'Database',
  useCsvExport: true,
  getSheetUrl() {
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(this.sheetName)}`;
  }
};
