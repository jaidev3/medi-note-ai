import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Box,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useListSessions, useDeleteSession } from "@/hooks/useSessionsApi";
import { useListPatients } from "@/hooks/usePatientsApi";

export const SessionsPage: React.FC = () => {
  const navigate = useNavigate();
  useAuth();
  const [page, setPage] = useState(1);
  const [patientFilter, setPatientFilter] = useState<string>("");

  const { data, isLoading, error } = useListSessions(
    page,
    20,
    patientFilter || undefined,
    undefined
  );
  const { data: patientsData } = useListPatients(1, 100); // Get patients for filter
  const deleteSessionMutation = useDeleteSession();

  const sessions = data?.sessions || [];
  const totalCount = data?.total_count || 0;
  const totalPages = Math.ceil(totalCount / 20);
  const patients = patientsData?.patients || [];
  const patientNameMap = useMemo(() => {
    const entries = new Map<string, string>();
    patients.forEach((patient) => entries.set(patient.id, patient.name));
    return entries;
  }, [patients]);

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      try {
        await deleteSessionMutation.mutateAsync(sessionId);
      } catch (err) {
        console.error("Failed to delete session:", err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" component="h1">
            Patient Visit Sessions
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate("/sessions/new")}
          >
            New Session
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Patient</InputLabel>
            <Select
              value={patientFilter}
              onChange={(e) => {
                setPatientFilter(e.target.value);
                setPage(1);
              }}
              label="Filter by Patient"
            >
              <MenuItem value="">All Patients</MenuItem>
              {patients.map((patient) => (
                <MenuItem key={patient.id} value={patient.id}>
                  {patient.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">
            Failed to load sessions: {error.message}
          </Alert>
        ) : sessions.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              {patientFilter
                ? "No sessions found for this patient"
                : "No sessions yet. Create your first session!"}
            </Typography>
          </Paper>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Session ID</TableCell>
                    <TableCell>Patient ID</TableCell>
                    <TableCell>Visit Date</TableCell>
                    <TableCell>Documents</TableCell>
                    <TableCell>SOAP Notes</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow
                      key={session.session_id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={(e) => {
                        if (
                          !(e.target as HTMLElement).closest(".action-button")
                        ) {
                          navigate(`/sessions/${session.session_id}`);
                        }
                      }}
                    >
                      <TableCell>{session.session_id}</TableCell>
                      <TableCell>
                        {patientNameMap.get(session.patient_id) ||
                          session.patient_id}
                      </TableCell>
                      <TableCell>{formatDate(session.visit_date)}</TableCell>
                      <TableCell>{session.document_count}</TableCell>
                      <TableCell>{session.soap_note_count}</TableCell>
                      <TableCell>
                        <Button
                          className="action-button"
                          size="small"
                          color="error"
                          onClick={() =>
                            handleDeleteSession(session.session_id)
                          }
                          disabled={deleteSessionMutation.isPending}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </div>
  );
};
