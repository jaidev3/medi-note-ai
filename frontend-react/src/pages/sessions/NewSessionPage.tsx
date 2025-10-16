import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  Container,
  Paper,
  Box,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useListPatients } from "@/hooks/usePatientsApi";
import { useCreateSession } from "@/hooks/useSessionsApi";

const toLocalInputValue = (date: Date) => {
  const offsetMs = date.getTimezoneOffset() * 60000;
  const shifted = new Date(date.getTime() - offsetMs);
  return shifted.toISOString().slice(0, 16);
};

export const NewSessionPage: React.FC = () => {
  const navigate = useNavigate();
  useAuth();
  const {
    data: patientsData,
    isLoading: patientsLoading,
    error: patientsError,
  } = useListPatients(1, 100);
  const createSessionMutation = useCreateSession();

  const [patientId, setPatientId] = useState("");
  const [visitDate, setVisitDate] = useState(() =>
    toLocalInputValue(new Date())
  );
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const patients = useMemo(() => patientsData?.patients ?? [], [patientsData]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!patientId) {
      setFormError("Please select a patient to create a session.");
      return;
    }

    try {
      const payload = {
        patient_id: patientId,
        visit_date: visitDate ? new Date(visitDate).toISOString() : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      };

      const session = await createSessionMutation.mutateAsync(payload);
      navigate(`/sessions/${session.session_id}`);
    } catch (error: any) {
      const message = error?.message || "Failed to create session";
      setFormError(message);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f7fb" }}>
      <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
        <Paper
          sx={{
            p: 4,
            borderRadius: 3,
            border: "1px solid #e8ebf8",
            boxShadow: "0 4px 20px rgba(102, 126, 234, 0.08)",
          }}
        >
          <Typography variant="h5" component="h1" fontWeight={800} gutterBottom>
            Create Patient Visit Session
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Record a new patient visit session.
          </Typography>

          {patientsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : patientsError ? (
            <Alert severity="error">
              Failed to load patients. Please refresh the page.
            </Alert>
          ) : patients.length === 0 ? (
            <Alert severity="info">
              No patients found. Add a patient before creating a session.
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="patient-select-label">Patient</InputLabel>
                <Select
                  labelId="patient-select-label"
                  value={patientId}
                  label="Patient"
                  onChange={(event) => setPatientId(event.target.value)}
                  required
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": { borderColor: "#667eea" },
                    },
                  }}
                >
                  {patients.map((patient) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Visit Date"
                type="datetime-local"
                fullWidth
                margin="normal"
                value={visitDate}
                onChange={(event) => setVisitDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": { borderColor: "#667eea" },
                  },
                }}
              />

              <TextField
                label="Session Notes"
                fullWidth
                multiline
                minRows={4}
                margin="normal"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add optional notes about the visit"
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": { borderColor: "#667eea" },
                  },
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 4,
                  gap: 2,
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  sx={{
                    borderColor: "#e8ebf8",
                    color: "#667eea",
                    fontWeight: 600,
                    "&:hover": { backgroundColor: "rgba(102, 126, 234, 0.04)" },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={createSessionMutation.isPending}
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
                  {createSessionMutation.isPending
                    ? "Creating..."
                    : "Create Session"}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </div>
  );
};
