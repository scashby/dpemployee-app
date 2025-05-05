import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient.js';

const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const AdminScheduleEditor = () => {
  const [weekStart, setWeekStart] = useState('');
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [newRow, setNewRow] = useState({ employee_name: '', shifts: {} });

  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate() - today.getDay()); // go to Sunday
    const sunday = today.toISOString().slice(0, 10);
    setWeekStart(sunday);
  }, []);

  useEffect(() => {
    if (weekStart) {
      fetchEmployees();
      fetchSchedule();
    }
  }, [weekStart]);

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('name');
    if (data) setEmployees(data.map(e => e.name));
  };

  const fetchSchedule = async () => {
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('week_start', weekStart);
    if (data) {
      const grouped = {};
      data.forEach((entry) => {
        if (!grouped[entry.employee_name]) grouped[entry.employee_name] = {};
        grouped[entry.employee_name][entry.day] = entry.shift;
      });
      const formatted = Object.entries(grouped).map(([employee_name, shifts]) => ({ employee_name, shifts }));
      setSchedule(formatted);
    }
  };

  const handleShiftChange = (rowIndex, day, value) => {
    const updated = [...schedule];
    updated[rowIndex].shifts[day] = value;
    setSchedule(updated);
  };

  const saveSchedule = async () => {
    await supabase.from('schedules').delete().eq('week_start', weekStart);
    const rows = [];
    schedule.forEach(row => {
      days.forEach(day => {
        const shift = row.shifts[day];
        if (shift && shift.trim()) {
          rows.push({
            week_start: weekStart,
            employee_name: row.employee_name,
            day,
            shift,
          });
        }
      });
    });
    await supabase.from('schedules').insert(rows);
    fetchSchedule();
  };

  const addRow = () => {
    if (!newRow.employee_name) return;
    setSchedule([...schedule, { ...newRow }]);
    setNewRow({ employee_name: '', shifts: {} });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Edit Weekly Schedule</h2>

      <label className="block mb-2">
        Week Starting (Sunday):
        <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="ml-2 border p-1" />
      </label>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse mb-4">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Employee</th>
              {days.map(day => (
                <th key={day} className="p-2 border">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="p-2 border">{row.employee_name}</td>
                {days.map(day => (
                  <td key={day} className="p-1 border">
                    <input
                      value={row.shifts[day] || ''}
                      onChange={(e) => handleShiftChange(rowIndex, day, e.target.value)}
                      className="w-full px-1"
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-yellow-50">
              <td className="p-2 border">
                <select
                  value={newRow.employee_name}
                  onChange={(e) => setNewRow({ ...newRow, employee_name: e.target.value })}
                  className="w-full"
                >
                  <option value="">Select Employee</option>
                  {employees.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </td>
              {days.map(day => (
                <td key={day} className="p-1 border">
                  <input
                    value={newRow.shifts[day] || ''}
                    onChange={(e) => setNewRow({
                      ...newRow,
                      shifts: { ...newRow.shifts, [day]: e.target.value }
                    })}
                    className="w-full px-1"
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex gap-4">
        <button onClick={addRow} className="bg-green-600 text-white px-4 py-2 rounded">Add Row</button>
        <button onClick={saveSchedule} className="bg-blue-600 text-white px-4 py-2 rounded">Save Schedule</button>
      </div>
    </div>
  );
};

export default AdminScheduleEditor;