import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import {
  Dashboard,
  People,
  Person,
  Event,
  Description,
  Settings,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

const DRAWER_WIDTH = 240;

interface AdminNavItem {
  text: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: AdminNavItem[] = [
  { text: "Overview", icon: <Dashboard />, path: "/admin" },
  { text: "Users", icon: <People />, path: "/admin?tab=0" },
  { text: "Patients", icon: <Person />, path: "/admin?tab=1" },
  { text: "Sessions", icon: <Event />, path: "/admin?tab=2" },
  { text: "Documents", icon: <Description />, path: "/admin?tab=3" },
  { text: "Settings", icon: <Settings />, path: "/admin?tab=4" },
];

export const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: "auto", pt: 2 }}>
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            fontWeight={600}
          >
            Admin Panel
          </Typography>
        </Box>
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname + location.search === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};
