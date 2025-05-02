import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import ScheduleCalendar from './components/ScheduleCalendar.jsx';
import EventEditor from './components/EventEditor.jsx';
import WeeklySchedule from './components/WeeklySchedule.jsx';
import PrintableSchedule from './components/PrintableSchedule.jsx';
import { supabase } from './supabase/supabaseClient';

function App() {
  const [view, setView] = useState('dashboard');
  const [weekStartDates, setWeekStartDates] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [weekData, setWeekData] = useState(null);

  useEffect(() => {
    if (view === 'scheduleview' || view === 'print') loadWeekStarts();
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

    if (!error) {
      setWeekStartDates(data.map(d => d.week_start));
    }
  };

  const fetchWeekSchedule = async (weekStart) => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('week_start', weekStart)
      .maybeSingle();

    if (!error) {
      setWeekData(data);
    }
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard setView={setView} />;
      case 'login':
        return <Login setView={setView} />;
      case 'admin':
        return <AdminPanel setView={setView} />;
      case 'scheduleview':
        return weekData ? (
          <WeeklySchedule
            weekLabel={weekData.week_label}
            days={weekData.days}
            employees={weekData.employees}
            shifts={weekData.shifts}
          />
        ) : <p>Loading schedule...</p>;
      case 'print':
        return weekData ? (
          <PrintableSchedule
            weekLabel={weekData.week_label}
            days={weekData.days}
            employees={weekData.employees}
            shifts={weekData.shifts}
          />
        ) : <p>Preparing print view...</p>;
      case 'calendar':
        return <ScheduleCalendar />;
      case 'eventeditor':
        return <EventEditor />;
      default:
        return <Dashboard setView={setView} />;
    }
  };

  return (
    <div className="App">
      <Header setView={setView} />
      {renderView()}
    </div>
  );
}

export default App;
