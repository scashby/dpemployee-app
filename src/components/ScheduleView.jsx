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

  const handleDownload = () => {
    const start = new Date(weekData.week_start);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const label = `Week of ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    const employeeName = weekData.employees[employeeIndex];
    const rows = weekData.days.map((day, i) => {
      const shift = weekData.shifts[employeeIndex][i];
      const value = typeof shift === 'object' ? shift?.shift : shift || '-';
      return `${day},${value}`;
    });

    const blob = new Blob(
      [`Schedule for ${employeeName}\n${label}\n\nDay,Shift\n${rows.join('\n')}`],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${employeeName}_schedule.txt`;
    link.click();
  };

  if (loading) return <p className="p-6">Loading schedule…</p>;
  if (!weekData) return <p className="p-6">No schedule found.</p>;

  const start = new Date(weekData.week_start);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const label = `Week of ${start.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })} through ${end.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}`;

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
      {employeeIndex !== null && employeeIndex >= 0 && (
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-dpblue text-white rounded hover:bg-dpdark"
        >
          Download My Schedule
        </button>
      )}
    </div>
  );
};

export default ScheduleView;
