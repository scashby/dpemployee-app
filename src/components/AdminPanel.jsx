import React, { useState } from 'react';
import AdminEmployees from './AdminEmployees';
import AdminEvents from './AdminEvents';
import AdminDefaultSchedule from './AdminDefaultSchedule';
import AdminScheduleEditor from './AdminScheduleEditor';
import '../styles/admin.css';

const AdminPanel = () => {
  const [activePanel, setActivePanel] = useState('events'); // Default to events instead of home
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        return <AdminEvents />; // Fallback to events instead of empty welcome
    }
  };

  return (
    <div className="admin-layout">
      {/* Mobile admin menu button */}
      <button 
        className="admin-mobile-menu-button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? '✕ Close Admin Menu' : '☰ Admin Menu'}
      </button>
      
      {/* Admin sidebar - toggle on mobile */}
      <nav className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <h2 className="sidebar-title">Admin Tools</h2>
        <ul className="admin-nav-list">
          <li>
            <button 
              onClick={() => {
                setActivePanel('employees'); 
                setMobileMenuOpen(false);
              }} 
              className={`admin-nav-button ${activePanel === 'employees' ? 'active' : ''}`}
            >
              Edit/Add Employees
            </button>
          </li>
          <li>
            <button 
              onClick={() => {
                setActivePanel('events');
                setMobileMenuOpen(false);
              }} 
              className={`admin-nav-button ${activePanel === 'events' ? 'active' : ''}`}
            >
              Edit/Add Events
            </button>
          </li>
          <li>
            <button 
              onClick={() => {
                setActivePanel('default');
                setMobileMenuOpen(false);
              }} 
              className={`admin-nav-button ${activePanel === 'default' ? 'active' : ''}`}
            >
              Edit/Add Default Schedule
            </button>
          </li>
          <li>
            <button 
              onClick={() => {
                setActivePanel('schedule');
                setMobileMenuOpen(false);
              }} 
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