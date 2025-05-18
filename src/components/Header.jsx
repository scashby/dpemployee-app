import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const linkStyle = ({ isActive }) =>
    isActive
      ? "block text-gold font-bold underline py-2"
      : "block text-gray-dark hover:text-gold py-2";

  return (
    <header className="bg-white shadow-md relative w-full">
      <div className="w-full flex items-center justify-between px-4 py-4 relative">
        {/* Logo on the far left */}
        <Link to="/" className="flex-shrink-0 flex items-center">
          <img
            src="/logo.png"
            alt="Devil's Purse Brewing Co."
            className="h-16 w-auto"
          />
        </Link>

        {/* Title absolutely centered */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <h1 className="text-xl font-serif text-black whitespace-nowrap">
            Devil's Purse Brewing Co. <span className="font-normal">Employee Portal</span>
          </h1>
        </div>

        {/* Hamburger Button on the far right */}
        <button
          className="flex-shrink-0 text-gray-dark focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle Navigation"
        >
          <span className="hamburger-icon text-2xl">&#9776;</span>
        </button>

        {/* Dropdown Navigation Menu */}
        {isOpen && (
          <nav
            className="absolute top-full right-4 mt-2 w-48 bg-white shadow-lg rounded-md z-10"
            onClick={closeMenu}
          >
            <ul className="flex flex-col p-2">
              <li>
                <NavLink to="/" className={linkStyle} end>
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