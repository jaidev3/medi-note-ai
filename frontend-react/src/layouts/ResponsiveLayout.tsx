import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import ResponsiveNavbar from "@/components/Navbar";
import MobileNavigation from "@/components/navigation/MobileNavigation";

const DRAWER_WIDTH = 280;

const ResponsiveLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [isDrawerOpen, setIsDrawerOpen] = useState(!isMobile);
  const location = useLocation();

  // Close drawer on mobile when route changes
  React.useEffect(() => {
    if (isMobile) {
      setIsDrawerOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* App Bar */}
      <ResponsiveNavbar
        onMenuToggle={handleDrawerToggle}
        isDrawerOpen={isDrawerOpen}
      />

      {/* Navigation Drawer */}
      <MobileNavigation open={isDrawerOpen} onClose={handleDrawerClose} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${isDrawerOpen ? DRAWER_WIDTH : 0}px)` },
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(isDrawerOpen && {
            transition: theme.transitions.create(["width", "margin"], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
        }}
      >
        {/* Add top padding to account for fixed AppBar */}
        <Box
          sx={{
            height: { xs: 56, sm: 64 },
            flexGrow: 0,
          }}
        />
        <Outlet />
      </Box>
    </Box>
  );
};

export default ResponsiveLayout;