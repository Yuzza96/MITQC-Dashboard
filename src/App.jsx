import { useCallback, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Toast from './components/Toast.jsx';
import RouteCard from './pages/RouteCard.jsx';

// Temporary: other menus (Home/Reports/Inspection Result) are dropped
// for now - focus on getting the "Route Card" menu right first. They'll
// be added back later (see src/pages/Home.jsx, Reports.jsx,
// InspectionForm.jsx - kept, just unused right now).

export default function App() {
  const [activePanel, setActivePanel] = useState('routecard');
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
        {activePanel === 'routecard' && <RouteCard showToast={showToast} />}
      </main>
      <Toast toast={toast} />
    </>
  );
}
