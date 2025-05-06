import React, { useState } from 'react';
import { supabase } from './supabase/supabaseClient';
import './styles/admin.css';

// Import components
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Events from './pages/Events';
import AdminPanel from './components/AdminPanel';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'schedule':
        return <Schedule />;
      case 'events':
        return <Events />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard />;
    }
  };
  
  return (
    <div className="app">
      <Header 
        setCurrentView={setCurrentView} 
        currentView={currentView}
      />
      <main>
        {renderView()}
      </main>
    </div>
  );
}

export default App;