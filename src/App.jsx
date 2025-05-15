import React, { useState } from 'react';
import Header from './components/Header.jsx';
import MobileNavigation from './components/MobileNavigation.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ScheduleView from './components/ScheduleView.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import DebugInfo from './components/DebugInfo.jsx';

function App() {
  const [view, setView] = useState('dashboard');

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard />;
      case 'schedule':
        return <ScheduleView />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-dpoffwhite text-dpblue">
      <Header onNavigate={setView} />
      <div className="main-content-container">
        {renderView()}
      </div>
      <MobileNavigation onNavigate={setView} currentView={view} />
      <>
        {/* Other components */}
        <DebugInfo />
      </>
    </div>
    
  );
}

export default App;