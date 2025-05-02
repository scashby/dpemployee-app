import React, { useEffect, useState } from 'react';
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
      case 'scheduleview':
        return <ScheduleView />;
      case 'admin':
        return <ScheduleEditor />;
      default:
        return <Dashboard />;
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
