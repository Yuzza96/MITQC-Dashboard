import { useState } from 'react';
import { Search, Inbox } from 'lucide-react';
import { findRouteCard } from '../api.js';

export default function RouteCard({ showToast }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [searching, setSearching] = useState(false);

  async function handleFind(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await findRouteCard(query.trim());
      setResult(res);
      if (!res.found) showToast('Route Card tidak dijumpai.', 'error');
    } catch (err) {
      showToast('Gagal cari route card.', 'error');
      console.error(err);
      setResult(null);
    } finally {
      setSearching(false);
    }
  }

  function handleReset() {
    setQuery('');
    setResult(null);
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
