import { useState } from 'react';
import { Search, Inbox } from 'lucide-react';
import { findRouteCard } from '../api.js';

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
          <h2 className="card-title">Details</h2>
          {!result.found ? (
            <div className="empty-state"><Inbox />Route Card tidak dijumpai.</div>
          ) : (
            <div className="table-scroll">
              <table>
                <tbody>
                  {Object.entries(result.data)
                    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
                    .map(([field, value]) => (
                      <tr key={field}>
                        <td style={{ fontWeight: 600, color: 'var(--text-muted)', width: '35%' }}>{field}</td>
                        <td>{value.toString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
