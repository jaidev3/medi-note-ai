import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import {
  Container,
  Box,
  Paper,
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
import { Visibility, VisibilityOff, PersonAdd } from "@mui/icons-material";
import { useRegister, useLogin } from "@/hooks/useAuthApi";
import { RegisterRequest } from "@/lib";

const ROLES = [
  { value: "AUDIOLOGISTS", label: "Audiologist" },
  { value: "HEARING_AID_SPECIALISTS", label: "Hearing Aid Specialist" },
  { value: "ENT_PHYSICIANS", label: "ENT Physician" },
  { value: "CLINICAL_SUPPORT_STAFF", label: "Clinical Support Staff" },
];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: register, isPending, isError, error } = useRegister();
  const { mutate: login } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterRequest>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "AUDIOLOGISTS",
      department: "",
      employee_id: "",
      phone_number: "",
    },
  });

  const onSubmit = (data: RegisterRequest) => {
    register(data, {
      onSuccess: () => {
        // Auto-login after registration
        login(
          { email: data.email, password: data.password },
          {
            onSuccess: () => {
              navigate("/dashboard");
            },
          }
        );
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Container maxWidth="md">
        <Box textAlign="center" mb={4}>
          <Typography
            variant="h3"
            component="h1"
            fontWeight="bold"
            gutterBottom
          >
            MediNote AI
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Create your account
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box display="flex" flexDirection="column" gap={3}>
              {isError && (
                <Alert severity="error">
                  {error instanceof Error
                    ? error.message
                    : "Registration failed. Please try again."}
                </Alert>
              )}

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
                        value: 6,
                        message: "Password must be at least 6 characters",
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
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
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
                    name="role"
                    control={control}
                    rules={{ required: "Role is required" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        select
                        label="Role"
                        error={!!errors.role}
                        helperText={errors.role?.message}
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
                disabled={isPending}
                startIcon={<PersonAdd />}
                sx={{ py: 1.5 }}
              >
                {isPending ? "Creating account..." : "Create Account"}
              </Button>

              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{" "}
                  <Link component={RouterLink} to="/login" underline="hover">
                    Sign in
                  </Link>
                </Typography>
              </Box>
            </Box>
          </form>
        </Paper>
      </Container>
    </div>
  );
};
