import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import ScheduleCalendar from './components/ScheduleCalendar.jsx';
import EventEditor from './components/EventEditor.jsx';
import WeeklySchedule from './components/WeeklySchedule.jsx';
import { supabase } from './supabase/supabaseClient';

function App() {
  const [view, setView] = useState('dashboard');
  const [weekData, setWeekData] = useState(null);

  useEffect(() => {
    if (view === 'scheduleview') {
      fetchSchedule();
    }
  }, [view]);

  const fetchSchedule = async () => {
    const result = await supabase
      .from('schedules')
      .select('*')
      .order('employee_name', { ascending: true })
      .order('date', { ascending: true });

    console.log("Supabase result:", result);

    if (result.error) {
      console.error("Supabase fetch error:", result.error);
      return;
    }

    const data = result.data;

    const uniqueDates = [...new Set(data.map(entry => entry.date))].sort();
    const dayLabels = uniqueDates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit' });
    });

    const employeeNames = [...new Set(data.map(entry => entry.employee_name))].sort();

    const shifts = employeeNames.map(name => {
      return uniqueDates.map(date => {
        const shift = data.find(entry => entry.employee_name === name && entry.date === date);
        return shift ? shift.shift : "";
      });
    });

    setWeekData({
      weekLabel: `${dayLabels[0]} – ${dayLabels[dayLabels.length - 1]}`,
      days: dayLabels,
      employees: employeeNames,
      shifts: shifts
    });
  };

  const renderView = () => {
    switch (view) {
      case 'login':
        return <Login />;
      case 'admin':
        return <AdminPanel />;
      case 'schedule':
        return <ScheduleCalendar />;
      case 'scheduleview':
        return weekData &&
          weekData.days &&
          weekData.employees &&
          weekData.shifts ? (
          <WeeklySchedule
            weekLabel={weekData.weekLabel}
            days={weekData.days}
            employees={weekData.employees}
            shifts={weekData.shifts}
          />
        ) : (
          <p className="p-4 text-dpgray">Loading schedule...</p>
        );
      case 'events':
        return <EventEditor />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Header setView={setView} />
      <main className="p-4">
        {renderView()}
      </main>
    </>
  );
}

export default App;
