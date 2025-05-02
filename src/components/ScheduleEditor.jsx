import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const ScheduleEditor = () => {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [weekData, setWeekData] = useState(null);
  const [shifts, setShifts] = useState([]);

  function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const formatLabel = (startDate) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `Week of ${start.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })} through ${end.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}`;
  };

  useEffect(() => {
    const load = async () => {
      const iso = weekStart.toISOString().split('T')[0];
      const { data } = await supabase.from('schedules').select('*').eq('week_start', iso).maybeSingle();
      if (data) {
        setWeekData(data);
        setShifts(data.shifts || []);
      } else {
        setWeekData({
          week_start: iso,
          week_label: formatLabel(weekStart),
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          employees: [],
        });
        setShifts([]);
      }
    };
    load();
  }, [weekStart]);

  const save = async () => {
    const payload = { ...weekData, shifts };
    const existing = await supabase.from('schedules').select('id').eq('week_start', weekData.week_start).maybeSingle();
    if (existing.data) {
      await supabase.from('schedules').update(payload).eq('id', existing.data.id);
    } else {
      await supabase.from('schedules').insert([payload]);
    }
    alert('Schedule saved.');
  };

  const addEmployee = () => {
    const updated = [...weekData.employees, 'New Employee'];
    const updatedShifts = [...shifts, Array(weekData.days.length).fill({ shift: '' })];
    setWeekData({ ...weekData, employees: updated });
    setShifts(updatedShifts);
  };

  const removeEmployee = (index) => {
    const updatedEmps = weekData.employees.filter((_, i) => i !== index);
    const updatedShifts = shifts.filter((_, i) => i !== index);
    setWeekData({ ...weekData, employees: updatedEmps });
    setShifts(updatedShifts);
  };

  const handleChange = (i, j, val) => {
    const updated = [...shifts];
    if (!updated[i]) updated[i] = [];
    updated[i][j] = { shift: val };
    setShifts(updated);
  };

  const updateEmpName = (i, val) => {
    const updated = [...weekData.employees];
    updated[i] = val;
    setWeekData({ ...weekData, employees: updated });
  };

  const jump = (days) => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + days);
    setWeekStart(getMonday(newDate));
  };

  return (
    <div className="p-6 font-body text-dpblue">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading">Edit Weekly Schedule</h2>
        <div className="space-x-2">
          <button onClick={() => jump(-7)} className="border px-2 py-1">← Previous</button>
          <button onClick={() => jump(7)} className="border px-2 py-1">Next →</button>
        </div>
      </div>

      <p className="mb-4 font-semibold">{weekData?.week_label}</p>
      <table className="min-w-full border border-gray-300 mb-4 text-sm">
        <thead className="bg-dpoffwhite text-xs uppercase font-semibold text-dpgray">
          <tr>
            <th className="p-2 border-b text-left">Employee</th>
            {weekData?.days?.map((d, i) => <th key={i} className="p-2 border-b text-center">{d}</th>)}
            <th className="p-2 border-b text-center">Remove</th>
          </tr>
        </thead>
        <tbody>
          {weekData?.employees?.map((emp, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">
                <input
                  value={emp}
                  onChange={e => updateEmpName(i, e.target.value)}
                  className="w-full border px-1"
                />
              </td>
              {weekData.days.map((_, j) => (
                <td key={j} className="p-2">
                  <input
                    type="text"
                    value={shifts[i]?.[j]?.shift || ''}
                    onChange={(e) => handleChange(i, j, e.target.value)}
                    className="w-full border px-1 text-center"
                  />
                </td>
              ))}
              <td className="p-2 text-center">
                <button onClick={() => removeEmployee(i)} className="text-red-600 hover:underline">X</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2">
        <button onClick={addEmployee} className="bg-gray-300 px-3 py-1 rounded">+ Add Employee</button>
        <button onClick={save} className="bg-dpblue text-white px-4 py-1 rounded hover:bg-dpdark">Save Changes</button>
      </div>
    </div>
  );
};

export default ScheduleEditor;
