import React, { useState } from 'react';

const AdminDefaultSchedule = () => {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('seasonal');

  const saveDefault = () => {
    // Will use Supabase later for saving
    alert('Saved default schedule template.');
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Edit/Add Default Schedule</h2>
      <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (e.g. Summer)" className="border p-1 mr-2" />
      <select value={type} onChange={e => setType(e.target.value)} className="border p-1 mr-2">
        <option value="seasonal">Seasonal</option>
        <option value="holiday">Holiday</option>
      </select>
      <button onClick={saveDefault} className="bg-purple-500 text-white px-3 py-1">Save</button>
    </div>
  );
};

export default AdminDefaultSchedule;