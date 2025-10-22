import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Grid,
  Alert,
} from "@mui/material";
import {
  ArrowBack,
} from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfessional } from "@/hooks/useUsersApi";
import { EnhancedCard, EnhancedButton } from "@/components/ui";
import { ProfileSummaryCard } from "./components/ProfileSummaryCard";
import { ProfileForm } from "./components/ProfileForm";

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
    (field: string) =>
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
            <Grid item xs={12} md={4}>
              <ProfileSummaryCard
                userName={formState.name}
                userEmail={user.email}
                userRole={user.role}
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <ProfileForm
                formState={formState}
                userEmail={user.email}
                feedback={feedback}
                hasChanges={hasChanges}
                isSaving={updateProfessional.isPending}
                isMobile={isMobile}
                onFieldChange={handleFieldChange}
                onSubmit={handleSubmit}
                onBackToDashboard={() => navigate("/dashboard")}
              />
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};
