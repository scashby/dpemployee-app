import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const ScheduleView = () => {
  const [weekData, setWeekData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchedule = async () => {
      const today = new Date();
      const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1));
      monday.setHours(0, 0, 0, 0);
      const isoMonday = monday.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('week_start', isoMonday)
        .maybeSingle();

      if (!error && data) {
        setWeekData(data);
      }

      setLoading(false);
    };

    loadSchedule();
  }, []);

  if (loading) return <div className="p-6">Loading schedule...</div>;
  if (!weekData) return <div className="p-6">No schedule found for this week.</div>;

  const start = new Date(weekData.week_start);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const label = `Week of ${start.toLocaleDateString()} through ${end.toLocaleDateString()}`;

  return (
    <div className="p-6 font-body text-dpblue">
      <h2 className="text-xl font-heading mb-2">{label}</h2>
      <table className="min-w-full border border-gray-300 mb-4">
        <thead className="bg-dpoffwhite text-sm uppercase font-semibold text-dpgray">
          <tr>
            <th className="p-2 border-b text-left">Employee</th>
            {weekData.days.map((day, i) => (
              <th key={i} className="p-2 border-b text-center">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weekData.employees.map((emp, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{emp}</td>
              {weekData.days.map((_, j) => (
                <td key={j} className="p-2 text-center">
                  {weekData.shifts[i]?.[j]?.shift || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleView;
