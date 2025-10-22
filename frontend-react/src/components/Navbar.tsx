import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Button,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  AccountCircle,
  Settings,
  Logout,
  Notifications,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthModals } from "../contexts/AuthModalsContext";
import Logo from "./Logo";

interface ResponsiveNavbarProps {
  onMenuToggle: () => void;
  isDrawerOpen: boolean;
}

const ResponsiveNavbar: React.FC<ResponsiveNavbarProps> = ({
  onMenuToggle,
  isDrawerOpen,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { openLoginModal, openSignupModal } = useAuthModals();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchor(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleProfileMenuClose();
  };

  const handleLogout = async () => {
    await logout();
    handleProfileMenuClose();
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* Menu button for mobile */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={onMenuToggle}
            edge="start"
            sx={{
              mr: 2,
              ...(isDrawerOpen && { display: "none" }),
            }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo and brand */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            flexGrow: 1,
          }}
          onClick={handleLogoClick}
        >
          <Box sx={{ mr: { xs: 1.5, sm: 2 } }}>
            <Logo width={36} height={36} aria-hidden={false} />
          </Box>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
              display: { xs: "none", sm: "block" },
            }}
          >
            MediNote AI
          </Typography>
        </Box>

        {/* Right side actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {loading ? null : isAuthenticated ? (
            <>
              {/* Notifications (for authenticated users) */}
              <IconButton
                size="large"
                aria-label="show notifications"
                color="inherit"
                onClick={handleNotificationMenuOpen}
                sx={{ display: { xs: "none", sm: "flex" } }}
              >
                <Badge badgeContent={0} color="error">
                  <Notifications />
                </Badge>
              </IconButton>

              {/* User account menu */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  px: 1,
                  py: 0.5,
                  borderRadius: 2,
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
                onClick={handleProfileMenuOpen}
              >
                {!isMobile && (
                  <Box sx={{ mr: 1.5, textAlign: "right" }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, lineHeight: 1.2 }}
                    >
                      {user?.name || "My Account"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ lineHeight: 1.2 }}
                    >
                      {user?.email}
                    </Typography>
                  </Box>
                )}
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: theme.palette.primary.main,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || <AccountCircle />}
                </Avatar>
              </Box>

              {/* Profile menu */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                onClick={handleProfileMenuClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem onClick={() => handleNavigate("/dashboard")}>
                  <ListItemIcon>
                    <AccountCircle fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Dashboard</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleNavigate("/settings")}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>

              {/* Notification menu */}
              <Menu
                anchorEl={notificationAnchor}
                open={Boolean(notificationAnchor)}
                onClose={handleNotificationMenuClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    mt: 1.5,
                    minWidth: 300,
                    maxWidth: 400,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <Box sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No new notifications
                  </Typography>
                </Box>
              </Menu>
            </>
          ) : (
            /* Authentication buttons for non-authenticated users */
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.5, sm: 1.5 },
                ml: { xs: 0.5, sm: 0 }
              }}
            >
              {/* Login button - outline style with hover effects */}
              <Button
                onClick={openLoginModal}
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                sx={{
                  fontWeight: 600,
                  minWidth: { xs: 60, sm: 85 },
                  px: { xs: 1.5, sm: 2.5 },
                  py: { xs: 0.5, sm: 0.75 },
                  borderRadius: { xs: 1, sm: 2 },
                  border: `2px solid ${theme.palette.primary.main}`,
                  color: theme.palette.primary.main,
                  backgroundColor: "transparent",
                  transition: "all 0.3s ease-in-out",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  "&:hover": {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    transform: { xs: "none", sm: "translateY(-2px)" },
                    boxShadow: theme.shadows[4],
                    border: `2px solid ${theme.palette.primary.main}`,
                  },
                  "&:active": {
                    transform: { xs: "none", sm: "translateY(0)" },
                  },
                }}
              >
                {isMobile ? "Login" : "Log in"}
              </Button>

              {/* Signup button - gradient background with modern effects */}
              <Button
                onClick={openSignupModal}
                variant="contained"
                size={isMobile ? "small" : "medium"}
                sx={{
                  fontWeight: 700,
                  minWidth: { xs: 65, sm: 90 },
                  px: { xs: 1.5, sm: 2.5 },
                  py: { xs: 0.5, sm: 0.75 },
                  borderRadius: { xs: 1, sm: 2 },
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: theme.palette.primary.contrastText,
                  transition: "all 0.3s ease-in-out",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  boxShadow: theme.shadows[2],
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                    opacity: 0,
                    transition: "opacity 0.3s ease-in-out",
                  },
                  "&:hover": {
                    transform: { xs: "none", sm: "translateY(-2px)" },
                    boxShadow: theme.shadows[6],
                    "&::before": {
                      opacity: 1,
                    },
                  },
                  "&:active": {
                    transform: { xs: "none", sm: "translateY(0)" },
                  },
                }}
              >
                {isMobile ? "Signup" : "Sign up"}
              </Button>

              {/* Add subtle glow effect on desktop */}
              {!isMobile && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "-50%",
                    right: "10%",
                    width: 150,
                    height: 150,
                    background: `radial-gradient(circle, ${theme.palette.primary.light}20 0%, transparent 70%)`,
                    pointerEvents: "none",
                    animation: "pulse 3s ease-in-out infinite",
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 0.5, transform: "scale(1)" },
                      "50%": { opacity: 0.8, transform: "scale(1.1)" },
                    },
                  }}
                />
              )}
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default ResponsiveNavbar;