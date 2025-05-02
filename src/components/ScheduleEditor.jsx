
import React, { useEffect, useState } from 'react';
import WeeklySchedule from './WeeklySchedule';
import { supabase } from '../supabase/supabaseClient';

const ScheduleEditor = () => {
  const [weekData, setWeekData] = useState(null);
  const [modifiedShifts, setModifiedShifts] = useState([]);
  const [currentMonday, setCurrentMonday] = useState(getCurrentMonday());

  useEffect(() => {
    fetchWeekSchedule(currentMonday);
  }, [currentMonday]);

  function getCurrentMonday() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    today.setDate(diff);
    today.setHours(0, 0, 0, 0);
    return today;
  }

  function formatWeekLabel(startDate) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `Week of ${start.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })} through ${end.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}`;
  }

  async function fetchWeekSchedule(mondayDate) {
    const weekStart = mondayDate.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('week_start', weekStart)
      .maybeSingle();

    if (!error && data) {
      setWeekData(data);
      setModifiedShifts(data.shifts || []);
    } else {
      setWeekData({
        week_start: weekStart,
        week_label: formatWeekLabel(mondayDate),
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        employees: [],
        shifts: [],
      });
      setModifiedShifts([]);
    }
  }

  const handleShiftChange = (row, col, newValue) => {
    const updated = [...modifiedShifts];
    if (!updated[row]) updated[row] = [];
    updated[row][col] = { shift: newValue };
    setModifiedShifts(updated);
  };

  const handleSave = async () => {
    if (!weekData) return;

    const { data: existing } = await supabase
      .from('schedules')
      .select('id')
      .eq('week_start', weekData.week_start)
      .maybeSingle();

    const payload = {
      ...weekData,
      shifts: modifiedShifts,
    };

    if (existing) {
      await supabase.from('schedules').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('schedules').insert([payload]);
    }

    alert('Schedule saved.');
  };

  const handleAddEmployee = () => {
    const updated = [...weekData.employees, 'New Employee'];
    const updatedShifts = [...modifiedShifts, Array(weekData.days.length).fill('')];
    setWeekData({ ...weekData, employees: updated });
    setModifiedShifts(updatedShifts);
  };

  const navigateWeek = (offsetDays) => {
    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(currentMonday.getDate() + offsetDays);
    setCurrentMonday(nextMonday);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-heading">Edit Weekly Schedule</h3>
        <div className="space-x-2">
          <button onClick={() => navigateWeek(-7)} className="px-2 py-1 border rounded">← Previous</button>
          <button onClick={() => navigateWeek(7)} className="px-2 py-1 border rounded">Next →</button>
        </div>
      </div>

      {weekData ? (
        <>
          <WeeklySchedule
            weekLabel={formatWeekLabel(currentMonday)}
            days={weekData.days}
            employees={weekData.employees}
            shifts={modifiedShifts}
            editable={true}
            onShiftChange={handleShiftChange}
          />
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAddEmployee}
              className="px-4 py-2 bg-gray-300 text-sm rounded hover:bg-gray-400"
            >
              + Add Employee
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-dpblue text-white text-sm rounded hover:bg-dpdark"
            >
              Save Changes
            </button>
          </div>
        </>
      ) : (
        <p>Loading schedule...</p>
      )}
    </div>
  );
};

export default ScheduleEditor;
