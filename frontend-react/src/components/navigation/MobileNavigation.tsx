import React from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Toolbar,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Dashboard,
  People,
  Event,
  Description,
  CloudUpload,
  Search,
  Settings,
  AdminPanelSettings,
  Home,
  ChevronLeft,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const DRAWER_WIDTH = 280;

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    {
      title: "Home",
      icon: <Home />,
      path: "/",
      public: true,
    },
    {
      title: "Dashboard",
      icon: <Dashboard />,
      path: "/dashboard",
      public: false,
    },
    {
      title: "Patients",
      icon: <People />,
      path: "/patients",
      public: false,
    },
    {
      title: "Sessions",
      icon: <Event />,
      path: "/sessions",
      public: false,
    },
    {
      title: "SOAP Notes",
      icon: <Description />,
      path: "/soap",
      public: false,
    },
    {
      title: "Documents",
      icon: <CloudUpload />,
      path: "/documents",
      public: false,
    },
    {
      title: "Query",
      icon: <Search />,
      path: "/rag",
      public: false,
    },
    {
      title: "Settings",
      icon: <Settings />,
      path: "/settings",
      public: false,
    },
    {
      title: "Admin",
      icon: <AdminPanelSettings />,
      path: "/admin",
      public: false,
      adminOnly: true,
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.adminOnly && user?.role !== "admin") return false;
    return true;
  });

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar
        sx={{
          px: 2.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          <Box
            sx={{
              mr: 2,
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src="/favicon.svg"
              alt="MediNote AI"
              style={{ width: 32, height: 32 }}
            />
          </Box>
          <Typography variant="h6" noWrap component="div" fontWeight={700}>
            MediNote AI
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={onClose} size="small">
            <ChevronLeft />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <Box sx={{ flexGrow: 1, py: 1 }}>
        <List sx={{ px: 1 }}>
          {filteredMenuItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: 2,
                  minHeight: 48,
                  "&.Mui-selected": {
                    backgroundColor: theme.palette.primary.main + "10",
                    color: theme.palette.primary.main,
                    "&:hover": {
                      backgroundColor: theme.palette.primary.main + "15",
                    },
                    "& .MuiListItemIcon-root": {
                      color: theme.palette.primary.main,
                    },
                  },
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: location.pathname === item.path ? "inherit" : "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 600 : 500,
                    fontSize: "0.875rem",
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          © 2024 MediNote AI
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Version 1.0.0
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          borderRight: `1px solid ${theme.palette.divider}`,
          position: "relative",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default MobileNavigation;