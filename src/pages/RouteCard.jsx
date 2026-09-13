import { useState } from 'react';
import { FileText, Save } from 'lucide-react';
import { saveRecord } from '../api.js';

const today = () => new Date().toISOString().split('T')[0];

const emptyRecord = () => ({
  date: today(), routecard: '', po: '', drawing: '', part: '', qtypo: '',
  material: '', nextprocess: '', inspector: '',
});

export default function RouteCard({ showToast }) {
  const [record, setRecord] = useState(emptyRecord);
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setRecord(r => ({ ...r, [field]: e.target.value }));
  const reset = () => setRecord(emptyRecord());

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveRecord(record);
      showToast('Rekod berjaya disimpan!');
      reset();
    } catch (err) {
      showToast('Gagal simpan rekod.', 'error');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel">
      <div className="page-header">
        <h1>Route Card</h1>
        <p>Tambah maklumat route card</p>
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
              <input type="text" placeholder="cth: RC-2026-001" required value={record.routecard} onChange={set('routecard')} />
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
              <input type="text" placeholder="Nama/penerangan part" required value={record.part} onChange={set('part')} />
            </div>
            <div className="form-group">
              <label>Qty PO</label>
              <input type="number" placeholder="0" min="0" value={record.qtypo} onChange={set('qtypo')} />
            </div>
            <div className="form-group">
              <label>Material</label>
              <input type="text" placeholder="cth: AISI 4140" value={record.material} onChange={set('material')} />
            </div>
            <div className="form-group">
              <label>Next Process</label>
              <input type="text" placeholder="Proses seterusnya" value={record.nextprocess} onChange={set('nextprocess')} />
            </div>
            <div className="form-group">
              <label>Inspected By</label>
              <input type="text" placeholder="Nama inspektor" value={record.inspector} onChange={set('inspector')} />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={reset}>Reset</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save /> {saving ? 'Menyimpan...' : 'Simpan Rekod'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
