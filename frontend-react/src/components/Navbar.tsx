import React from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Box, Typography, Button } from "@mui/material";
import AccountMenu from "@/components/AccountMenu";
import { Login, AppRegistration } from "@mui/icons-material";
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
  // account menu handled by AccountMenu component

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
  };

  // avatar initial handled inside AccountMenu

  return (
    <AppBar position="sticky" color="inherit" elevation={0}>
      <Toolbar>
        <Box
          display="flex"
          alignItems="center"
          sx={{ flexGrow: 1, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <Box
            sx={{
              mr: 2,
              display: "flex",
              alignItems: "center",
            }}
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
                  {/* Consolidated AccountMenu component */}
                  <AccountMenu
                    user={user}
                    onNavigate={handleNavigate}
                    onLogout={handleLogout}
                  />
                </Box>
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
      {/* AccountMenu moved to its own component; Menu removed from Navbar */}
    </AppBar>
  );
};

export default Navbar;
