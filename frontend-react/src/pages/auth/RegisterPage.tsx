import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Container, Box, Paper, Alert } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { RegisterRequest } from "@/lib";
import {
  AuthHeader,
  RegisterFormFields,
  RegisterFormActions,
} from "@/components/auth";

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
      style={{}}
    >
      <Container maxWidth="md">
        <AuthHeader title="MediNote AI" subtitle="Create your account" />

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

              <RegisterFormFields
                control={control}
                errors={errors}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />

              <RegisterFormActions isLoading={isLoading} />
            </Box>
          </form>
        </Paper>
      </Container>
    </div>
  );
};
