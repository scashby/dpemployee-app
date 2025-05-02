import React, { useEffect, useState } from 'react';
import WeeklySchedule from './WeeklySchedule';
import { supabase } from '../supabase/supabaseClient';

const ScheduleEditor = () => {
  const [weekData, setWeekData] = useState(null);
  const [weekStartDates, setWeekStartDates] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modifiedShifts, setModifiedShifts] = useState([]);

  useEffect(() => {
    loadWeekStarts();
  }, []);

  useEffect(() => {
    if (weekStartDates.length > 0) {
      fetchWeekSchedule(weekStartDates[currentIndex]);
    }
  }, [weekStartDates, currentIndex]);

  const loadWeekStarts = async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('week_start')
      .order('week_start', { ascending: false });

    if (!error) {
      setWeekStartDates(data.map(d => d.week_start));
    }
  };

  const fetchWeekSchedule = async (weekStart) => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('week_start', weekStart)
      .maybeSingle();

    if (!error && data) {
      setWeekData(data);
      setModifiedShifts(data.shifts); // Create editable copy
    }
  };

  const handleShiftChange = (row, col, newValue) => {
    const updated = [...modifiedShifts];
    const current = updated[row][col];
    updated[row][col] =
      typeof current === 'object'
        ? { ...current, shift: newValue }
        : { shift: newValue };
    setModifiedShifts(updated);
  };

  const handleSave = async () => {
    if (!weekData) return;
    const { error } = await supabase
      .from('schedules')
      .update({ shifts: modifiedShifts })
      .eq('id', weekData.id);

    if (error) {
      alert('Failed to save schedule.');
    } else {
      alert('Schedule updated.');
      setWeekData({ ...weekData, shifts: modifiedShifts });
    }
  };

  return (
    <div>
      <h3 className="text-xl font-heading mb-4">Edit Weekly Schedule</h3>
      {weekData ? (
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
      ) : (
        <p>Loading schedule for editing...</p>
      )}
    </div>
  );
};

export default ScheduleEditor;
