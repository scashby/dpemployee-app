// src/components/AdminPanel.jsx - Responsive Refactor
import React, { useState } from 'react';
import AdminEvents from './AdminEvents';
import AdminEmployees from './AdminEmployees';
import AdminDefaultSchedule from './AdminDefaultSchedule';
import AdminScheduleEditor from './AdminScheduleEditor';

const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState('events');
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Render the appropriate admin section based on activeSection
  const renderSection = () => {
    switch (activeSection) {
      case 'events':
        return <AdminEvents />;
      case 'employees':
        return <AdminEmployees />;
      case 'defaultSchedule':
        return <AdminDefaultSchedule />;
      case 'scheduleEditor':
        return <AdminScheduleEditor />;
      default:
        return <AdminEvents />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Menu Button - Only visible on small screens */}
      <div className="md:hidden flex items-center justify-between p-4 bg-blue-600 text-white">
        <h1 className="text-lg font-bold">Admin Dashboard</h1>
        <button 
          onClick={toggleMenu} 
          className="text-white focus:outline-none"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            {menuOpen ? (
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            ) : (
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16" 
              />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar - Always visible on desktop, conditionally visible on mobile */}
      <div 
        className={`
          w-full md:w-64 bg-blue-600 text-white overflow-y-auto
          ${menuOpen ? 'block' : 'hidden'} md:block
          transition-all duration-300 ease-in-out
        `}
      >
        <div className="hidden md:block p-4 border-b border-blue-500">
          <h1 className="text-lg font-bold">Admin Dashboard</h1>
        </div>
        <nav className="mt-4">
          <ul>
            <li className="px-4 py-2">
              <button 
                onClick={() => {
                  setActiveSection('events');
                  setMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-4 rounded hover:bg-blue-700 transition-colors
                  ${activeSection === 'events' ? 'bg-blue-700' : ''}`}
              >
                Events
              </button>
            </li>
            <li className="px-4 py-2">
              <button 
                onClick={() => {
                  setActiveSection('employees');
                  setMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-4 rounded hover:bg-blue-700 transition-colors
                  ${activeSection === 'employees' ? 'bg-blue-700' : ''}`}
              >
                Employees
              </button>
            </li>
            <li className="px-4 py-2">
              <button 
                onClick={() => {
                  setActiveSection('defaultSchedule');
                  setMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-4 rounded hover:bg-blue-700 transition-colors
                  ${activeSection === 'defaultSchedule' ? 'bg-blue-700' : ''}`}
              >
                Default Schedule
              </button>
            </li>
            <li className="px-4 py-2">
              <button 
                onClick={() => {
                  setActiveSection('scheduleEditor');
                  setMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-4 rounded hover:bg-blue-700 transition-colors
                  ${activeSection === 'scheduleEditor' ? 'bg-blue-700' : ''}`}
              >
                Schedule Editor
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderSection()}
      </div>
    </div>
  );
};

export default AdminPanel;
