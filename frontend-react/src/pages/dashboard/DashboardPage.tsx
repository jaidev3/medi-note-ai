import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
} from "@mui/material";
import {
  Description,
  People,
  Event,
  CloudUpload,
  Search,
  Assessment,
  Logout,
} from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      title: "Generate SOAP Notes",
      description: "Create AI-powered SOAP notes",
      icon: <Description fontSize="large" />,
      path: "/soap",
    },
    {
      title: "Query Documents",
      description: "Search and query patient documents",
      icon: <Search fontSize="large" />,
      path: "/rag",
    },
    {
      title: "Manage Patients",
      description: "View and manage patient records",
      icon: <People fontSize="large" />,
      path: "/patients",
    },
    {
      title: "Sessions",
      description: "View patient visit sessions",
      icon: <Event fontSize="large" />,
      path: "/sessions",
    },
    {
      title: "Upload Documents",
      description: "Upload and manage documents",
      icon: <CloudUpload fontSize="large" />,
      path: "/documents",
    },
    {
      title: "Reports",
      description: "View analytics and reports",
      icon: <Assessment fontSize="large" />,
      path: "/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            MediNote AI
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome, {user?.name}
          </Typography>
          <IconButton color="inherit" onClick={logout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box mb={4}>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            gutterBottom
          >
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Select an option below to get started.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                elevation={2}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box color="primary.main" mb={2}>
                    {item.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(item.path)}>
                    Open
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </div>
  );
};
