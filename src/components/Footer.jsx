import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-light text-center py-4">
      <p className="text-sm text-gray-dark">
        © {new Date().getFullYear()} Devil's Purse Brewing Co. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;