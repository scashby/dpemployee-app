import React, { useEffect, useState } from 'react';
import WeeklySchedule from './WeeklySchedule';
import { supabase } from '../supabase/supabaseClient';

const EmployeeSchedule = ({ user }) => {
  const [weekData, setWeekData] = useState(null);
  const [employeeIndex, setEmployeeIndex] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const userEmail = user?.email;
        const empIndex = data.employees?.findIndex(e =>
          e?.toLowerCase()?.includes(userEmail?.split('@')[0]?.toLowerCase())
        );

        if (empIndex !== -1) {
          setEmployeeIndex(empIndex);
        }

        setWeekData(data);
      }
    };

    if (user) load();
  }, [user]);

  if (!user) return <p className="p-4">Please log in to view your schedule.</p>;
  if (!weekData) return <p className="p-4">Loading your schedule…</p>;
  if (employeeIndex == null) return <p className="p-4">No matching schedule found for your account.</p>;

  const shifts = [[...weekData.shifts[employeeIndex]]];
  const employees = [weekData.employees[employeeIndex]];

  return (
    <WeeklySchedule
      weekLabel={weekData.week_label}
      days={weekData.days}
      employees={employees}
      shifts={shifts}
    />
  );
};

export default EmployeeSchedule;
