import { CheckCircle2, XCircle } from 'lucide-react';

export default function Toast({ toast }) {
  if (!toast) return <div className="toast" />;
  const Icon = toast.type === 'success' ? CheckCircle2 : XCircle;
  return (
    <div className={`toast show ${toast.type}`}>
      <Icon />
      <span>{toast.message}</span>
    </div>
  );
}
