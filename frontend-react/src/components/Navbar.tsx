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
  Login,
  AppRegistration,
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                onClick={openLoginModal}
                color="primary"
                startIcon={<Login />}
                size={isMobile ? "small" : "medium"}
                sx={{ fontWeight: 600 }}
              >
                {isMobile ? "" : "Log in"}
              </Button>
              <Button
                onClick={openSignupModal}
                variant="contained"
                startIcon={<AppRegistration />}
                size={isMobile ? "small" : "medium"}
                sx={{ fontWeight: 600 }}
              >
                {isMobile ? "" : "Sign up"}
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default ResponsiveNavbar;