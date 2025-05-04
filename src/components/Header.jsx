import React from 'react';

const Header = ({ onNavigate }) => {
  return (
    <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-4 cursor-pointer" onClick={() => onNavigate('dashboard')}>
        <img src="/logo.png" alt="Devil's Purse Logo" className="h-10" />
        <h1 className="text-xl font-heading tracking-wide">DEVIL'S PURSE BREWING CO.</h1>
      </div>
      <div className="space-x-4 text-dpblue font-body text-sm">
        <button onClick={() => onNavigate('schedule')} className="hover:underline">Schedule</button>
        <button onClick={() => onNavigate('admin')} className="hover:underline">Admin</button>
      </div>
    </header>
  );
};

export default Header;
