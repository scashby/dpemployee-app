import { useEffect, useState } from 'react';
import { supabase } from './supabase/supabaseClient';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const AdminDashboard = () => <h2>Admin Dashboard (placeholder)</h2>;
const EmployeeDashboard = () => <Dashboard />;

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-dashboard" element={session ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/employee-dashboard" element={session ? <EmployeeDashboard /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
