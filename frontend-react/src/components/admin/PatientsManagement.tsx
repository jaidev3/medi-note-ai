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
  Visibility,
  Edit,
  Delete,
} from "@mui/icons-material";

// Mock data - Replace with real API calls
const mockPatients = [
  {
    id: 1,
    name: "John Smith",
    mrn: "MRN001234",
    age: 45,
    gender: "Male",
    lastVisit: "2024-10-10",
    sessionsCount: 12,
    status: "Active",
  },
  {
    id: 2,
    name: "Jane Doe",
    mrn: "MRN001235",
    age: 32,
    gender: "Female",
    lastVisit: "2024-10-12",
    sessionsCount: 8,
    status: "Active",
  },
  {
    id: 3,
    name: "Robert Johnson",
    mrn: "MRN001236",
    age: 67,
    gender: "Male",
    lastVisit: "2024-09-28",
    sessionsCount: 24,
    status: "Active",
  },
  {
    id: 4,
    name: "Maria Garcia",
    mrn: "MRN001237",
    age: 54,
    gender: "Female",
    lastVisit: "2024-08-15",
    sessionsCount: 5,
    status: "Inactive",
  },
];

export const PatientsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    patientId: number
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedPatient(patientId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPatient(null);
  };

  const handleAction = (action: string) => {
    console.log(`Action ${action} on patient ${selectedPatient}`);
    handleMenuClose();
  };

  const filteredPatients = mockPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    return status === "Active" ? "success" : "default";
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
          placeholder="Search patients..."
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
          Add New Patient
        </Button>
      </Box>

      {/* Patients Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>MRN</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Last Visit</TableCell>
              <TableCell>Sessions</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPatients.map((patient) => (
              <TableRow key={patient.id} hover>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {patient.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>
                      {patient.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {patient.mrn}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{patient.age}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{patient.gender}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {patient.lastVisit}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={patient.sessionsCount}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={patient.status}
                    size="small"
                    color={getStatusColor(patient.status)}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, patient.id)}
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
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleAction("edit")}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit Patient
        </MenuItem>
        <MenuItem
          onClick={() => handleAction("delete")}
          sx={{ color: "error.main" }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete Patient
        </MenuItem>
      </Menu>

      {/* Empty State */}
      {filteredPatients.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">No patients found</Typography>
        </Box>
      )}
    </Box>
  );
};
