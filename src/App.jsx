import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Announcements from "./pages/Announcements";
import Schedule from "./pages/Schedule";
import Employees from "./pages/Employees";
import Events from "./pages/Events";
import Links from "./pages/Links";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout pageTitle="Announcements - Devil's Purse Brewing Co. Employee Portal">
              <Announcements />
            </Layout>
          }
        />
        <Route
          path="/schedule"
          element={
            <Layout pageTitle="Schedule - Devil's Purse Brewing Co. Employee Portal">
              <Schedule />
            </Layout>
          }
        />
        <Route
          path="/employees"
          element={
            <Layout pageTitle="Employees - Devil's Purse Brewing Co. Employee Portal">
              <Employees />
            </Layout>
          }
        />
        <Route
          path="/events"
          element={
            <Layout pageTitle="Events - Devil's Purse Brewing Co. Employee Portal">
              <Events />
            </Layout>
          }
        />
        <Route
          path="/links"
          element={
            <Layout pageTitle="Links - Devil's Purse Brewing Co. Employee Portal">
              <Links />
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;