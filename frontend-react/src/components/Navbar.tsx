import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Button,
  ListItemIcon,
} from "@mui/material";
import { Logout, Settings, Login, AppRegistration } from "@mui/icons-material";
import Logo from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModals } from "@/contexts/AuthModalsContext";

type Props = {
  rightActions?: React.ReactNode;
};

const Navbar: React.FC<Props> = ({ rightActions }) => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { openLoginModal, openSignupModal } = useAuthModals();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
  };

  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "?";

  const menuOpen = Boolean(anchorEl);

  return (
    <AppBar position="sticky" color="inherit" elevation={0}>
      <Toolbar>
        <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
          <Box
            sx={{
              mr: 2,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            <Logo width={36} height={36} aria-hidden={false} />
          </Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
            MediNote AI
          </Typography>
        </Box>

        {rightActions ? (
          rightActions
        ) : (
          <>
            {loading ? null : isAuthenticated ? (
              <Box display="flex" alignItems="center" sx={{ gap: 1.5 }}>
                <Box
                  textAlign="right"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {user?.name || "My Account"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
                <IconButton
                  color="primary"
                  onClick={handleMenuOpen}
                  aria-label="account menu"
                  size="large"
                >
                  <Avatar sx={{ width: 36, height: 36 }}>{userInitial}</Avatar>
                </IconButton>
              </Box>
            ) : (
              <Box display="flex" alignItems="center" sx={{ gap: 1 }}>
                <Button
                  onClick={openLoginModal}
                  color="primary"
                  startIcon={<Login />}
                >
                  Log in
                </Button>
                <Button
                  onClick={openSignupModal}
                  variant="contained"
                  startIcon={<AppRegistration />}
                >
                  Sign up
                </Button>
              </Box>
            )}
          </>
        )}
      </Toolbar>
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box px={2} py={1.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {user?.name || "My Account"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => handleNavigate("/settings")}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Navbar;
