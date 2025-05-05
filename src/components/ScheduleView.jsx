import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const ScheduleView = () => {
  const [scheduleData, setScheduleData] = useState([]);
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return start;
  });

  useEffect(() => {
    const isoDate = weekStart.toISOString().split('T')[0];

    supabase
      .from('schedules')
      .select('*')
      .eq('week_start', isoDate)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching schedule:', error.message);
          setScheduleData([]);
        } else {
          setScheduleData(data || []);
        }
      });
  }, [weekStart]);

  const changeWeek = (offsetDays) => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + offsetDays);
    setWeekStart(newStart);
  };

  const getWeekLabel = () => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    return `Week of ${weekStart.toLocaleDateString(undefined, {
      month: '2-digit',
      day: '2-digit',
    })} through ${end.toLocaleDateString(undefined, {
      month: '2-digit',
      day: '2-digit',
    })}`;
  };

  const getUniqueEmployees = () => {
    const names = new Set(scheduleData.map(row => row.employee_name));
    return names.size > 0 ? [...names] : [''];
  };

  const getShifts = (employee, day) => {
    return scheduleData.filter(row => row.employee_name === employee && row.day === day);
  };

  const getDateLabels = () => {
    return [...Array(7)].map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return `${dayLabels[i]} ${d.toLocaleDateString(undefined, {
        month: '2-digit',
        day: '2-digit',
      })}`;
    });
  };

  return (
    <div className="p-6 text-dpblue">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading font-semibold">Schedule</h2>
        <div className="space-x-2">
          <button onClick={() => changeWeek(-7)} className="border px-3 py-1 rounded">
            ← Previous
          </button>
          <button onClick={() => changeWeek(7)} className="border px-3 py-1 rounded">
            Next →
          </button>
        </div>
      </div>

      <h3 className="text-lg font-body mb-2">{getWeekLabel()}</h3>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm font-body text-center">
          <thead className="bg-gray-100 text-xs uppercase text-dpgray">
            <tr>
              <th className="px-3 py-2 border">Employee</th>
              {getDateLabels().map((label, i) => (
                <th key={i} className="px-3 py-2 border">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getUniqueEmployees().map((employee, i) => (
              <tr key={i}>
                <td className="border px-3 py-2 text-left font-medium">
                  {employee || '—'}
                </td>
                {dayLabels.map((day, j) => (
                  <td key={j} className="border px-2 py-2 space-y-1">
                    {getShifts(employee, day).map((shift, k) => (
                      <div
                        key={k}
                        className={`rounded px-2 py-1 text-white text-xs ${
                          shift.event_type === 'offsite'
                            ? 'bg-blue-500'
                            : shift.event_type === 'tasting'
                            ? 'bg-green-500'
                            : 'bg-gray-500'
                        }`}
                      >
                        <div className="font-semibold">{shift.event_name || shift.shift}</div>
                        <div>{shift.shift}</div>
                      </div>
                    ))}
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

      <div className="mt-6 text-sm text-right">
        <button className="underline text-blue-600 hover:text-blue-800">
          Download Personal Schedule
        </button>
      </div>
    </div>
  );
};

export default ScheduleView;