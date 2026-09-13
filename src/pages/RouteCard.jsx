import { useState } from 'react';
import { Search, Inbox, ClipboardList, FileText, Tag, Briefcase, Layers, Boxes, Clock } from 'lucide-react';
import { findRouteCard } from '../api.js';

// WO# and Drawing Number are shown in the hero above instead of a group.
const DETAIL_GROUPS = [
  { title: 'Route Card Info', icon: Tag, fields: ['REV', 'PO#'] },
  { title: 'Project & Purpose', icon: Briefcase, fields: ['PURPOSE / PROJECT', 'RFM / IHM / RGAF'] },
  { title: 'Material & Coating', icon: Layers, fields: ['MATERIAL', 'COATING', 'COATING2'] },
  { title: 'Quantity', icon: Boxes, fields: ['QTY\nPO', 'QTY'] },
];

export default function RouteCard({ showToast }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [revisions, setRevisions] = useState(null);
  const [searching, setSearching] = useState(false);

  async function runSearch(wo, index) {
    setSearching(true);
    try {
      const res = await findRouteCard(wo, index);
      if (res.multiple) {
        setRevisions(res.revisions);
        setResult(null);
      } else {
        setRevisions(null);
        setResult(res);
        if (!res.found) showToast('Route Card tidak dijumpai.', 'error');
      }
    } catch (err) {
      showToast('Gagal cari route card.', 'error');
      console.error(err);
      setResult(null);
      setRevisions(null);
    } finally {
      setSearching(false);
    }
  }

  function handleFind(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setResult(null);
    setRevisions(null);
    runSearch(query.trim());
  }

  function handlePickRevision(index) {
    runSearch(query.trim(), index);
  }

  function handleReset() {
    setQuery('');
    setResult(null);
    setRevisions(null);
  }

  return (
    <div className="panel">
      <div className="page-header">
        <h1>Route Card</h1>
        <p>Cari maklumat route card sedia ada</p>
      </div>

      <form className="glass-card" onSubmit={handleFind}>
        <h2 className="card-title"><Search /> Register Route Card</h2>
        <div className="form-group">
          <label>Route Card No. <span className="req">*</span></label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              placeholder="Enter Route Card number"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" disabled={searching} style={{ flexShrink: 0 }}>
              {searching ? 'Mencari...' : 'Find'}
            </button>
            <button type="button" className="btn-ghost" onClick={handleReset} style={{ flexShrink: 0 }}>
              Reset
            </button>
          </div>
        </div>
      </form>

      {revisions && (
        <div className="glass-card">
          <h2 className="card-title">This route card have multiple revision</h2>
          <p style={{ marginBottom: 14, color: 'var(--text-muted)', fontSize: 13.5 }}>
            Sila pilih revision yang anda perlukan:
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {revisions.map(({ index, label }) => (
              <button key={index} type="button" className="btn-ghost" onClick={() => handlePickRevision(index)}>
                Rev {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="glass-card">
          {result.found ? (
            <div className="table-header-row">
              <h2 className="card-title" style={{ margin: 0 }}>Details</h2>
              {/* TODO: wire up the actual register action */}
              <button type="button" className="btn-primary">Register Route Card</button>
            </div>
          ) : (
            <h2 className="card-title">Details</h2>
          )}
          {!result.found ? (
            <div className="empty-state"><Inbox />Route Card tidak dijumpai.</div>
          ) : (
            <>
              <div className="detail-hero">
                <div className="detail-hero-label">Part Description</div>
                <div className="detail-hero-title">{result.data['PART DESCRIPTION'] || '—'}</div>
                <div className="detail-hero-badges">
                  {result.data['WO#'] && (
                    <span className="detail-hero-badge"><ClipboardList /><span className="b-label">Route Card</span> {result.data['WO#']}</span>
                  )}
                  {result.data['DRAWING NUMBER'] && (
                    <span className="detail-hero-badge"><FileText /><span className="b-label">Drawing Number</span> {result.data['DRAWING NUMBER']}</span>
                  )}
                </div>
              </div>
              <div className="detail-groups-grid">
                {DETAIL_GROUPS.map(({ title, icon: Icon, fields }) => {
                  const items = fields
                    .map(field => [field, result.data[field]])
                    .filter(([, v]) => v !== '' && v !== null && v !== undefined);
                  if (!items.length) return null;
                  return (
                    <div className="detail-group" key={title}>
                      <div className="detail-group-title"><Icon /> {title}</div>
                      <div className="detail-grid">
                        {items.map(([field, value]) => (
                          <div className="detail-item" key={field}>
                            <div className="d-label">{field.replace('\n', ' ')}</div>
                            <div className="d-value">{value.toString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TODO: backed by real data once Register Route Card writes somewhere */}
      <div className="glass-card">
        <h2 className="card-title"><Clock /> Pending Inspection</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>WO#</th><th>Rev</th><th>Part Description</th><th>Drawing Number</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={4}>
                <div className="empty-state"><Inbox />No pending route cards</div>
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
