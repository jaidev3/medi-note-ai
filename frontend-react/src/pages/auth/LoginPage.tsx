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
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from "@mui/icons-material";
import { useLogin } from "@/hooks/useAuthApi";
import { LoginRequest } from "@/lib";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: login, isPending, isError, error } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginRequest) => {
    login(data, {
      onSuccess: async () => {
        // Get user profile and navigate
        navigate("/dashboard");
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Container maxWidth="sm">
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
            Sign in to your account
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box display="flex" flexDirection="column" gap={3}>
              {isError && (
                <Alert severity="error">
                  {error instanceof Error
                    ? error.message
                    : "Login failed. Please check your credentials."}
                </Alert>
              )}

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
                    autoFocus
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />

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
                    autoComplete="current-password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isPending}
                startIcon={<LoginIcon />}
                sx={{ py: 1.5 }}
              >
                {isPending ? "Signing in..." : "Sign In"}
              </Button>

              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{" "}
                  <Link component={RouterLink} to="/register" underline="hover">
                    Sign up
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
