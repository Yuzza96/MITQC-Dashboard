export default function Badge({ status }) {
  const s = (status || '').toLowerCase();
  let cls = 'badge-other';
  if (s === 'pass') cls = 'badge-pass';
  else if (s === 'fail') cls = 'badge-fail';
  else if (s === 'pending') cls = 'badge-pending';
  return <span className={`badge ${cls}`}>{status || '—'}</span>;
}
