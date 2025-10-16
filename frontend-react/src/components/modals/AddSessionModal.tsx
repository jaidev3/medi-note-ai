import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useListPatients } from "@/hooks/usePatientsApi";
import { useCreateSession } from "@/hooks/useSessionsApi";

const toLocalInputValue = (date: Date) => {
  const offsetMs = date.getTimezoneOffset() * 60000;
  const shifted = new Date(date.getTime() - offsetMs);
  return shifted.toISOString().slice(0, 16);
};

interface AddSessionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddSessionModal: React.FC<AddSessionModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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

      await createSessionMutation.mutateAsync(payload);

      // Reset form
      setPatientId("");
      setVisitDate(toLocalInputValue(new Date()));
      setNotes("");
      setFormError(null);

      onClose();
      onSuccess?.();
    } catch (error: any) {
      const message = error?.message || "Failed to create session";
      setFormError(message);
    }
  };

  const handleClose = () => {
    setPatientId("");
    setVisitDate(toLocalInputValue(new Date()));
    setNotes("");
    setFormError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 800,
          fontSize: "1.25rem",
          pb: 1,
        }}
      >
        Create Patient Visit Session
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {patientsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
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
            <Box component="form" onSubmit={handleSubmit} id="add-session-form">
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}

              <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
                <InputLabel id="patient-select-label">Patient</InputLabel>
                <Select
                  labelId="patient-select-label"
                  value={patientId}
                  label="Patient"
                  onChange={(event) => setPatientId(event.target.value)}
                  required
                  disabled={createSessionMutation.isPending}
                  sx={{
                    borderRadius: 1,
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
                disabled={createSessionMutation.isPending}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                    "&:hover fieldset": { borderColor: "#667eea" },
                  },
                }}
              />

              <TextField
                label="Session Notes"
                fullWidth
                multiline
                minRows={3}
                margin="normal"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add optional notes about the visit"
                variant="outlined"
                disabled={createSessionMutation.isPending}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                    "&:hover fieldset": { borderColor: "#667eea" },
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={createSessionMutation.isPending || patientsLoading}
          sx={{
            color: "#667eea",
            fontWeight: 600,
            "&:hover": { backgroundColor: "rgba(102, 126, 234, 0.04)" },
          }}
        >
          Cancel
        </Button>
        {patients.length > 0 && (
          <Button
            type="submit"
            form="add-session-form"
            variant="contained"
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
            {createSessionMutation.isPending ? "Creating..." : "Create Session"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
