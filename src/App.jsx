import React, { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Events from './pages/Events.jsx';
import ScheduleView from './components/ScheduleView.jsx';
import ScheduleAdmin from './components/ScheduleAdmin.jsx';
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
      case 'admin':
        return <ScheduleAdmin />;
      case 'scheduleview':
        return <ScheduleView user={user} />;
      case 'events':
        return <Events />;
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
