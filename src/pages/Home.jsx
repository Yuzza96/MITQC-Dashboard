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
          showToast('Gagal load data.', 'error');
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
        <p>Ringkasan keseluruhan rekod QC</p>
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
            <StatCard label="Total Rekod" value={data.length} sub="Keseluruhan entri" />
            <StatCard label="Quantity OK" value={qtyOK} sub="Unit lulus" className="stat-ok" />
            <StatCard label="Quantity NG" value={qtyNG} sub="Unit gagal" className="stat-ng" />
            <StatCard label="NCR Aktif" value={ncr} sub="Perlu tindakan" className="stat-ncr" />
          </>
        )}
      </div>

      <div className="glass-card">
        <h2 className="card-title"><List /> Rekod Terbaru</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Tarikh</th><th>Route Card</th><th>Part Description</th>
                <th>Material</th><th>Status</th><th>Qty OK</th><th>Qty NG</th>
              </tr>
            </thead>
            <tbody>
              {!loading && recent.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="empty-state"><Inbox />Tiada rekod lagi. Tambah rekod baru!</div>
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
