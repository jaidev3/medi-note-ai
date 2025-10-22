import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

const Layout: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <div className="bg-gray-50">
      <Navbar onMenuToggle={handleMenuToggle} isDrawerOpen={isDrawerOpen} />
      <Outlet />
    </div>
  );
};

export default Layout;
