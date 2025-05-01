import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-dpblue text-white shadow-dp px-6 py-4 flex items-center justify-between">
      {/* Left: Logo and title */}
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

      {/* Right: Nav links (optional) */}
      <nav className="flex items-center space-x-6 text-sm">
        <Link to="/employee-dashboard" className="hover:underline">Dashboard</Link>
        <Link to="/admin/schedule" className="hover:underline">Admin</Link>
        <Link to="/login" className="text-dpgold font-bold hover:underline">Logout</Link>
      </nav>
    </header>
  );
};

export default Header;
