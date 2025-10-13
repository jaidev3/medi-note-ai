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
    <div className="min-h-screen bg-gray-50">
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Create Patient Visit Session
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
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 3,
                }}
              >
                <Button variant="outlined" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={createSessionMutation.isPending}
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
