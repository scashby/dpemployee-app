import React, { useEffect, useState } from 'react';
import WeeklySchedule from './WeeklySchedule';
import { supabase } from '../supabase/supabaseClient';

const EmployeeSchedule = ({ user }) => {
  const [weekData, setWeekData] = useState(null);
  const [employeeIndex, setEmployeeIndex] = useState(null);

  useEffect(() => {
    const load = async () => {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      today.setDate(diff);
      today.setHours(0, 0, 0, 0);
      const mondayISO = today.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('week_start', mondayISO)
        .maybeSingle();

      if (!error && data) {
        let matchIndex = null;

        if (user?.email) {
          const username = user.email.split('@')[0].toLowerCase();
          matchIndex = data.employees.findIndex(name =>
            name?.toLowerCase()?.includes(username)
          );
        }

        setWeekData(data);
        setEmployeeIndex(matchIndex);
      }
    };

    load();
  }, [user]);

  if (!weekData) return <p className="p-4">Loading schedule…</p>;
  if (employeeIndex === null || employeeIndex === -1)
    return <p className="p-4">No matching schedule found for your login.</p>;

  const shifts = [[...weekData.shifts[employeeIndex]]];
  const employees = [weekData.employees[employeeIndex]];

  const start = new Date(weekData.week_start);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const label = `Week of ${start.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })} through ${end.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}`;

  return (
    <WeeklySchedule
      weekLabel={label}
      days={weekData.days}
      employees={employees}
      shifts={shifts}
    />
  );
};

export default EmployeeSchedule;
