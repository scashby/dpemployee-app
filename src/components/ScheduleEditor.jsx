import React, { useEffect, useState } from 'react';
import WeeklySchedule from './WeeklySchedule';
import { supabase } from '../supabase/supabaseClient';

const ScheduleEditor = () => {
  const [weekData, setWeekData] = useState(null);
  const [modifiedShifts, setModifiedShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(null);

  useEffect(() => {
    const loadCurrentOrCreate = async () => {
      const today = new Date();
      const start = new Date(today.setDate(today.getDate() - today.getDay()));
      const isoWeekStart = start.toISOString().split('T')[0];
      setWeekStart(isoWeekStart);

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('week_start', isoWeekStart)
        .maybeSingle();

      if (!error && data) {
        setWeekData(data);
        setModifiedShifts(data.shifts || []);
      } else {
        setWeekData({
          week_start: isoWeekStart,
          week_label: `Week of ${isoWeekStart}`,
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          employees: [],
          shifts: [],
        });
        setModifiedShifts([]);
      }

      setLoading(false);
    };

    loadCurrentOrCreate();
  }, []);

  const handleShiftChange = (row, col, newValue) => {
    const updated = [...modifiedShifts];
    if (!updated[row]) updated[row] = [];
    const current = updated[row][col];
    updated[row][col] =
      typeof current === 'object'
        ? { ...current, shift: newValue }
        : { shift: newValue };
    setModifiedShifts(updated);
  };

  const handleSave = async () => {
    if (!weekData) return;

    const existing = await supabase
      .from('schedules')
      .select('id')
      .eq('week_start', weekStart)
      .maybeSingle();

    const newData = {
      ...weekData,
      shifts: modifiedShifts,
    };

    if (existing.data) {
      await supabase
        .from('schedules')
        .update(newData)
        .eq('id', existing.data.id);
    } else {
      await supabase.from('schedules').insert([newData]);
    }

    alert('Schedule saved.');
  };

  return (
    <div>
      <h3 className="text-xl font-heading mb-4">Edit Weekly Schedule</h3>
      {loading ? (
        <p>Loading schedule...</p>
      ) : (
        <>
          <WeeklySchedule
            weekLabel={weekData.week_label}
            days={weekData.days}
            employees={weekData.employees}
            shifts={modifiedShifts}
            editable={true}
            onShiftChange={handleShiftChange}
          />
          <button
            onClick={handleSave}
            className="mt-4 px-4 py-2 bg-dpblue text-white rounded hover:bg-dpdark"
          >
            Save Changes
          </button>
        </>
      )}
    </div>
  );
};

export default ScheduleEditor;
