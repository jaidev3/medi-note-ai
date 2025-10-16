import React from "react";
import { Paper, Typography, Box, TextField, Button } from "@mui/material";
import { Delete } from "@mui/icons-material";

interface PatientInfoFormProps {
  formState: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  isDirty: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
}

export const PatientInfoForm: React.FC<PatientInfoFormProps> = ({
  formState,
  isDirty,
  isUpdating,
  isDeleting,
  onInputChange,
  onSubmit,
  onDelete,
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Patient Information
      </Typography>
      <Box component="form" onSubmit={onSubmit}>
        <TextField
          label="Full Name"
          name="name"
          value={formState.name}
          onChange={onInputChange}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Email"
          name="email"
          value={formState.email}
          onChange={onInputChange}
          fullWidth
          margin="normal"
          type="email"
        />

        <TextField
          label="Phone"
          name="phone"
          value={formState.phone}
          onChange={onInputChange}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Address"
          name="address"
          value={formState.address}
          onChange={onInputChange}
          fullWidth
          margin="normal"
          multiline
          minRows={3}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 3,
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            color="error"
            startIcon={<Delete />}
            onClick={onDelete}
            disabled={isDeleting}
          >
            Delete Patient
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={!isDirty || isUpdating}
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
