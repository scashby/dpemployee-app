import React, { useState } from 'react';
import ScheduleEditor from './ScheduleEditor.jsx';

const AdminPanel = () => {
  const [section, setSection] = useState(null);

  const renderSection = () => {
    switch (section) {
      case 'schedule':
        return <ScheduleEditor />;
      default:
        return <p className="text-dpblue text-md p-4">Welcome to the Admin Panel. Select a tool from the left.</p>;
    }
  };

  return (
    <div className="flex font-body text-dpblue">
      <aside className="w-48 p-4 border-r border-gray-300 bg-dpoffwhite">
        <h2 className="text-lg font-semibold mb-4">Admin Panel</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <button onClick={() => setSection('schedule')} className="hover:underline">
              Edit Schedule
            </button>
          </li>
        </ul>
      </aside>
      <main className="flex-1 p-6">{renderSection()}</main>
    </div>
  );
};

export default AdminPanel;
