import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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
import Logo from "@/components/Logo";
import { Visibility, VisibilityOff, PersonAdd } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { RegisterRequest } from "@/lib";

const ROLES = [
  { value: "AUDIOLOGISTS", label: "Audiologist" },
  { value: "HEARING_AID_SPECIALISTS", label: "Hearing Aid Specialist" },
  { value: "ENT_PHYSICIANS", label: "ENT Physician" },
  { value: "CLINICAL_SUPPORT_STAFF", label: "Clinical Support Staff" },
];

export const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const onSubmit = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await registerUser(data);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Container maxWidth="md">
        <Box textAlign="center" mb={4}>
          <Box
            display="flex"
            justifyContent="center"
            mb={2}
            sx={{
              backgroundColor: "rgba(255,255,255,0.1)",
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
          <Typography
            variant="h4"
            component="h1"
            fontWeight={800}
            gutterBottom
            sx={{ color: "white" }}
          >
            MediNote AI
          </Typography>
          <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.9)" }}>
            Create your account
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: "white",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
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
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
