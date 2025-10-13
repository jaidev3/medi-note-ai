import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Container,
  Paper,
  Box,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useCreatePatient } from "@/hooks/usePatientsApi";

export const NewPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
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
    <div className="min-h-screen bg-gray-50">
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2 }}>
            New Patient
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Add Patient Record
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
              }}
            >
              <Button variant="outlined" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={createPatientMutation.isPending}
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
