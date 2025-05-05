import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient.js'; // ✅

const AdminDefaultSchedule = () => {
  const [templates, setTemplates] = useState([]);
  const [typeFilter, setTypeFilter] = useState('seasonal');
  const [newTemplate, setNewTemplate] = useState({
    label: '', type: 'seasonal', schedule: []
  });

  useEffect(() => {
    fetchTemplates();
  }, [typeFilter]);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('default_schedules')
      .select('*')
      .eq('type', typeFilter)
      .order('label');
    if (!error) setTemplates(data);
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...templates];
    updated[index][field] = value;
    setTemplates(updated);
  };

  const saveTemplate = async (template) => {
    await supabase.from('default_schedules').update(template).eq('id', template.id);
    fetchTemplates();
  };

  const addTemplate = async () => {
    await supabase.from('default_schedules').insert([newTemplate]);
    setNewTemplate({ label: '', type: 'seasonal', schedule: [] });
    fetchTemplates();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Manage Default Schedules</h2>

      <div className="mb-4">
        <label className="mr-2">Filter:</label>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border p-1">
          <option value="seasonal">Seasonal</option>
          <option value="holiday">Holiday</option>
        </select>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Label</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((tpl, index) => (
            <tr key={tpl.id}>
              <td className="p-2 border">
                <input value={tpl.label} onChange={(e) => handleFieldChange(index, 'label', e.target.value)} className="w-full" />
              </td>
              <td className="p-2 border">{tpl.type}</td>
              <td className="p-2 border text-center">
                <button onClick={() => saveTemplate(tpl)} className="bg-blue-600 text-white px-2 py-1 rounded">Save</button>
              </td>
            </tr>
          ))}
          <tr className="bg-yellow-50">
            <td className="p-2 border">
              <input value={newTemplate.label} onChange={(e) => setNewTemplate({ ...newTemplate, label: e.target.value })} className="w-full" placeholder="New Template" />
            </td>
            <td className="p-2 border">
              <select value={newTemplate.type} onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })} className="w-full">
                <option value="seasonal">Seasonal</option>
                <option value="holiday">Holiday</option>
              </select>
            </td>
            <td className="p-2 border text-center">
              <button onClick={addTemplate} className="bg-green-600 text-white px-2 py-1 rounded">Add</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AdminDefaultSchedule;