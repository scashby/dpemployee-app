import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Announcements from "./pages/Announcements";
import Schedule from "./pages/Schedule";
import Employees from "./pages/Employees";
import Events from "./pages/Events";
import Links from "./pages/Links";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Announcements />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/events" element={<Events />} />
        <Route path="/links" element={<Links />} />

        {/* Fallback for undefined routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;