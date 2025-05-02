import React, { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import ScheduleView from './components/ScheduleView.jsx';

function App() {
  const [view, setView] = useState('dashboard');

  const renderView = () => {
    switch (view) {
      case 'admin':
        return <AdminPanel />;
      case 'scheduleview':
        return <ScheduleView />;
      default:
        return <div className="p-6 text-dpblue font-body">Welcome to the Devil’s Purse internal app.</div>;
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
