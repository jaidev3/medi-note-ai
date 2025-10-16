import React, { useState } from "react";
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
} from "@mui/material";
import { useCreatePatient } from "@/hooks/usePatientsApi";

interface AddPatientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
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

      await createPatientMutation.mutateAsync(payload);

      // Reset form
      setFormState({
        name: "",
        email: "",
        phone: "",
        address: "",
      });
      setFormError(null);

      onClose();
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create patient.";
      setFormError(message);
    }
  };

  const handleClose = () => {
    setFormState({
      name: "",
      email: "",
      phone: "",
      address: "",
    });
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
        Add Patient Record
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Box component="form" onSubmit={handleSubmit} id="add-patient-form">
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
              disabled={createPatientMutation.isPending}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1,
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
              disabled={createPatientMutation.isPending}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1,
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
              disabled={createPatientMutation.isPending}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1,
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
              disabled={createPatientMutation.isPending}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1,
                  "&:hover fieldset": { borderColor: "#667eea" },
                },
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={createPatientMutation.isPending}
          sx={{
            color: "#667eea",
            fontWeight: 600,
            "&:hover": { backgroundColor: "rgba(102, 126, 234, 0.04)" },
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="add-patient-form"
          variant="contained"
          disabled={createPatientMutation.isPending}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
      </DialogActions>
    </Dialog>
  );
};
