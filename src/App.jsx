import React, { useState } from 'react';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import AdminPanel from './components/AdminPanel';
import ScheduleView from './components/ScheduleView';

export default function App() {
  const [view, setView] = useState('dashboard');

  const renderView = () => {
    switch (view) {
      case 'admin':
        return <AdminPanel />;
      case 'schedule':
        return <ScheduleView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header onNavigate={setView} />
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
}