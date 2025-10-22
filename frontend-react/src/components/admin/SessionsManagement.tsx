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
  Typography,
  Menu,
  MenuItem,
} from "@mui/material";
import { Search, MoreVert, Visibility, Delete } from "@mui/icons-material";

// Mock data - Replace with real API calls
const mockSessions = [
  {
    id: 1,
    patientName: "John Smith",
    sessionDate: "2024-10-14",
    duration: "45 min",
    professional: "Dr. Sarah Johnson",
    soapStatus: "Completed",
    recordingSize: "15.2 MB",
  },
  {
    id: 2,
    patientName: "Jane Doe",
    sessionDate: "2024-10-14",
    duration: "30 min",
    professional: "Dr. Michael Chen",
    soapStatus: "Pending",
    recordingSize: "12.8 MB",
  },
  {
    id: 3,
    patientName: "Robert Johnson",
    sessionDate: "2024-10-13",
    duration: "60 min",
    professional: "Dr. Sarah Johnson",
    soapStatus: "Completed",
    recordingSize: "22.5 MB",
  },
  {
    id: 4,
    patientName: "Maria Garcia",
    sessionDate: "2024-10-12",
    duration: "40 min",
    professional: "Dr. Emily Davis",
    soapStatus: "Completed",
    recordingSize: "18.9 MB",
  },
];

export const SessionsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    sessionId: number
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedSession(sessionId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSession(null);
  };

  const handleAction = (action: string) => {
    console.log(`Action ${action} on session ${selectedSession}`);
    handleMenuClose();
  };

  const filteredSessions = mockSessions.filter(
    (session) =>
      session.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.professional.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSOAPStatusColor = (status: string) => {
    return status === "Completed" ? "success" : "warning";
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
          placeholder="Search sessions..."
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
      </Box>

      {/* Sessions Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Professional</TableCell>
              <TableCell>SOAP Status</TableCell>
              <TableCell>Recording Size</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSessions.map((session) => (
              <TableRow key={session.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {session.patientName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {session.sessionDate}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{session.duration}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {session.professional}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={session.soapStatus}
                    size="small"
                    color={getSOAPStatusColor(session.soapStatus)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {session.recordingSize}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, session.id)}
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
        <MenuItem onClick={() => handleAction("view")}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          View Session
        </MenuItem>
        <MenuItem
          onClick={() => handleAction("delete")}
          sx={{ color: "error.main" }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete Session
        </MenuItem>
      </Menu>

      {/* Empty State */}
      {filteredSessions.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">No sessions found</Typography>
        </Box>
      )}
    </Box>
  );
};
