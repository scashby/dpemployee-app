import React from 'react';
import { useState } from 'react';
import AdminEmployees from './AdminEmployees';
import AdminEvents from './AdminEvents';
import AdminDefaultSchedule from './AdminDefaultSchedule';
import AdminScheduleEditor from './AdminScheduleEditor';

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
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Welcome to the Admin Panel</h2>
            <p>Select a section from the left to begin managing schedules, events, or employees.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full">
      <nav className="w-64 bg-gray-100 border-r p-4">
        <h2 className="text-lg font-bold mb-4">Admin Tools</h2>
        <ul className="space-y-2">
          <li>
            <button onClick={() => setActivePanel('employees')} className="text-left w-full hover:text-blue-600">Edit/Add Employees</button>
          </li>
          <li>
            <button onClick={() => setActivePanel('events')} className="text-left w-full hover:text-blue-600">Edit/Add Events</button>
          </li>
          <li>
            <button onClick={() => setActivePanel('default')} className="text-left w-full hover:text-blue-600">Edit/Add Default Schedule</button>
          </li>
          <li>
            <button onClick={() => setActivePanel('schedule')} className="text-left w-full hover:text-blue-600">Edit Weekly Schedule</button>
          </li>
        </ul>
      </nav>
      <main className="flex-1 overflow-y-auto">{renderPanel()}</main>
    </div>
  );
};

export default AdminPanel;