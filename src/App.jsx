import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import ScheduleCalendar from './components/ScheduleCalendar.jsx';
import EventEditor from './components/EventEditor.jsx';
import EmployeeSchedule from './components/EmployeeSchedule.jsx';
import PrintableSchedule from './components/PrintableSchedule.jsx';
import { supabase } from './supabase/supabaseClient';

function App() {
  const [view, setView] = useState('dashboard');
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard setView={setView} />;
      case 'login':
        return <Login setView={setView} />;
      case 'admin':
        return <AdminPanel setView={setView} />;
      case 'scheduleview':
        return <EmployeeSchedule user={user} />;
      case 'print':
        return <PrintableSchedule user={user} />;
      case 'calendar':
        return <ScheduleCalendar />;
      case 'eventeditor':
        return <EventEditor />;
      default:
        return <Dashboard setView={setView} />;
    }
  };

  return (
    <div className="App">
      <Header setView={setView} />
      {renderView()}
    </div>
  );
}

export default App;
