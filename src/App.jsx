import React, { useState } from 'react';
import Header from './components/Header.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ScheduleView from './components/ScheduleView.jsx';
import ScheduleEditor from './components/ScheduleEditor.jsx';

function App() {
  const [view, setView] = useState('dashboard');

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard />;
      case 'schedule':
        return <ScheduleView />;
      case 'admin':
        return <ScheduleEditor />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-dpoffwhite text-dpblue">
      <Header onNavigate={setView} />
      {renderView()}
    </div>
  );
}

export default App;
