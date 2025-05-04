import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const ScheduleView = () => {
  const [schedule, setSchedule] = useState(null);
  const [weekStart, setWeekStart] = useState(null);

  useEffect(() => {
    const fetchWeek = async () => {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay()); // Sunday
      const isoDate = start.toISOString().split('T')[0];
      setWeekStart(start);

      console.log('Fetching week_start:', isoDate);

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('week_start', isoDate)
        .single();

      if (error) {
        console.error('Supabase fetch error:', error.message);
      } else {
        console.log('Schedule loaded:', data);
        setSchedule(data);
      }
    };

    fetchWeek();
  }, []);

  const renderTable = () => {
    if (!schedule) return <p className="text-dpblue mt-4">No schedule available.</p>;

    const start = new Date(schedule.week_start);
    const dates = [...Array(7)].map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return `${dayLabels[i]} ${d.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}`;
    });

    return (
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full text-sm border border-gray-300 text-center font-body">
          <thead className="bg-gray-100 text-dpgray uppercase text-xs">
            <tr>
              <th className="px-3 py-2 border">Employee</th>
              {dates.map((label, i) => (
                <th key={i} className="px-3 py-2 border">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.employees.map((emp, i) => (
              <tr key={i}>
                <td className="border px-3 py-2 font-medium text-left">{emp}</td>
                {schedule.days.map((_, dayIndex) => (
                  <td key={dayIndex} className="border px-2 py-2">
                    {schedule.shifts[i][dayIndex]?.shift || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 text-dpblue">
      <h2 className="text-xl font-heading font-semibold mb-2">Weekly Schedule</h2>
      {renderTable()}
    </div>
  );
};

export default ScheduleView;
