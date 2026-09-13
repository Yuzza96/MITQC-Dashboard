import { useEffect, useState } from 'react';
import { List, Inbox } from 'lucide-react';
import { listRecords } from '../api.js';
import Badge from '../components/Badge.jsx';

export default function Home({ showToast }) {
  const [records, setRecords] = useState(null);

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

  const loading = records === null;
  const data = records || [];

  const qtyOK = data.reduce((s, r) => s + (Number(r['Qty OK']) || 0), 0);
  const qtyNG = data.reduce((s, r) => s + (Number(r['Qty NG']) || 0), 0);
  const ncr   = data.filter(r => r['NCR'] && r['NCR'].trim() && r['NCR'].toUpperCase() !== 'N/A').length;
  const recent = data.slice(0, 10);

  return (
    <div className="panel">
      <div className="page-header">
        <h1>Overview</h1>
        <p>Overall summary of QC records</p>
      </div>

      <div className="stats-grid">
        {loading ? (
          <>
            <StatCard label="Loading..." value="—" />
            <StatCard label="Loading..." value="—" />
            <StatCard label="Loading..." value="—" />
            <StatCard label="Loading..." value="—" />
          </>
        ) : (
          <>
            <StatCard label="Total Records" value={data.length} sub="All entries" />
            <StatCard label="Quantity OK" value={qtyOK} sub="Passed units" className="stat-ok" />
            <StatCard label="Quantity NG" value={qtyNG} sub="Failed units" className="stat-ng" />
            <StatCard label="Active NCR" value={ncr} sub="Needs action" className="stat-ncr" />
          </>
        )}
      </div>

      <div className="glass-card">
        <h2 className="card-title"><List /> Recent Records</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Route Card</th><th>Part Description</th>
                <th>Material</th><th>Status</th><th>Qty OK</th><th>Qty NG</th>
              </tr>
            </thead>
            <tbody>
              {!loading && recent.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="empty-state"><Inbox />No records yet. Add a new record!</div>
                </td></tr>
              )}
              {recent.map((r, i) => (
                <tr key={i}>
                  <td>{r['Inspection Date'] || '—'}</td>
                  <td>{r['Route Card'] || '—'}</td>
                  <td>{r['Part Description'] || '—'}</td>
                  <td>{r['Material'] || '—'}</td>
                  <td><Badge status={r['Inspection Status']} /></td>
                  <td>{r['Qty OK'] || 0}</td>
                  <td>{r['Qty NG'] || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, className = '' }) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="s-label">{label}</div>
      <div className="s-value">{value}</div>
      {sub && <div className="s-sub">{sub}</div>}
    </div>
  );
}
