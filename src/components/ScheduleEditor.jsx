import React, { useEffect, useState } from 'react';
import WeeklySchedule from './WeeklySchedule';
import { supabase } from '../supabase/supabaseClient';

const ScheduleEditor = () => {
  const [weekData, setWeekData] = useState(null);
  const [weekStartDates, setWeekStartDates] = useState([]);
  const [modifiedShifts, setModifiedShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');

  useEffect(() => {
    loadWeekStarts();
  }, []);

  useEffect(() => {
    if (weekStartDates.length > 0) {
      fetchWeekSchedule(weekStartDates[0]);
    }
  }, [weekStartDates]);

  const loadWeekStarts = async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('week_start')
      .order('week_start', { ascending: false });

    if (!error && data.length > 0) {
      const cleaned = data.map(d => new Date(d.week_start).toISOString().split('T')[0]);
      setWeekStartDates(cleaned);
    }
  };

  const fetchWeekSchedule = async (weekStart) => {
    setLoading(true);
    setWarning('');
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('week_start', weekStart)
      .maybeSingle();

    if (!error && data) {
      setWeekData(data);
      if (!data.days || !data.employees || !data.shifts) {
        setWarning('This week’s schedule is incomplete.');
        setModifiedShifts(data.shifts || []);
      } else {
        setModifiedShifts(data.shifts);
      }
    } else {
      setWarning('Failed to load schedule for selected week.');
    }

    setLoading(false);
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
      {loading ? (
        <p>Loading schedule...</p>
      ) : weekData ? (
        <>
          {warning && <p className="text-red-600 mb-2">{warning}</p>}
          <WeeklySchedule
            weekLabel={weekData.week_label}
            days={weekData.days || []}
            employees={weekData.employees || []}
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
        <p className="text-red-600">No schedule found for the latest week.</p>
      )}
    </div>
  );
};

export default ScheduleEditor;
