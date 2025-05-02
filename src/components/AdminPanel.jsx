import React from 'react';
import ScheduleEditor from './ScheduleEditor';

const AdminPanel = () => {
  return (
    <div className="p-6 text-dpblue font-body">
      <h2 className="text-2xl font-heading mb-4 tracking-tight">Admin Panel</h2>
      <ScheduleEditor />
    </div>
  );
};

export default AdminPanel;
