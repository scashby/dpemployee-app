import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const ScheduleAdmin = () => {
  const [weekData, setWeekData] = useState(null);
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    loadWeek(currentMonday);
  }, [currentMonday]);

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  async function loadWeek(date) {
    const iso = date.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('week_start', iso)
      .maybeSingle();

    if (data) {
      setWeekData(data);
      setShifts(data.shifts || []);
    } else {
      setWeekData({
        week_start: iso,
        week_label: `Week of ${date.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })} through ${new Date(date.getTime() + 6 * 86400000).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}`,
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        employees: [],
      });
      setShifts([]);
    }
  }

  const handleChange = (i, j, val) => {
    const copy = [...shifts];
    if (!copy[i]) copy[i] = [];
    copy[i][j] = { shift: val };
    setShifts(copy);
  };

  const addEmployee = () => {
    setWeekData({
      ...weekData,
      employees: [...weekData.employees, 'New Employee']
    });
    setShifts([...shifts, Array(weekData.days.length).fill('')]);
  };

  const save = async () => {
    const payload = { ...weekData, shifts };
    const existing = await supabase.from('schedules').select('id').eq('week_start', weekData.week_start).maybeSingle();
    if (existing.data) {
      await supabase.from('schedules').update(payload).eq('id', existing.data.id);
    } else {
      await supabase.from('schedules').insert([payload]);
    }
    alert('Saved.');
  };

  const jump = (days) => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + days);
    setCurrentMonday(getMonday(d));
  };

  return (
    <div className="p-6 font-body text-dpblue">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-heading">Edit Weekly Schedule</h2>
        <div className="space-x-2">
          <button onClick={() => jump(-7)} className="border px-2 py-1">← Previous</button>
          <button onClick={() => jump(7)} className="border px-2 py-1">Next →</button>
        </div>
      </div>
      {weekData && (
        <>
          <p className="text-md mb-2 font-semibold">{weekData.week_label}</p>
          <table className="min-w-full border border-gray-300 mb-4">
            <thead className="bg-dpoffwhite text-sm uppercase font-semibold text-dpgray">
              <tr>
                <th className="p-2 border-b text-left">Employee</th>
                {weekData.days.map((d, i) => <th key={i} className="p-2 border-b text-center">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {weekData.employees.map((emp, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">
                    <input
                      value={emp}
                      onChange={e => {
                        const updated = [...weekData.employees];
                        updated[i] = e.target.value;
                        setWeekData({ ...weekData, employees: updated });
                      }}
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
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addEmployee} className="bg-gray-300 px-3 py-1 mr-2 rounded">+ Add Employee</button>
          <button onClick={save} className="bg-dpblue text-white px-4 py-1 rounded hover:bg-dpdark">Save Changes</button>
        </>
      )}
    </div>
  );
};

export default ScheduleAdmin;
