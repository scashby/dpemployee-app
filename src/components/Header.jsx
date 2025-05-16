import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";

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
    <header className="bg-white shadow-md relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
        {/* Logo and Title wrapped in a Link to Home */}
        <Link to="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="Devil's Purse Brewing Co."
            className="h-16 w-auto" // Adjusted for better visibility
          />
          <h1 className="ml-4 text-xl font-serif text-black">
            Devil's Purse Brewing Co. <span className="font-normal">Employee Portal</span>
          </h1>
        </Link>

        {/* Hamburger Button */}
        <button
          className="text-gray-dark focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle Navigation"
        >
          <span className="hamburger-icon text-2xl">&#9776;</span> {/* Hamburger Icon */}
        </button>

        {/* Dropdown Navigation Menu */}
        {isOpen && (
          <nav
            className="absolute top-full right-4 mt-2 w-48 bg-white shadow-lg rounded-md z-10"
            onClick={closeMenu} // Close menu when clicking inside
          >
            <ul className="flex flex-col p-2">
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
        )}
      </div>
    </header>
  );
};

export default Header;