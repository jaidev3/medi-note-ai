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
} from "@mui/material";
import Logo from "@/components/Logo";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModals } from "@/contexts/AuthModalsContext";
import { LoginRequest } from "@/lib";

export const LoginModal: React.FC = () => {
  const { login } = useAuth();
  const { isLoginModalOpen, closeLoginModal, switchToSignup } = useAuthModals();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginRequest>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleClose = () => {
    closeLoginModal();
    reset();
    setError(null);
    setShowPassword(false);
  };

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(data);
      handleClose();
    } catch (err: any) {
      setError(err?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isLoginModalOpen}
      onClose={handleClose}
      maxWidth="sm"
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
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to continue to MediNote AI
          </Typography>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box display="flex" flexDirection="column" gap={3}>
            {error && <Alert severity="error">{error}</Alert>}

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
                  autoComplete="current-password"
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
              disabled={isLoading}
              startIcon={<LoginIcon />}
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
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{" "}
                <Link
                  component="button"
                  type="button"
                  onClick={switchToSignup}
                  underline="hover"
                  sx={{ cursor: "pointer" }}
                >
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
  );
};
