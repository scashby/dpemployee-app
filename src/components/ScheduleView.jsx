import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const ScheduleView = ({ user }) => {
  const [weekData, setWeekData] = useState(null);
  const [employeeIndex, setEmployeeIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      today.setDate(diff);
      today.setHours(0, 0, 0, 0);
      const monday = today.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .gte('week_start', monday)
        .order('week_start')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        let idx = null;
        if (user?.email && data.employees) {
          const nameMatch = user.email.split('@')[0].toLowerCase();
          idx = data.employees.findIndex(n =>
            n.toLowerCase().includes(nameMatch)
          );
        }
        setEmployeeIndex(idx);
        setWeekData(data);
      }

      setLoading(false);
    };

    loadSchedule();
  }, [user]);

  if (loading) return <p className="p-4">Loading schedule…</p>;
  if (!weekData || employeeIndex === null || employeeIndex === -1) return <p className="p-4">No schedule found.</p>;

  const { week_start, days, employees, shifts } = weekData;
  const emp = employees[employeeIndex];
  const shiftRow = shifts[employeeIndex];

  const start = new Date(week_start);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const label = `Week of ${start.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })} through ${end.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}`;

  return (
    <div className="p-6 font-body text-dpblue">
      <h2 className="text-xl font-heading mb-4">{label}</h2>
      <table className="min-w-full border border-gray-300">
        <thead className="bg-dpoffwhite text-sm uppercase font-semibold text-dpgray">
          <tr>
            <th className="p-2 border-b">Day</th>
            <th className="p-2 border-b">Shift</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{day}</td>
              <td className="p-2 text-center">{typeof shiftRow[i] === 'object' ? shiftRow[i].shift : shiftRow[i] || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleView;
