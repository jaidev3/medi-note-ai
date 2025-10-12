import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Paper,
  IconButton,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2 }}>
            Settings
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Account Settings
          </Typography>
          <Box mt={3}>
            <Typography variant="body1">
              <strong>Name:</strong> {user?.name}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              <strong>Email:</strong> {user?.email}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              <strong>Role:</strong> {user?.role}
            </Typography>
          </Box>
        </Paper>
      </Container>
    </div>
  );
};
