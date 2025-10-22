import React from "react";
import { Grid, TextField, MenuItem } from "@mui/material";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { RegisterRequest } from "@/lib";

const ROLES = [
  { value: "AUDIOLOGISTS", label: "Audiologist" },
  { value: "HEARING_AID_SPECIALISTS", label: "Hearing Aid Specialist" },
  { value: "ENT_PHYSICIANS", label: "ENT Physician" },
  { value: "CLINICAL_SUPPORT_STAFF", label: "Clinical Support Staff" },
];

interface RegisterFormFieldsProps {
  control: Control<RegisterRequest>;
  errors: FieldErrors<RegisterRequest>;
  showPassword: boolean;
  onTogglePassword: () => void;
}

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    "&:hover fieldset": { borderColor: "#667eea" },
  },
};

export const RegisterFormFields: React.FC<RegisterFormFieldsProps> = ({
  control,
  errors,
  showPassword,
  onTogglePassword,
}) => {
  return (
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
              sx={fieldStyles}
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
              sx={fieldStyles}
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
              sx={fieldStyles}
              InputProps={{
                endAdornment: (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={onTogglePassword}
                  >
                    <span style={{ color: "#667eea", fontSize: "1.2rem" }}>
                      {showPassword ? "🙈" : "👁️"}
                    </span>
                  </div>
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
              sx={fieldStyles}
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
              sx={fieldStyles}
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
              sx={fieldStyles}
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
              sx={fieldStyles}
            />
          )}
        />
      </Grid>
    </Grid>
  );
};
