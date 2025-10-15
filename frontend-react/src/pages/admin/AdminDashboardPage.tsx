import React, { useState } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
} from "@mui/material";
import {
  People,
  Person,
  Description,
  Event,
  TrendingUp,
  Storage,
} from "@mui/icons-material";
import { AdminStatsCard } from "../../components/admin/AdminStatsCard";
import { UsersManagement } from "../../components/admin/UsersManagement";
import { PatientsManagement } from "../../components/admin/PatientsManagement";
import { SessionsManagement } from "../../components/admin/SessionsManagement";
import { DocumentsManagement } from "../../components/admin/DocumentsManagement";
import { SystemSettings } from "../../components/admin/SystemSettings";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const AdminDashboardPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // Mock data - Replace with real API calls
  const stats = {
    totalUsers: 156,
    totalProfessionals: 45,
    totalPatients: 892,
    totalSessions: 1234,
    totalDocuments: 567,
    totalSOAPNotes: 1045,
    storageUsed: "15.6 GB",
    activeUsersToday: 32,
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage users, patients, sessions, and system settings
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AdminStatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<People />}
            color="primary"
            subtitle={`${stats.totalProfessionals} Professionals`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AdminStatsCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={<Person />}
            color="secondary"
            subtitle={`${stats.activeUsersToday} active today`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AdminStatsCard
            title="Total Sessions"
            value={stats.totalSessions}
            icon={<Event />}
            color="success"
            subtitle={`${stats.totalSOAPNotes} SOAP notes`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AdminStatsCard
            title="Documents"
            value={stats.totalDocuments}
            icon={<Description />}
            color="warning"
            subtitle={stats.storageUsed}
          />
        </Grid>
      </Grid>

      {/* System Health */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: "success.main" }} />
                <Typography variant="h6" fontWeight="bold">
                  System Activity
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Last 7 days overview
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">New Users</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    +12
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">New Patients</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    +34
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Sessions Created</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    +89
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Documents Uploaded</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    +23
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Storage sx={{ mr: 1, color: "info.main" }} />
                <Typography variant="h6" fontWeight="bold">
                  Storage Usage
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                System storage metrics
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Total Storage</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    100 GB
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Used Storage</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats.storageUsed}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Available</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    84.4 GB
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: "100%",
                    height: 8,
                    bgcolor: "grey.200",
                    borderRadius: 1,
                    mt: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: "15.6%",
                      height: "100%",
                      bgcolor: "info.main",
                      borderRadius: 1,
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Management Tabs */}
      <Paper sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            aria-label="admin management tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Users" />
            <Tab label="Patients" />
            <Tab label="Sessions" />
            <Tab label="Documents" />
            <Tab label="Settings" />
          </Tabs>
        </Box>

        <TabPanel value={selectedTab} index={0}>
          <UsersManagement />
        </TabPanel>
        <TabPanel value={selectedTab} index={1}>
          <PatientsManagement />
        </TabPanel>
        <TabPanel value={selectedTab} index={2}>
          <SessionsManagement />
        </TabPanel>
        <TabPanel value={selectedTab} index={3}>
          <DocumentsManagement />
        </TabPanel>
        <TabPanel value={selectedTab} index={4}>
          <SystemSettings />
        </TabPanel>
      </Paper>
    </Container>
  );
};
