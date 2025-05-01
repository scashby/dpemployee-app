import React from 'react';

const Header = ({ setView }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between font-heading">
      <div className="flex items-center space-x-4">
        <img
          src="/devils-purse-300x300-3766960153.png"
          alt="Devil's Purse Logo"
          className="h-14 w-14 rounded-sm"
        />
        <div className="text-dpblue text-xl font-semibold tracking-wider uppercase">
          Devil's Purse Brewing Co.
        </div>
      </div>
      <nav className="flex items-center space-x-6 text-sm font-medium text-dpgray">
        <button onClick={() => setView('dashboard')} className="hover:text-dpgold transition">Dashboard</button>
        <button onClick={() => setView('login')} className="hover:text-dpgold transition">Login</button>
        <button onClick={() => setView('admin')} className="hover:text-dpgold transition">Admin Panel</button>
        <button onClick={() => setView('schedule')} className="hover:text-dpgold transition">Schedule</button>
        <button onClick={() => setView('events')} className="hover:text-dpgold transition">Events</button>
      </nav>
    </header>
  );
};

export default Header;
