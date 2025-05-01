import { useEffect, useState } from 'react';
import { supabase } from './supabase/supabaseClient';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EventsCalendar from './components/EventsCalendar.jsx';
import ScheduleCalendar from './components/ScheduleCalendar.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import AdminOnly from './components/AdminOnly.jsx';
import Header from './components/Header.jsx';

const AdminDashboard = () => <h2 className="text-center p-6">Admin Dashboard (placeholder)</h2>;
const EmployeeDashboard = () => <Dashboard />;
const TestPage = () => <h2 className="text-center p-6 text-green-700">✅ App is rendering. This is a test route.</h2>;

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-dashboard" element={session ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/employee-dashboard" element={session ? <EmployeeDashboard /> : <Navigate to="/login" />} />
        <Route path="/events-calendar" element={session ? <EventsCalendar /> : <Navigate to="/login" />} />
        <Route
          path="/admin/schedule"
          element={
            session ? (
              <AdminOnly>
                <ScheduleCalendar />
              </AdminOnly>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin/*"
          element={
            session ? (
              <AdminOnly>
                <AdminPanel />
              </AdminOnly>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/test" element={<TestPage />} />
      </Routes>
    </Router>
  );
}

export default App;