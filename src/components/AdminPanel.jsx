import React from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import ScheduleCalendar from './ScheduleCalendar.jsx';

const Placeholder = ({ title }) => (
  <div className="p-6">
    <h2 className="text-2xl font-semibold">{title}</h2>
    <p className="text-gray-600 mt-2">This section will allow admins to manage {title.toLowerCase()}.</p>
  </div>
);

const AdminPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 p-4 border-r border-gray-200">
        <h2 className="text-xl font-bold mb-6">Admin Dashboard</h2>
        <nav className="space-y-2">
          <Link to="/admin/schedule" className="block p-2 rounded hover:bg-gray-200">Edit Schedule</Link>
          <Link to="/admin/events" className="block p-2 rounded hover:bg-gray-200">Edit Events</Link>
          <Link to="/admin/staff" className="block p-2 rounded hover:bg-gray-200">Manage Staff</Link>
          <Link to="/admin/settings" className="block p-2 rounded hover:bg-gray-200">Site Settings</Link>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-sm text-blue-600 underline"
          >
            Return to Home
          </button>
        </nav>
      </aside>

      {/* Content Panel */}
      <main className="flex-1 bg-white overflow-y-auto">
        <Routes>
          <Route path="/schedule" element={<ScheduleCalendar />} />
          <Route path="/events" element={<Placeholder title="Events" />} />
          <Route path="/staff" element={<Placeholder title="Staff" />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminPanel;
