import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const linkStyle = ({ isActive }) =>
    isActive
      ? "block text-gold font-bold underline py-2"
      : "block text-gray-dark hover:text-gold py-2";

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src="/logo.png" 
            alt="Devil's Purse Brewing Co."
            className="h-16 w-auto" // Adjusted for better visibility
          />
          <h1 className="ml-4 text-xl font-serif text-black">
            Devil's Purse Brewing Co.
          </h1>
        </div>

        {/* Hamburger Button */}
        <button
          className="text-gray-dark focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle Navigation"
        >
          <span className="hamburger-icon text-2xl">&#9776;</span> {/* Hamburger Icon */}
        </button>
      </div>

      {/* Dropdown Navigation Menu */}
      {isOpen && (
        <nav className="bg-white shadow-md">
          <ul className="flex flex-col items-start p-4 space-y-2">
            <li>
              <NavLink to="/" className={linkStyle} onClick={closeMenu}>
                Announcements
              </NavLink>
            </li>
            <li>
              <NavLink to="/schedule" className={linkStyle} onClick={closeMenu}>
                Schedule
              </NavLink>
            </li>
            <li>
              <NavLink to="/employees" className={linkStyle} onClick={closeMenu}>
                Employees
              </NavLink>
            </li>
            <li>
              <NavLink to="/events" className={linkStyle} onClick={closeMenu}>
                Events
              </NavLink>
            </li>
            <li>
              <NavLink to="/links" className={linkStyle} onClick={closeMenu}>
                Links
              </NavLink>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Header;