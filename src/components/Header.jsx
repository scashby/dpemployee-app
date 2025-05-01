import React from 'react';

const Header = ({ setView }) => {
  return (
    <header className="bg-dpblue text-white shadow-dp px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <img
          src="/devils-purse-300x300-3766960153.png"
          alt="Devil's Purse Logo"
          className="h-12 w-12 rounded"
        />
        <div className="leading-tight">
          <h1 className="text-xl font-heading text-dpgold">Devil’s Purse</h1>
          <p className="text-sm text-dpgray font-serif">Employee Portal</p>
        </div>
      </div>
      <nav className="flex items-center space-x-4 text-sm">
        <button onClick={() => setView('dashboard')} className="hover:underline">Dashboard</button>
        <button onClick={() => setView('login')} className="hover:underline">Login</button>
        <button onClick={() => setView('admin')} className="hover:underline">Admin Panel</button>
        <button onClick={() => setView('schedule')} className="hover:underline">Schedule</button>
        <button onClick={() => setView('events')} className="hover:underline">Events</button>
      </nav>
    </header>
  );
};

export default Header;
