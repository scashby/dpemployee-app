import React from "react";
import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children, pageTitle }) => {
  React.useEffect(() => {
    document.title = pageTitle || "Devil's Purse Brewing Co. Employee Portal";
  }, [pageTitle]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-6 lg:p-8">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;