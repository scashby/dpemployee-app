import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const ScheduleView = () => {
  const [weekData, setWeekData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      const today = new Date();
      const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1));
      const iso = monday.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('week_start', iso)
        .maybeSingle();

      if (error) {
        console.error('Error fetching schedule:', error);
        setLoading(false);
        return;
      }

      setWeekData(data);
      setLoading(false);
    };

    fetchSchedule();
  }, []);

  if (loading) return <div className="p-6">Loading schedule...</div>;
  if (!weekData) return <div className="p-6">No schedule found for this week.</div>;

  const start = new Date(weekData.week_start);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const label = `Week of ${start.toLocaleDateString()} through ${end.toLocaleDateString()}`;

  return (
    <div className="p-6 font-body text-dpblue">
      <h2 className="text-xl font-heading mb-4">{label}</h2>
      <table className="w-full border border-gray-300 text-sm">
        <thead className="bg-dpoffwhite text-xs uppercase text-dpgray">
          <tr>
            <th className="border px-2 py-1 text-left">Employee</th>
            {weekData.days.map((day, i) => (
              <th key={i} className="border px-2 py-1">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weekData.employees.map((emp, i) => (
            <tr key={i}>
              <td className="border px-2 py-1">{emp}</td>
              {weekData.days.map((_, j) => (
                <td key={j} className="border px-2 py-1 text-center">
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
