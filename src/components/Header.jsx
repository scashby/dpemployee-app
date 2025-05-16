import React from "react";
import { NavLink } from "react-router-dom";

const Header = () => {
  const linkStyle = ({ isActive }) =>
    isActive
      ? "text-gold font-bold underline"
      : "text-gray-dark hover:text-gold";

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
        {/* Logo */}
        <img
          src="/logo.png" // Assuming the logo is named "logo.png" in the public folder
          alt="Devil's Purse Brewing Co."
          className="h-10"
        />

        {/* Navigation */}
        <nav>
          <ul className="flex space-x-4">
            <li>
              <NavLink to="/" className={linkStyle}>
                Announcements
              </NavLink>
            </li>
            <li>
              <NavLink to="/schedule" className={linkStyle}>
                Schedule
              </NavLink>
            </li>
            <li>
              <NavLink to="/employees" className={linkStyle}>
                Employees
              </NavLink>
            </li>
            <li>
              <NavLink to="/events" className={linkStyle}>
                Events
              </NavLink>
            </li>
            <li>
              <NavLink to="/links" className={linkStyle}>
                Links
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;