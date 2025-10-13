import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Container,
  Paper,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  Stack,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Pagination,
} from "@mui/material";
import { ArrowBack, Delete } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetPatient,
  useGetPatientVisits,
  useUpdatePatient,
  useDeletePatient,
} from "@/hooks/usePatientsApi";
import { SessionResponse } from "@/lib";

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not available";
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

export const PatientDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const { logout } = useAuth();

  const {
    data: patient,
    isLoading: patientLoading,
    error: patientError,
  } = useGetPatient(patientId ?? "");
  const updatePatientMutation = useUpdatePatient();
  const deletePatientMutation = useDeletePatient();

  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [visitsPage, setVisitsPage] = useState(1);

  const {
    data: visitsData,
    isLoading: visitsLoading,
    error: visitsError,
  } = useGetPatientVisits(patientId ?? "", visitsPage, 10);

  useEffect(() => {
    setVisitsPage(1);
  }, [patientId]);

  useEffect(() => {
    if (patient) {
      setFormState({
        name: patient.name ?? "",
        email: patient.email ?? "",
        phone: patient.phone ?? "",
        address: patient.address ?? "",
      });
      setIsDirty(false);
    }
  }, [patient]);

  const visits = useMemo<SessionResponse[]>(
    () => visitsData?.sessions ?? [],
    [visitsData]
  );
  const visitTotalPages = useMemo(() => {
    if (!visitsData?.total_count) return 1;
    return Math.max(
      1,
      Math.ceil(visitsData.total_count / (visitsData.page_size || 10))
    );
  }, [visitsData]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
    setIsDirty(true);
    setFeedback(null);
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patientId) return;

    try {
      const payload = {
        name: formState.name.trim() || undefined,
        email: formState.email.trim() || undefined,
        phone: formState.phone.trim() || undefined,
        address: formState.address.trim() || undefined,
      };

      await updatePatientMutation.mutateAsync({ id: patientId, data: payload });
      setFeedback({ type: "success", message: "Patient details updated." });
      setIsDirty(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update patient.";
      setFeedback({ type: "error", message });
    }
  };

  const handleDelete = async () => {
    if (!patientId) return;
    const confirmed = window.confirm(
      "Delete this patient and all associated sessions? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await deletePatientMutation.mutateAsync(patientId);
      navigate("/patients");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete patient.";
      setFeedback({ type: "error", message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2 }}>
            Patient Details
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {patientLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : patientError ? (
          <Alert severity="error">Failed to load patient details.</Alert>
        ) : !patient ? (
          <Alert severity="warning">Patient not found.</Alert>
        ) : (
          <Stack spacing={3}>
            {feedback && (
              <Alert severity={feedback.type}>{feedback.message}</Alert>
            )}

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Patient Information
              </Typography>
              <Box component="form" onSubmit={handleUpdate}>
                <TextField
                  label="Full Name"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />

                <TextField
                  label="Email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  type="email"
                />

                <TextField
                  label="Phone"
                  name="phone"
                  value={formState.phone}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />

                <TextField
                  label="Address"
                  name="address"
                  value={formState.address}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  multiline
                  minRows={3}
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 3,
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleDelete}
                    disabled={deletePatientMutation.isPending}
                  >
                    Delete Patient
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={!isDirty || updatePatientMutation.isPending}
                  >
                    {updatePatientMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                </Box>
              </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Patient ID
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
                    {patient.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Visits
                  </Typography>
                  <Typography variant="body1">
                    {patient.total_visits}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Visit
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(patient.last_visit)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(patient.created_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Updated
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(patient.updated_at)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">Visit History</Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={`Total: ${patient.total_visits}`}
                    color="primary"
                    variant="outlined"
                  />
                  {patient.last_visit && (
                    <Chip
                      label={`Last visit: ${formatDateTime(
                        patient.last_visit
                      )}`}
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Stack>

              {visitsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : visitsError ? (
                <Alert severity="error">Failed to load visit history.</Alert>
              ) : visits.length === 0 ? (
                <Alert severity="info">
                  No sessions recorded for this patient yet.
                </Alert>
              ) : (
                <Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Visit Date</TableCell>
                          <TableCell>Notes</TableCell>
                          <TableCell>Documents</TableCell>
                          <TableCell>SOAP Notes</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {visits.map((session) => (
                          <TableRow key={session.session_id} hover>
                            <TableCell>
                              {formatDateTime(session.visit_date)}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 260 }}>
                              {session.notes ? session.notes : "—"}
                            </TableCell>
                            <TableCell>{session.document_count}</TableCell>
                            <TableCell>{session.soap_note_count}</TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                onClick={() =>
                                  navigate(`/sessions/${session.session_id}`)
                                }
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {visitTotalPages > 1 && (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                    >
                      <Pagination
                        count={visitTotalPages}
                        page={visitsPage}
                        onChange={(_, page) => setVisitsPage(page)}
                        color="primary"
                        size="small"
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Stack>
        )}
      </Container>
    </div>
  );
};
