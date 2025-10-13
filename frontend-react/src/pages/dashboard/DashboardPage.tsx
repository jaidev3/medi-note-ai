import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  ButtonBase,
} from "@mui/material";
import Navbar from "@/components/Navbar";
import {
  Description,
  People,
  Event,
  CloudUpload,
  Search,
  Assessment,
} from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useGetUserStats } from "@/hooks/useUsersApi";
import { useListSessions } from "@/hooks/useSessionsApi";
import StatCard from "@/components/dashboard/StatCard";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import SectionHeader from "@/components/dashboard/SectionHeader";
import { EmptyState } from "@/components/EmptyState";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
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
      title: "Settings",
      description: "View and manage application settings",
      icon: <Assessment fontSize="large" />,
      path: "/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        {/* Stats Overview */}
        {statsLoading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : statsError ? (
          <Alert severity="error" sx={{ mb: 4 }}>
            Failed to load statistics
          </Alert>
        ) : stats ? (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label="Total Patients"
                value={stats.total_patients}
                icon={<People />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label="Total Sessions"
                value={stats.total_sessions}
                icon={<Event />}
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label="SOAP Notes"
                value={stats.total_soap_notes}
                icon={<Description />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                label="Documents"
                value={stats.total_documents}
                icon={<Assessment />}
                color="info"
              />
            </Grid>
          </Grid>
        ) : null}

        <SectionHeader
          title="Quick actions"
          subtitle="Jump right into common workflows"
        />
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <QuickActionCard
                title={item.title}
                description={item.description}
                icon={item.icon}
                onClick={() => navigate(item.path)}
              />
            </Grid>
          ))}
        </Grid>

        <SectionHeader
          title="Recent sessions"
          subtitle="Your latest patient visits"
          action={
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/sessions")}
            >
              View all
            </Button>
          }
        />
        <Card>
          <CardContent>
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
                    <ButtonBase
                      onClick={() => navigate(`/sessions/${s.session_id}`)}
                      sx={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        borderRadius: 2,
                      }}
                      focusRipple
                    >
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        px={1}
                        py={1.5}
                        borderRadius={2}
                        sx={{ bgcolor: "background.paper" }}
                      >
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Session {s.session_id.slice(0, 6)} •{" "}
                            {new Date(
                              s.visit_date ?? s.created_at
                            ).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Docs: {s.document_count} • SOAP: {s.soap_note_count}
                          </Typography>
                        </Box>
                        <span
                          style={{
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            color: "#1976d2",
                          }}
                          onClick={() => navigate(`/sessions/${s.session_id}`)}
                        >
                          Open
                        </span>
                      </Box>
                    </ButtonBase>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <EmptyState
                title="No recent sessions"
                description="Create a new session to get started."
              />
            )}
          </CardContent>
        </Card>
      </Container>
    </div>
  );
};
