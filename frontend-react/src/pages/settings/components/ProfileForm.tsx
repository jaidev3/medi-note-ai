import React from "react";
import {
  Box,
  Typography,
  TextField,
  Stack,
  Alert,
  Divider,
  CircularProgress,
  Grid,
} from "@mui/material";
import {
  Person,
  Email,
  Business,
  Badge,
  Phone,
  ArrowBack,
  Save,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { EnhancedCard, EnhancedButton } from "@/components/ui";

interface ProfileFormProps {
  formState: {
    name: string;
    department: string;
    employee_id: string;
    phone_number: string;
  };
  userEmail: string;
  feedback: { type: "success" | "error"; message: string } | null;
  hasChanges: boolean;
  isSaving: boolean;
  isMobile: boolean;
  onFieldChange: (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent) => void;
  onBackToDashboard: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  formState,
  userEmail,
  feedback,
  hasChanges,
  isSaving,
  isMobile,
  onFieldChange,
  onSubmit,
  onBackToDashboard,
}) => {
  return (
    <EnhancedCard>
      <Box component="form" onSubmit={onSubmit}>
        {feedback && (
          <Alert
            severity={feedback.type}
            sx={{ mb: 3 }}
            icon={feedback.type === "success" ? <CheckCircle /> : <ErrorIcon />}
          >
            {feedback.message}
          </Alert>
        )}

        {/* Personal Information Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Personal Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Full Name"
                value={formState.name}
                onChange={onFieldChange("name")}
                fullWidth
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: "action.active" }} />,
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email Address"
                value={userEmail}
                fullWidth
                disabled
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: "action.active" }} />,
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Phone Number"
                value={formState.phone_number}
                onChange={onFieldChange("phone_number")}
                fullWidth
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: "action.active" }} />,
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Professional Information Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Professional Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Department"
                value={formState.department}
                onChange={onFieldChange("department")}
                fullWidth
                InputProps={{
                  startAdornment: <Business sx={{ mr: 1, color: "action.active" }} />,
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Employee ID"
                value={formState.employee_id}
                onChange={onFieldChange("employee_id")}
                fullWidth
                InputProps={{
                  startAdornment: <Badge sx={{ mr: 1, color: "action.active" }} />,
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Action Buttons */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent={{ xs: "stretch", sm: "flex-end" }}
          sx={{ mt: 4 }}
        >
          <EnhancedButton
            variant="outlined"
            onClick={onBackToDashboard}
            startIcon={<ArrowBack />}
            fullWidth={isMobile}
          >
            Back to Dashboard
          </EnhancedButton>
          <EnhancedButton
            gradient
            type="submit"
            disabled={!hasChanges || isSaving}
            startIcon={
              isSaving ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Save />
              )
            }
            fullWidth={isMobile}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </EnhancedButton>
        </Stack>
      </Box>
    </EnhancedCard>
  );
};