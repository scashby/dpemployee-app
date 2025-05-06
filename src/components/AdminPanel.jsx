import React, { useState } from 'react';
import AdminEmployees from './AdminEmployees';
import AdminEvents from './AdminEvents';
import AdminDefaultSchedule from './AdminDefaultSchedule';
import AdminScheduleEditor from './AdminScheduleEditor';
import '../styles/admin.css';

const AdminPanel = () => {
  const [activePanel, setActivePanel] = useState('home');

  const renderPanel = () => {
    switch (activePanel) {
      case 'employees':
        return <AdminEmployees />;
      case 'events':
        return <AdminEvents />;
      case 'default':
        return <AdminDefaultSchedule />;
      case 'schedule':
        return <AdminScheduleEditor />;
      default:
        return (
          <div className="admin-section">
            <h2 className="admin-title">Welcome to the Admin Panel</h2>
            <p>Select a section from the left to begin managing schedules, events, or employees.</p>
          </div>
        );
    }
  };

  return (
    <div className="admin-layout">
      <nav className="admin-sidebar">
        <h2 className="sidebar-title">Admin Tools</h2>
        <ul className="admin-nav-list">
          <li>
            <button 
              onClick={() => setActivePanel('employees')} 
              className={`admin-nav-button ${activePanel === 'employees' ? 'active' : ''}`}
            >
              Edit/Add Employees
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActivePanel('events')} 
              className={`admin-nav-button ${activePanel === 'events' ? 'active' : ''}`}
            >
              Edit/Add Events
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActivePanel('default')} 
              className={`admin-nav-button ${activePanel === 'default' ? 'active' : ''}`}
            >
              Edit/Add Default Schedule
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActivePanel('schedule')} 
              className={`admin-nav-button ${activePanel === 'schedule' ? 'active' : ''}`}
            >
              Edit Weekly Schedule
            </button>
          </li>
        </ul>
      </nav>
      <main className="admin-content">{renderPanel()}</main>
    </div>
  );
};

export default AdminPanel;