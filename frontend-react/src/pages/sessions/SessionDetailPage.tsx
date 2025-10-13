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
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import { ArrowBack, Delete } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetSession,
  useUpdateSession,
  useDeleteSession,
} from "@/hooks/useSessionsApi";
import { useGetPatient } from "@/hooks/usePatientsApi";

const toLocalInputValue = (isoDate: string) => {
  const date = new Date(isoDate);
  const offsetMs = date.getTimezoneOffset() * 60000;
  const shifted = new Date(date.getTime() - offsetMs);
  return shifted.toISOString().slice(0, 16);
};

const formatDisplayDate = (isoDate: string) => {
  try {
    return new Date(isoDate).toLocaleString();
  } catch (error) {
    return isoDate;
  }
};

export const SessionDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { logout } = useAuth();

  const { data: session, isLoading, error } = useGetSession(sessionId ?? "");
  const { data: patient } = useGetPatient(session?.patient_id ?? "");

  const updateSessionMutation = useUpdateSession();
  const deleteSessionMutation = useDeleteSession();

  const [visitDate, setVisitDate] = useState("");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (session) {
      setVisitDate(toLocalInputValue(session.visit_date));
      setNotes(session.notes ?? "");
      setIsDirty(false);
    }
  }, [session?.session_id]);

  const metadata = useMemo(() => {
    if (!session) return [];
    return [
      { label: "Session ID", value: session.session_id },
      { label: "Patient", value: patient?.name ?? session.patient_id },
      {
        label: "Professional",
        value: session.professional_id ?? "Assigned on visit",
      },
      { label: "Created", value: formatDisplayDate(session.created_at) },
      { label: "Updated", value: formatDisplayDate(session.updated_at) },
    ];
  }, [patient?.name, session]);

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionId) return;
    setFeedback(null);

    try {
      const payload = {
        visit_date: visitDate ? new Date(visitDate).toISOString() : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      };

      await updateSessionMutation.mutateAsync({ id: sessionId, data: payload });
      setFeedback({
        type: "success",
        message: "Session updated successfully.",
      });
      setIsDirty(false);
    } catch (err: any) {
      const message = err?.message || "Failed to update session.";
      setFeedback({ type: "error", message });
    }
  };

  const handleDelete = async () => {
    if (!sessionId) return;
    const confirmed = window.confirm(
      "Delete this session? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await deleteSessionMutation.mutateAsync(sessionId);
      navigate("/sessions");
    } catch (err: any) {
      const message = err?.message || "Failed to delete session.";
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
            Session Details
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">Failed to load session details.</Alert>
        ) : !session ? (
          <Alert severity="warning">Session not found.</Alert>
        ) : (
          <Stack spacing={3}>
            {feedback && (
              <Alert severity={feedback.type}>{feedback.message}</Alert>
            )}

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Session Summary
              </Typography>
              <Grid container spacing={2}>
                {metadata.map((item) => (
                  <Grid item xs={12} sm={6} key={item.label}>
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ wordBreak: "break-word" }}
                    >
                      {item.value}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 3 }} />
              <Stack direction="row" spacing={2}>
                <Chip
                  label={`Documents: ${session.document_count}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`SOAP Notes: ${session.soap_note_count}`}
                  color="primary"
                  variant="outlined"
                />
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Visit Details
              </Typography>
              <Box component="form" onSubmit={handleUpdate}>
                <TextField
                  label="Visit Date"
                  type="datetime-local"
                  fullWidth
                  margin="normal"
                  value={visitDate}
                  onChange={(event) => {
                    setVisitDate(event.target.value);
                    setIsDirty(true);
                  }}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Session Notes"
                  fullWidth
                  multiline
                  minRows={4}
                  margin="normal"
                  value={notes}
                  onChange={(event) => {
                    setNotes(event.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Update notes captured during the visit"
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
                    disabled={deleteSessionMutation.isPending}
                  >
                    Delete Session
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={!isDirty || updateSessionMutation.isPending}
                  >
                    {updateSessionMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Stack>
        )}
      </Container>
    </div>
  );
};
