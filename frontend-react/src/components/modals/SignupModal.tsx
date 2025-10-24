import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  MenuItem,
  Grid,
} from "@mui/material";
import Logo from "@/components/Logo";
import {
  Visibility,
  VisibilityOff,
  PersonAdd,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModals } from "@/contexts/AuthModalsContext";
import { RegisterRequest } from "@/lib";

const ROLES = [
  { value: "AUDIOLOGISTS", label: "Audiologist" },
  { value: "HEARING_AID_SPECIALISTS", label: "Hearing Aid Specialist" },
  { value: "ENT_PHYSICIANS", label: "ENT Physician" },
  { value: "CLINICAL_SUPPORT_STAFF", label: "Clinical Support Staff" },
];

export const SignupModal: React.FC = () => {
  const { register: registerUser } = useAuth();
  const { isSignupModalOpen, closeSignupModal, switchToLogin } =
    useAuthModals();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterRequest>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "PROFESSIONAL",
      professional_role: "AUDIOLOGISTS",
      department: "",
      employee_id: "",
      phone_number: "",
    },
  });

  const handleClose = () => {
    closeSignupModal();
    reset();
    setError(null);
    setShowPassword(false);
  };

  const onSubmit = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await registerUser(data);
      handleClose();
    } catch (err: any) {
      // Handle different error types
      let errorMessage = "Registration failed. Please try again.";

      if (err?.message) {
        // If the error message is a string, use it directly
        if (typeof err.message === 'string') {
          errorMessage = err.message;
        }
        // If it's an object (like validation errors), extract the detail
        else if (err.message?.detail) {
          errorMessage = err.message.detail;
        }
        // If it's a validation error with multiple fields, try to extract them
        else if (typeof err.message === 'object') {
          const validationErrors = Object.entries(err.message)
            .map(([field, error]) => `${field}: ${error}`)
            .join(', ');
          errorMessage = validationErrors || errorMessage;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isSignupModalOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 2,
        },
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: "absolute",
          right: 16,
          top: 16,
          color: "grey.500",
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ pt: 4 }}>
        <Box textAlign="center" mb={4}>
          <Box
            display="flex"
            justifyContent="center"
            mb={2}
            sx={{
              backgroundColor: "rgba(102, 126, 234, 0.1)",
              borderRadius: "50%",
              width: 80,
              height: 80,
              mx: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Logo width={64} height={64} aria-hidden={false} />
          </Box>
          <Typography variant="h5" component="h2" fontWeight={700} gutterBottom>
            Create your account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Get started with MediNote AI today
          </Typography>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box display="flex" flexDirection="column" gap={3}>
            {error && <Alert severity="error">{error}</Alert>}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: "Name is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Full Name"
                      autoFocus
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "&:hover fieldset": { borderColor: "#667eea" },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email Address"
                      type="email"
                      autoComplete="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "&:hover fieldset": { borderColor: "#667eea" },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="password"
                  control={control}
                  rules={{
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "&:hover fieldset": { borderColor: "#667eea" },
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              sx={{ color: "#667eea" }}
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="professional_role"
                  control={control}
                  rules={{ required: "Professional role is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Professional Role"
                      error={!!errors.professional_role}
                      helperText={errors.professional_role?.message}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "&:hover fieldset": { borderColor: "#667eea" },
                        },
                      }}
                    >
                      {ROLES.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Department (Optional)"
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "&:hover fieldset": { borderColor: "#667eea" },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="employee_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Employee ID (Optional)"
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "&:hover fieldset": { borderColor: "#667eea" },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="phone_number"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone Number (Optional)"
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "&:hover fieldset": { borderColor: "#667eea" },
                        },
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isLoading}
              startIcon={<PersonAdd />}
              sx={{
                py: 1.5,

                fontWeight: 700,
                textTransform: "none",
                fontSize: "1rem",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 24px rgba(102, 126, 234, 0.4)",
                },
                transition: "all 0.3s ease",
              }}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Already have an account?{" "}
                <Link
                  component="button"
                  type="button"
                  onClick={switchToLogin}
                  underline="hover"
                  sx={{ cursor: "pointer" }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  );
};
