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
import { AddSessionModal } from "@/components/modals/AddSessionModal";

export const SessionsPage: React.FC = () => {
  const navigate = useNavigate();
  useAuth();
  const [page, setPage] = useState(1);
  const [patientFilter, setPatientFilter] = useState<string>("");
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);

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
    <div className="min-h-screen" style={{ backgroundColor: "#f5f7fb" }}>
      <Container maxWidth="lg" sx={{ mt: 5, mb: 4 }}>
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" fontWeight={800}>
              Patient Visit Sessions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Manage and track patient visits and sessions.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsAddSessionModalOpen(true)}
            sx={{
              fontWeight: 700,
              textTransform: "none",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 12px 24px rgba(102, 126, 234, 0.4)",
              },
              transition: "all 0.3s ease",
            }}
          >
            New Session
          </Button>
        </Box>

        <Box sx={{ mb: 4 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Patient</InputLabel>
            <Select
              value={patientFilter}
              onChange={(e) => {
                setPatientFilter(e.target.value);
                setPage(1);
              }}
              label="Filter by Patient"
              sx={{
                borderRadius: 2,
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": { borderColor: "#667eea" },
                },
              }}
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
          <Paper
            sx={{
              p: 5,
              textAlign: "center",
              borderRadius: 3,
              border: "1px solid #e8ebf8",
              backgroundColor: "white",
            }}
          >
            <Typography color="text.secondary" variant="h6" fontWeight={700}>
              {patientFilter
                ? "No sessions found for this patient"
                : "No sessions yet. Create your first session!"}
            </Typography>
          </Paper>
        ) : (
          <>
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 3,
                border: "1px solid #e8ebf8",
                boxShadow: "0 4px 20px rgba(102, 126, 234, 0.08)",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f8f9ff" }}>
                    <TableCell sx={{ fontWeight: 700, color: "#667eea" }}>
                      Session ID
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#667eea" }}>
                      Patient
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#667eea" }}>
                      Visit Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#667eea" }}>
                      Documents
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#667eea" }}>
                      SOAP Notes
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#667eea" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow
                      key={session.session_id}
                      hover
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "rgba(102, 126, 234, 0.04)",
                        },
                        transition: "background-color 0.2s ease",
                      }}
                      onClick={(e) => {
                        if (
                          !(e.target as HTMLElement).closest(".action-button")
                        ) {
                          navigate(`/sessions/${session.session_id}`);
                        }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        {session.session_id.slice(0, 12)}...
                      </TableCell>
                      <TableCell>
                        {patientNameMap.get(session.patient_id) ||
                          session.patient_id}
                      </TableCell>
                      <TableCell>{formatDate(session.visit_date)}</TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {session.document_count}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {session.soap_note_count}
                      </TableCell>
                      <TableCell>
                        <Button
                          className="action-button"
                          size="small"
                          color="error"
                          onClick={() =>
                            handleDeleteSession(session.session_id)
                          }
                          disabled={deleteSessionMutation.isPending}
                          sx={{ fontWeight: 600 }}
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

      <AddSessionModal
        open={isAddSessionModalOpen}
        onClose={() => setIsAddSessionModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
};
