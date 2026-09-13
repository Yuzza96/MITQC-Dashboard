import { useCallback, useRef, useState } from 'react';
import Toast from './components/Toast.jsx';
import RouteCard from './pages/RouteCard.jsx';

// Sementara: sidebar & menu lain (Home/Reports/Inspection Result) dibuang
// buat masa ni — fokus siapkan menu "Route Card" dulu. Menu lain akan
// ditambah semula kemudian (lihat src/pages/Home.jsx, Reports.jsx,
// InspectionForm.jsx dan src/components/Sidebar.jsx — kekal, cuma tak
// digunakan sekarang).

export default function App() {
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <>
      <main className="main standalone">
        <RouteCard showToast={showToast} />
      </main>
      <Toast toast={toast} />
    </>
  );
}
