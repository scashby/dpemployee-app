import React from 'react';

const Header = () => {
  return (
    <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <img src="/logo.png" alt="Devil's Purse Logo" className="h-10" />
        <h1 className="text-xl font-heading tracking-wide">DEVIL'S PURSE BREWING CO.</h1>
      </div>
    </header>
  );
};

export default Header;
