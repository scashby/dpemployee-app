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
  const [weekStartDates, setWeekStartDates] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [weekData, setWeekData] = useState(null);

  useEffect(() => {
    if (view === 'scheduleview') loadWeekStarts();
  }, [view]);

  useEffect(() => {
    if (weekStartDates.length > 0) {
      fetchWeekSchedule(weekStartDates[currentIndex]);
    }
  }, [currentIndex, weekStartDates]);

  const loadWeekStarts = async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('week_start')
      .order('week_start', { ascending: false });

    if (error) {
      console.error("Week start fetch error:", error);
      return;
    }

    const unique = [...new Set(data.map(d => d.week_start))];
    setWeekStartDates(unique);
    setCurrentIndex(0);
  };

  const fetchWeekSchedule = async (weekStart) => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('week_start', weekStart)
      .order('employee_name', { ascending: true })
      .order('date', { ascending: true });

    if (error) {
      console.error("Schedule fetch error:", error);
      return;
    }

    const dates = [...new Set(data.map(e => e.date))].sort();
    const days = dates.map(d => new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', month: '2-digit', day: '2-digit'
    }));
    const employees = [...new Set(data.map(e => e.employee_name))].sort();
    const shifts = employees.map(name =>
      dates.map(date => {
        const match = data.find(d => d.employee_name === name && d.date === date);
        return match ? match.shift : "";
      })
    );

    setWeekData({
      weekLabel: `${days[0]} – ${days[days.length - 1]}`,
      days,
      employees,
      shifts
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
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setCurrentIndex(Math.min(currentIndex + 1, weekStartDates.length - 1))}
                className="px-4 py-2 bg-dpgray text-white rounded disabled:opacity-40"
                disabled={currentIndex >= weekStartDates.length - 1}
              >
                Previous Week
              </button>
              <button
                onClick={() => setCurrentIndex(Math.max(currentIndex - 1, 0))}
                className="px-4 py-2 bg-dpblue text-white rounded disabled:opacity-40"
                disabled={currentIndex === 0}
              >
                Next Week
              </button>
            </div>
            {weekData ? (
              <WeeklySchedule
                weekLabel={weekData.weekLabel}
                days={weekData.days}
                employees={weekData.employees}
                shifts={weekData.shifts}
              />
            ) : (
              <p className="p-4 text-dpgray">Loading schedule...</p>
            )}
          </div>
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
