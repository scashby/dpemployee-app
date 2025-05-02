import React, { useState } from 'react';
import Header from './components/Header.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import ScheduleCalendar from './components/ScheduleCalendar.jsx';
import EventEditor from './components/EventEditor.jsx';
import WeeklySchedule from './components/WeeklySchedule.jsx';

function App() {
  const [view, setView] = useState('dashboard');

  const renderView = () => {
    switch (view) {
      case 'login':
        return <Login />;
      case 'admin':
        return <AdminPanel />;
      case 'schedule':
        return <ScheduleCalendar />;
      case 'scheduleview':
        return <WeeklySchedule />;
      case 'events':
        return <EventEditor />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Header setView={setView} />
      <main className="p-4">
        {renderView()}
      </main>
    </>
  );
}

export default App;
