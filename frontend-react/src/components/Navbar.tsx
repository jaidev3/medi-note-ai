import React from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Box, Typography, IconButton } from "@mui/material";
import { Logout } from "@mui/icons-material";
import Logo from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  rightActions?: React.ReactNode;
};

const Navbar: React.FC<Props> = ({ rightActions }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              {user?.email}
            </Typography>
            <IconButton color="primary" onClick={logout} aria-label="logout">
              <Logout />
            </IconButton>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
