import React, { useState } from 'react';
import Header from './components/Header.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import ScheduleCalendar from './components/ScheduleCalendar.jsx';
import EventEditor from './components/EventEditor.jsx';
import WeeklySchedule from './components/WeeklySchedule.jsx';

// Example static data for development; replace with Supabase hook later
const sampleWeekData = {
  weekLabel: "428–54",
  days: ["Mon 04/28", "Tue 04/29", "Wed 04/30", "Thu 05/01", "Fri 05/02", "Sat 05/03", "Sun 05/04"],
  employees: ["Brandon", "Katie", "Stephen", "Brendan", "Matt L.", "Justin", "Matt Ross", "Ann R"],
  shifts: [
    ["", "", "11-Close", "11-Close", "11-Close", "TDB", "TDB"],
    ["", "", "", "", "11-Close", "", ""],
    ["", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""]
  ]
};

function App() {
  const [view, setView] = useState('dashboard');

  const renderView = () => {
    switch (view) {
      case 'login':
        return <Login />;
      case 'admin':
        return <AdminPanel />;
      case 'schedule':
        return <ScheduleCalendar />;
      case 'scheduleview':
        return sampleWeekData &&
          sampleWeekData.days &&
          sampleWeekData.employees &&
          sampleWeekData.shifts ? (
          <WeeklySchedule
            weekLabel={sampleWeekData.weekLabel}
            days={sampleWeekData.days}
            employees={sampleWeekData.employees}
            shifts={sampleWeekData.shifts}
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
