import React, { useState } from 'react';
import Header from './components/Header';
import EmployeeSchedule from './components/EmployeeSchedule'; // Your main dashboard
import AdminEmployees from './components/AdminEmployees';
import AdminEvents from './components/AdminEvents';
import AdminDefaultSchedule from './components/AdminDefaultSchedule';
import AdminScheduleEditor from './components/AdminScheduleEditor';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // Default view is your main dashboard

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <EmployeeSchedule />;
      case 'employees':
        return <AdminEmployees />;
      case 'events':
        return <AdminEvents />;
      case 'defaultSchedule':
        return <AdminDefaultSchedule />;
      case 'scheduleEditor':
        return <AdminScheduleEditor />;
      default:
        return <div>Select a view.</div>;
    }
  };

  return (
    <div>
      <Header />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <button onClick={() => setCurrentView('dashboard')}>Dashboard</button>
        <button onClick={() => setCurrentView('employees')}>Employees</button>
        <button onClick={() => setCurrentView('events')}>Events</button>
        <button onClick={() => setCurrentView('defaultSchedule')}>Default Schedules</button>
        <button onClick={() => setCurrentView('scheduleEditor')}>Edit Schedule</button>
      </div>
      <div style={{ padding: '20px' }}>
        {renderView()}
      </div>
    </div>
  );
}

export default App;