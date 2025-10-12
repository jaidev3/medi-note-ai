import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Paper,
  IconButton,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";

export const SessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
            Sessions
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Patient Visit Sessions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage patient visit sessions here.
          </Typography>
        </Paper>
      </Container>
    </div>
  );
};
