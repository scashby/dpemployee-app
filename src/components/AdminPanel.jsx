import React, { useState } from 'react';
import ScheduleEditor from './ScheduleEditor';

const AdminPanel = () => {
  const [section, setSection] = useState(null);

  const renderPanel = () => {
    switch (section) {
      case 'schedule':
        return <ScheduleEditor />;
      default:
        return <p className="text-dpgray">Select a section from the sidebar to begin.</p>;
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
          <li>
            <button disabled className="text-gray-400 cursor-not-allowed">
              Edit Events (coming soon)
            </button>
          </li>
        </ul>
      </aside>
      <main className="flex-1 p-6">{renderPanel()}</main>
    </div>
  );
};

export default AdminPanel;
