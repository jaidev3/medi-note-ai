import React, { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  Typography,
  Avatar,
} from "@mui/material";
import {
  Search,
  MoreVert,
  Add,
  Edit,
  Delete,
  Block,
  CheckCircle,
} from "@mui/icons-material";

// Mock data - Replace with real API calls
const mockUsers = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    email: "sarah.j@hospital.com",
    role: "Professional",
    status: "Active",
    createdAt: "2024-01-15",
    lastLogin: "2 hours ago",
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    email: "michael.c@hospital.com",
    role: "Professional",
    status: "Active",
    createdAt: "2024-02-20",
    lastLogin: "1 day ago",
  },
  {
    id: 3,
    name: "Admin User",
    email: "admin@medinote.com",
    role: "Admin",
    status: "Active",
    createdAt: "2023-12-01",
    lastLogin: "5 minutes ago",
  },
  {
    id: 4,
    name: "Dr. Emily Davis",
    email: "emily.d@hospital.com",
    role: "Professional",
    status: "Inactive",
    createdAt: "2024-03-10",
    lastLogin: "2 weeks ago",
  },
];

export const UsersManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    userId: number
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleAction = (action: string) => {
    console.log(`Action ${action} on user ${selectedUser}`);
    handleMenuClose();
  };

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    return status === "Active" ? "success" : "default";
  };

  const getRoleColor = (role: string) => {
    return role === "Admin" ? "error" : "primary";
  };

  return (
    <Box>
      {/* Header Actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <TextField
          placeholder="Search users..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
        <Button variant="contained" startIcon={<Add />}>
          Add New User
        </Button>
      </Box>

      {/* Users Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {user.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>
                      {user.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    size="small"
                    color={getRoleColor(user.role)}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    size="small"
                    color={getStatusColor(user.status)}
                    icon={
                      user.status === "Active" ? <CheckCircle /> : <Block />
                    }
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {user.createdAt}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {user.lastLogin}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, user.id)}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction("edit")}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit User
        </MenuItem>
        <MenuItem onClick={() => handleAction("deactivate")}>
          <Block fontSize="small" sx={{ mr: 1 }} />
          Deactivate
        </MenuItem>
        <MenuItem
          onClick={() => handleAction("delete")}
          sx={{ color: "error.main" }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete User
        </MenuItem>
      </Menu>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">No users found</Typography>
        </Box>
      )}
    </Box>
  );
};
