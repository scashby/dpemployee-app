import React from 'react';

const Header = ({ setView }) => {
  return (
    <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <img src="/logo.png" alt="Devil's Purse Logo" className="h-10" />
        <h1 className="text-xl font-heading tracking-wide">DEVIL'S PURSE BREWING CO.</h1>
      </div>
      <nav className="space-x-6 font-body text-dpblue">
        <button onClick={() => setView('dashboard')}>Dashboard</button>
        <button onClick={() => setView('admin')}>Admin Panel</button>
        <button onClick={() => setView('scheduleview')}>Schedule</button>
        <button onClick={() => setView('events')}>Events</button>
      </nav>
    </header>
  );
};

export default Header;
