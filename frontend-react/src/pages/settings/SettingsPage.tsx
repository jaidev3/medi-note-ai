import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Stack,
  Alert,
} from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfessional } from "@/hooks/useUsersApi";

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const updateProfessional = useUpdateProfessional();

  const [formState, setFormState] = useState({
    name: "",
    department: "",
    employee_id: "",
    phone_number: "",
  });
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      setFormState({
        name: user.name || "",
        department: user.department || "",
        employee_id: user.employee_id || "",
        phone_number: user.phone_number || "",
      });
      setHasChanges(false);
    }
  }, [user?.id]);

  const handleFieldChange =
    (field: keyof typeof formState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
      setHasChanges(true);
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setFeedback(null);

    try {
      await updateProfessional.mutateAsync({
        id: user.id,
        data: {
          name: formState.name || undefined,
          department: formState.department || undefined,
          employee_id: formState.employee_id || undefined,
          phone_number: formState.phone_number || undefined,
        },
      });

      await refreshUser();
      setFeedback({
        type: "success",
        message: "Profile updated successfully.",
      });
      setHasChanges(false);
    } catch (error: any) {
      const message = error?.message || "Failed to update profile.";
      setFeedback({ type: "error", message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Account Settings
          </Typography>

          {!user ? (
            <Alert severity="warning">User profile not available.</Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              {feedback && (
                <Alert severity={feedback.type} sx={{ mb: 2 }}>
                  {feedback.message}
                </Alert>
              )}

              <Stack spacing={2}>
                <TextField
                  label="Name"
                  value={formState.name}
                  onChange={handleFieldChange("name")}
                  fullWidth
                />
                <TextField
                  label="Email"
                  value={user.email}
                  fullWidth
                  disabled
                />
                <TextField label="Role" value={user.role} fullWidth disabled />
                <TextField
                  label="Department"
                  value={formState.department}
                  onChange={handleFieldChange("department")}
                  fullWidth
                />
                <TextField
                  label="Employee ID"
                  value={formState.employee_id}
                  onChange={handleFieldChange("employee_id")}
                  fullWidth
                />
                <TextField
                  label="Phone Number"
                  value={formState.phone_number}
                  onChange={handleFieldChange("phone_number")}
                  fullWidth
                />
              </Stack>

              <Stack
                direction="row"
                spacing={2}
                justifyContent="flex-end"
                sx={{ mt: 4 }}
              >
                <Button
                  variant="outlined"
                  onClick={() => navigate("/dashboard")}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={!hasChanges || updateProfessional.isPending}
                >
                  {updateProfessional.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>
      </Container>
    </div>
  );
};
