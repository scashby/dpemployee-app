import React from 'react';

const Header = ({ onNavigate }) => {
  return (
    <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-4 cursor-pointer" onClick={() => onNavigate('dashboard')}>
        <img src="/logo.png" alt="Devil's Purse Logo" className="h-10 w-auto object-contain" />
        <h1 className="text-xl font-bold tracking-wide text-dpblue">DEVIL'S PURSE BREWING CO.</h1>
      </div>
      <nav className="space-x-6 text-dpblue font-body text-sm">
        <button onClick={() => onNavigate('dashboard')} className="hover:underline">Dashboard</button>
        <button onClick={() => onNavigate('admin')} className="hover:underline">Admin Panel</button>
        <button onClick={() => onNavigate('schedule')} className="hover:underline">Schedule</button>
        <button onClick={() => onNavigate('events')} className="hover:underline">Events</button>
      </nav>
    </header>
  );
};

export default Header;
