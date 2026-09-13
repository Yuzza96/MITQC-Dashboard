import { useEffect, useMemo, useState } from 'react';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Filter, FileText, Download, Inbox } from 'lucide-react';
import { listRecords } from '../api.js';
import Badge from '../components/Badge.jsx';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const STATUS_COLORS = { 'Pass': '#4ade80', 'Fail': '#f87171', 'Conditional Pass': '#60a5fa', 'Pending': '#fbbf24', 'Unknown': '#94a3b8' };

const EXPORT_KEYS = ['Inspection Date','Route Card','PO#','Drawing No.','Part Description','Qty PO','Material','Next Process','Inspected By','Inspection Status','Part Status','Qty OK','Qty NG','Short','NCR','NC Status','Remark'];

export default function Reports({ showToast }) {
  const [records, setRecords] = useState(null);
  const [status, setStatus] = useState('');
  const [material, setMaterial] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    let cancelled = false;
    listRecords()
      .then(data => { if (!cancelled) setRecords(data); })
      .catch(err => {
        if (!cancelled) {
          showToast('Failed to load data.', 'error');
          console.error(err);
          setRecords([]);
        }
      });
    return () => { cancelled = true; };
  }, [showToast]);

  const data = records || [];

  const statusOptions = useMemo(
    () => [...new Set(data.map(r => r['Inspection Status']).filter(Boolean))].sort(),
    [data]
  );
  const materialOptions = useMemo(
    () => [...new Set(data.map(r => r['Material']).filter(Boolean))].sort(),
    [data]
  );

  const filtered = useMemo(() => data.filter(r => {
    if (status   && r['Inspection Status'] !== status)   return false;
    if (material && r['Material'] !== material)          return false;
    if (start    && r['Inspection Date'] < start)        return false;
    if (end      && r['Inspection Date'] > end)          return false;
    return true;
  }), [data, status, material, start, end]);

  const statusCount = useMemo(() => filtered.reduce((a, r) => {
    const k = r['Inspection Status'] || 'Unknown';
    a[k] = (a[k] || 0) + 1; return a;
  }, {}), [filtered]);

  const matCount = useMemo(() => filtered.reduce((a, r) => {
    const k = r['Material'] || 'Unknown';
    a[k] = (a[k] || 0) + 1; return a;
  }, {}), [filtered]);

  const topMaterials = useMemo(
    () => Object.entries(matCount).sort((a, b) => b[1] - a[1]).slice(0, 8),
    [matCount]
  );

  function clearFilters() {
    setStatus(''); setMaterial(''); setStart(''); setEnd('');
  }

  function exportCsv() {
    if (!filtered.length) { showToast('No data to export.', 'error'); return; }
    const csv = [
      EXPORT_KEYS.join(','),
      ...filtered.map(r => EXPORT_KEYS.map(k => `"${(r[k] || '').toString().replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `MITQC_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('Export successful!');
  }

  return (
    <div className="panel">
      <div className="page-header">
        <h1>Reports</h1>
        <p>Inspection analysis and records</p>
      </div>

      <div className="charts-row">
        <div className="glass-card chart-card">
          <h2 className="card-title">Inspection Status</h2>
          <Doughnut
            data={{
              labels: Object.keys(statusCount),
              datasets: [{ data: Object.values(statusCount), backgroundColor: Object.keys(statusCount).map(k => STATUS_COLORS[k] || '#94a3b8'), borderWidth: 0 }],
            }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#1d1d1f', font: { size: 12 } } } } }}
          />
        </div>
        <div className="glass-card chart-card">
          <h2 className="card-title">Top Material</h2>
          <Bar
            data={{
              labels: topMaterials.map(m => m[0]),
              datasets: [{ label: 'Records', data: topMaterials.map(m => m[1]), backgroundColor: '#4f8ef7', borderRadius: 6 }],
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: '#6e6e73', maxRotation: 35 }, grid: { display: false } },
                y: { ticks: { color: '#6e6e73' }, grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true },
              },
            }}
          />
        </div>
      </div>

      <div className="glass-card">
        <h2 className="card-title"><Filter /> Filter</h2>
        <div className="filter-row">
          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All</option>
              {statusOptions.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Material</label>
            <select value={material} onChange={e => setMaterial(e.target.value)}>
              <option value="">All</option>
              {materialOptions.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>From Date</label>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div className="form-group">
            <label>To Date</label>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} />
          </div>
          <div className="form-group" style={{ justifyContent: 'flex-end', alignSelf: 'flex-end' }}>
            <button className="btn-ghost" onClick={clearFilters}>Clear</button>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="table-header-row">
          <h2 className="card-title" style={{ margin: 0 }}><FileText /> All Records</h2>
          <button className="btn-ghost small" onClick={exportCsv}><Download /> Export CSV</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Route Card</th><th>PO#</th>
                <th>Part Description</th><th>Material</th>
                <th>Insp. Status</th><th>Qty OK</th><th>Qty NG</th>
                <th>NCR</th><th>NC Status</th><th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={11}>
                  <div className="empty-state"><Inbox />No records found.</div>
                </td></tr>
              )}
              {filtered.map((r, i) => (
                <tr key={i}>
                  <td>{r['Inspection Date'] || '—'}</td>
                  <td>{r['Route Card'] || '—'}</td>
                  <td>{r['PO#'] || '—'}</td>
                  <td>{r['Part Description'] || '—'}</td>
                  <td>{r['Material'] || '—'}</td>
                  <td><Badge status={r['Inspection Status']} /></td>
                  <td>{r['Qty OK'] || 0}</td>
                  <td>{r['Qty NG'] || 0}</td>
                  <td>{r['NCR'] || '—'}</td>
                  <td>{r['NC Status'] || '—'}</td>
                  <td>{r['Remark'] || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
