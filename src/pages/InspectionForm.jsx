import { useState } from 'react';
import { FileText, SearchCheck, Save } from 'lucide-react';
import { saveRecord } from '../api.js';

const today = () => new Date().toISOString().split('T')[0];

const emptyRecord = () => ({
  date: today(), routecard: '', po: '', drawing: '', part: '', qtypo: '',
  material: '', nextprocess: '', inspector: '', status: '', partstatus: '',
  qtyok: '', qtyng: '', short: '', ncr: '', ncrstatus: '', remark: '',
});

export default function InspectionForm({ showToast }) {
  const [record, setRecord] = useState(emptyRecord);
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setRecord(r => ({ ...r, [field]: e.target.value }));
  const reset = () => setRecord(emptyRecord());

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveRecord(record);
      showToast('Record saved successfully!');
      reset();
    } catch (err) {
      showToast('Failed to save record.', 'error');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel">
      <div className="page-header">
        <h1>New Inspection</h1>
        <p>Add a new inspection record</p>
      </div>

      <form autoComplete="off" onSubmit={handleSubmit}>
        <div className="glass-card">
          <h2 className="card-title"><FileText /> Route Card</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Inspection Date <span className="req">*</span></label>
              <input type="date" required value={record.date} onChange={set('date')} />
            </div>
            <div className="form-group">
              <label>Route Card No. <span className="req">*</span></label>
              <input type="text" placeholder="e.g. RC-2026-001" required value={record.routecard} onChange={set('routecard')} />
            </div>
            <div className="form-group">
              <label>PO#</label>
              <input type="text" placeholder="Purchase Order No." value={record.po} onChange={set('po')} />
            </div>
            <div className="form-group">
              <label>Drawing No.</label>
              <input type="text" placeholder="Drawing Number" value={record.drawing} onChange={set('drawing')} />
            </div>
            <div className="form-group full">
              <label>Part Description <span className="req">*</span></label>
              <input type="text" placeholder="Part name/description" required value={record.part} onChange={set('part')} />
            </div>
            <div className="form-group">
              <label>Qty PO</label>
              <input type="number" placeholder="0" min="0" value={record.qtypo} onChange={set('qtypo')} />
            </div>
            <div className="form-group">
              <label>Material</label>
              <input type="text" placeholder="e.g. AISI 4140" value={record.material} onChange={set('material')} />
            </div>
            <div className="form-group">
              <label>Next Process</label>
              <input type="text" placeholder="Next process" value={record.nextprocess} onChange={set('nextprocess')} />
            </div>
            <div className="form-group">
              <label>Inspected By</label>
              <input type="text" placeholder="Inspector name" value={record.inspector} onChange={set('inspector')} />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <h2 className="card-title"><SearchCheck /> Inspection Result</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Inspection Status <span className="req">*</span></label>
              <select required value={record.status} onChange={set('status')}>
                <option value="">— Select —</option>
                <option>Pass</option>
                <option>Fail</option>
                <option>Conditional Pass</option>
                <option>Pending</option>
              </select>
            </div>
            <div className="form-group">
              <label>Part Status</label>
              <select value={record.partstatus} onChange={set('partstatus')}>
                <option value="">— Select —</option>
                <option>Accept</option>
                <option>Reject</option>
                <option>On Hold</option>
              </select>
            </div>
            <div className="form-group">
              <label>Quantity OK</label>
              <input type="number" placeholder="0" min="0" value={record.qtyok} onChange={set('qtyok')} />
            </div>
            <div className="form-group">
              <label>Quantity NG</label>
              <input type="number" placeholder="0" min="0" value={record.qtyng} onChange={set('qtyng')} />
            </div>
            <div className="form-group">
              <label>Short</label>
              <input type="number" placeholder="0" min="0" value={record.short} onChange={set('short')} />
            </div>
            <div className="form-group">
              <label>NCR No.</label>
              <input type="text" placeholder="NCR No. (if any)" value={record.ncr} onChange={set('ncr')} />
            </div>
            <div className="form-group">
              <label>NC Status</label>
              <select value={record.ncrstatus} onChange={set('ncrstatus')}>
                <option value="">— Select —</option>
                <option>N/A</option>
                <option>Open</option>
                <option>In Review</option>
                <option>Closed</option>
              </select>
            </div>
            <div className="form-group full">
              <label>Remark</label>
              <textarea placeholder="Additional notes..." value={record.remark} onChange={set('remark')} />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={reset}>Reset</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save /> {saving ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
