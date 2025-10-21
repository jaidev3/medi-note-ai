import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Description,
  People,
  Event,
  CloudUpload,
  Search,
  Assessment,
  AdminPanelSettings,
  TrendingUp,
  AccessTime,
  Assignment,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useGetUserStats } from "../../hooks/useUsersApi";
import { useListSessions } from "../../hooks/useSessionsApi";
import { EnhancedCard, EnhancedButton } from "../../components/ui";
import { EmptyState } from "../../components/EmptyState";

export const EnhancedDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  useAuth();
  
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useGetUserStats();
  
  const {
    data: sessions,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useListSessions(1, 5);

  const menuItems = [
    {
      title: "Generate SOAP Notes",
      description: "Create AI-powered SOAP notes",
      icon: <Description fontSize="large" />,
      path: "/soap",
      color: "primary" as const,
      trend: { value: 12, label: "from last month" },
    },
    {
      title: "Query Documents",
      description: "Search and query patient documents",
      icon: <Search fontSize="large" />,
      path: "/rag",
      color: "secondary" as const,
      trend: { value: 8, label: "from last month" },
    },
    {
      title: "Manage Patients",
      description: "View and manage patient records",
      icon: <People fontSize="large" />,
      path: "/patients",
      color: "success" as const,
      trend: { value: 5, label: "from last month" },
    },
    {
      title: "Sessions",
      description: "View patient visit sessions",
      icon: <Event fontSize="large" />,
      path: "/sessions",
      color: "info" as const,
      trend: { value: -3, label: "from last month" },
    },
    {
      title: "Upload Documents",
      description: "Upload and manage documents",
      icon: <CloudUpload fontSize="large" />,
      path: "/documents",
      color: "warning" as const,
    },
    {
      title: "Settings",
      description: "View and manage application settings",
      icon: <Assessment fontSize="large" />,
      path: "/settings",
      color: "default" as const,
    },
    {
      title: "Admin Dashboard",
      description: "Manage users, patients, and system settings",
      icon: <AdminPanelSettings fontSize="large" />,
      path: "/admin",
      color: "error" as const,
      adminOnly: true,
    },
  ];

  const statCards = [
    {
      title: "Total Patients",
      value: stats?.total_patients || 0,
      icon: <People />,
      color: "primary" as const,
      trend: { value: 15, label: "from last month" },
    },
    {
      title: "Total Sessions",
      value: stats?.total_sessions || 0,
      icon: <Event />,
      color: "secondary" as const,
      trend: { value: 8, label: "from last month" },
    },
    {
      title: "SOAP Notes",
      value: stats?.total_soap_notes || 0,
      icon: <Description />,
      color: "success" as const,
      trend: { value: 22, label: "from last month" },
    },
    {
      title: "Documents",
      value: stats?.total_documents || 0,
      icon: <Assessment />,
      color: "info" as const,
      trend: { value: 5, label: "from last month" },
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.adminOnly) {
      // Check if user is admin - you'll need to implement this check
      return false; // Temporarily disabled until we have admin role
    }
    return true;
  });

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography
          variant="h3"
          component="h1"
          fontWeight={700}
          gutterBottom
          sx={{ fontSize: { xs: "2rem", md: "2.5rem" } }}
        >
          Welcome back!
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight={400}>
          Here's what's happening with your practice today.
        </Typography>
      </Box>

      {/* Stats Overview */}
      {statsLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : statsError ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          Failed to load statistics
        </Alert>
      ) : (
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <EnhancedCard
                title={stat.title}
                trend={stat.trend}
                icon={stat.icon}
                hover
              >
                <Typography
                  variant="h3"
                  component="div"
                  fontWeight={700}
                  color={theme.palette[stat.color].main}
                >
                  {stat.value.toLocaleString()}
                </Typography>
              </EnhancedCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Quick Actions */}
      <Box mb={4}>
        <Typography variant="h4" component="h2" fontWeight={700} gutterBottom>
          Quick Actions
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Jump right into common workflows
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {filteredMenuItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <EnhancedCard
              title={item.title}
              subtitle={item.description}
              icon={item.icon}
              trend={item.trend}
              hover
              onClick={() => navigate(item.path)}
            >
              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <EnhancedButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(item.path);
                  }}
                >
                  Open
                </EnhancedButton>
              </Box>
            </EnhancedCard>
          </Grid>
        ))}
      </Grid>

      {/* Recent Sessions */}
      <Box mb={4}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" component="h2" fontWeight={700} gutterBottom>
              Recent Sessions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your latest patient visits
            </Typography>
          </Box>
          <EnhancedButton
            variant="outlined"
            onClick={() => navigate("/sessions")}
          >
            View All
          </EnhancedButton>
        </Box>

        {sessionsLoading ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        ) : sessionsError ? (
          <Alert severity="error">Failed to load recent sessions</Alert>
        ) : sessions?.sessions?.length ? (
          <Grid container spacing={2}>
            {sessions.sessions.map((s: any) => (
              <Grid item xs={12} md={6} key={s.session_id}>
                <EnhancedCard
                  title={`Session ${s.session_id.slice(0, 6)}`}
                  subtitle={new Date(
                    s.visit_date ?? s.created_at
                  ).toLocaleDateString()}
                  chip={{
                    label: `${s.document_count} docs`,
                    color: "info",
                  }}
                  hover
                  onClick={() => navigate(`/sessions/${s.session_id}`)}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Assignment fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {s.soap_note_count} SOAP notes
                      </Typography>
                    </Box>
                    <EnhancedButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/sessions/${s.session_id}`);
                      }}
                    >
                      Open
                    </EnhancedButton>
                  </Box>
                </EnhancedCard>
              </Grid>
            ))}
          </Grid>
        ) : (
          <EnhancedCard>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <EmptyState
                title="No recent sessions"
                description="Create a new session to get started."
              />
              <Box sx={{ mt: 2 }}>
                <EnhancedButton
                  onClick={() => navigate("/sessions/new")}
                  gradient
                >
                  Create Session
                </EnhancedButton>
              </Box>
            </Box>
          </EnhancedCard>
        )}
      </Box>
    </Container>
  );
};

export default EnhancedDashboardPage;