import { useCallback, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Toast from './components/Toast.jsx';
import Home from './pages/Home.jsx';
import InspectionForm from './pages/InspectionForm.jsx';
import Reports from './pages/Reports.jsx';

export default function App() {
  const [activePanel, setActivePanel] = useState('home');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <>
      <Sidebar activePanel={activePanel} onNavigate={setActivePanel} />
      <main className="main">
        {activePanel === 'home' && <Home showToast={showToast} />}
        {activePanel === 'form' && <InspectionForm showToast={showToast} />}
        {activePanel === 'report' && <Reports showToast={showToast} />}
      </main>
      <Toast toast={toast} />
    </>
  );
}
