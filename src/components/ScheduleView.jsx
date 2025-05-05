import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const ScheduleView = () => {
  const [scheduleData, setScheduleData] = useState([]);
  const [weekStart, setWeekStart] = useState(null);

  useEffect(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay()); // Sunday
    setWeekStart(start);

    const isoDate = start.toISOString().split('T')[0];
    console.log('Querying week_start:', isoDate);

    supabase
      .from('schedules')
      .select('*')
      .eq('week_start', isoDate)
      .then(({ data, error }) => {
        if (error) {
          console.error('Supabase error:', error.message);
          setScheduleData([]);
        } else {
          console.log('Fetched:', data);
          setScheduleData(data || []);
        }
      });
  }, []);

  const getUniqueEmployees = () => {
    const names = new Set(scheduleData.map(row => row.employee_name));
    return names.size > 0 ? [...names] : [''];
  };

  const getShift = (employee, day) => {
    const match = scheduleData.find(
      row => row.employee_name === employee && row.day === day
    );
    return match ? match.shift : '';
  };

  const renderTable = () => {
    const employees = getUniqueEmployees();
    const start = weekStart || new Date();
    const dateLabels = [...Array(7)].map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return `${dayLabels[i]} ${d.toLocaleDateString(undefined, {
        month: '2-digit',
        day: '2-digit',
      })}`;
    });

    return (
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full text-sm border border-gray-300 text-center font-body">
          <thead className="bg-gray-100 text-dpgray uppercase text-xs">
            <tr>
              <th className="px-3 py-2 border">Employee</th>
              {dateLabels.map((label, i) => (
                <th key={i} className="px-3 py-2 border">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, i) => (
              <tr key={i}>
                <td className="border px-3 py-2 text-left font-medium">
                  {employee || '—'}
                </td>
                {dayLabels.map((day, j) => (
                  <td key={j} className="border px-2 py-2">
                    {getShift(employee, day)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {scheduleData.length === 0 && (
          <p className="text-sm italic text-dpblue mt-4">No shifts assigned for this week.</p>
        )}
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