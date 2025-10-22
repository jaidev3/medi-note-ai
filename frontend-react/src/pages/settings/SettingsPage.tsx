import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  Alert,
  Avatar,
  useTheme,
  useMediaQuery,
  Grid,
  Divider,
  CircularProgress,
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
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfessional } from "@/hooks/useUsersApi";
import { EnhancedCard, EnhancedButton } from "@/components/ui";

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
        py: { xs: 3, md: 5 },
        px: { xs: 2, md: 3 },
      }}
    >
      <Container maxWidth="md">
        {/* Header Section */}
        <Box sx={{ mb: 4, textAlign: { xs: "center", md: "left" } }}>
          <Typography
            variant="h3"
            component="h1"
            fontWeight={700}
            gutterBottom
            sx={{
              fontSize: { xs: "2rem", md: "2.5rem" },
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Account Settings
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={400}>
            Manage your profile information and preferences
          </Typography>
        </Box>

        {!user ? (
          <EnhancedCard>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                User profile not available.
              </Alert>
              <EnhancedButton
                variant="outlined"
                onClick={() => navigate("/dashboard")}
                startIcon={<ArrowBack />}
              >
                Back to Dashboard
              </EnhancedButton>
            </Box>
          </EnhancedCard>
        ) : (
          <Grid container spacing={3}>
            {/* Profile Summary Card */}
            <Grid item xs={12} md={4}>
              <EnhancedCard color="primary">
                <Box sx={{ textAlign: "center" }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: "auto",
                      mb: 2,
                      fontSize: "2rem",
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    }}
                  >
                    {getInitials(formState.name || user.email)}
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {formState.name || "User Name"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {user.email}
                  </Typography>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      background: `${theme.palette.primary.main}10`,
                      border: `1px solid ${theme.palette.primary.main}30`,
                    }}
                  >
                    <Typography variant="body2" fontWeight={500}>
                      {user.role}
                    </Typography>
                  </Box>
                </Box>
              </EnhancedCard>
            </Grid>

            {/* Edit Profile Form */}
            <Grid item xs={12} md={8}>
              <EnhancedCard>
                <Box component="form" onSubmit={handleSubmit}>
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
                          onChange={handleFieldChange("name")}
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
                          value={user.email}
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
                          onChange={handleFieldChange("phone_number")}
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
                          onChange={handleFieldChange("department")}
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
                          onChange={handleFieldChange("employee_id")}
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
                      onClick={() => navigate("/dashboard")}
                      startIcon={<ArrowBack />}
                      fullWidth={isMobile}
                    >
                      Back to Dashboard
                    </EnhancedButton>
                    <EnhancedButton
                      gradient
                      type="submit"
                      disabled={!hasChanges || updateProfessional.isPending}
                      startIcon={
                        updateProfessional.isPending ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <Save />
                        )
                      }
                      fullWidth={isMobile}
                    >
                      {updateProfessional.isPending ? "Saving..." : "Save Changes"}
                    </EnhancedButton>
                  </Stack>
                </Box>
              </EnhancedCard>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};
