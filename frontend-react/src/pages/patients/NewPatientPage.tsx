import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  Container,
  Paper,
  Box,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useCreatePatient } from "@/hooks/usePatientsApi";

export const NewPatientPage: React.FC = () => {
  const navigate = useNavigate();
  useAuth();
  const createPatientMutation = useCreatePatient();

  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!formState.name.trim()) {
      setFormError("Patient name is required.");
      return;
    }

    try {
      const payload = {
        name: formState.name.trim(),
        email: formState.email.trim() || undefined,
        phone: formState.phone.trim() || undefined,
        address: formState.address.trim() || undefined,
      };

      const patient = await createPatientMutation.mutateAsync(payload);
      navigate(`/patients/${patient.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create patient.";
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
            Add Patient Record
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Capture essential patient details. You can update this information
            later.
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <TextField
              label="Full Name"
              name="name"
              value={formState.name}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&:hover fieldset": { borderColor: "#667eea" },
                },
              }}
            />

            <TextField
              label="Email"
              name="email"
              value={formState.email}
              onChange={handleChange}
              fullWidth
              margin="normal"
              type="email"
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&:hover fieldset": { borderColor: "#667eea" },
                },
              }}
            />

            <TextField
              label="Phone"
              name="phone"
              value={formState.phone}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&:hover fieldset": { borderColor: "#667eea" },
                },
              }}
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
                disabled={createPatientMutation.isPending}
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
                {createPatientMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Create Patient"
                )}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </div>
  );
};
