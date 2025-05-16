import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const linkStyle = ({ isActive }) =>
    isActive
      ? "text-gold font-bold underline"
      : "text-gray-dark hover:text-gold";

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src="/logo.png" // Path to the logo in the public folder
            alt="Devil's Purse Brewing Co."
            className="h-16 w-auto" // Adjusted size for better visibility
          />
          <h1 className="ml-4 text-xl font-serif text-black">
            Devil's Purse Brewing Co.
          </h1>
        </div>

        {/* Hamburger Menu for Mobile */}
        <button
          className="block lg:hidden text-gray-dark focus:outline-none"
          onClick={toggleMenu}
        >
          <span className="hamburger-icon">&#9776;</span> {/* Hamburger Icon */}
        </button>

        {/* Navigation Links */}
        <nav
          className={`${
            isOpen ? "block" : "hidden"
          } lg:flex lg:items-center lg:space-x-4`}
        >
          <ul className="flex flex-col lg:flex-row lg:space-x-6">
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