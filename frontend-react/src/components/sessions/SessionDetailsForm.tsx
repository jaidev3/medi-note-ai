import React from "react";
import { Paper, Typography, Box, TextField, Button } from "@mui/material";
import { Delete } from "@mui/icons-material";

interface SessionDetailsFormProps {
  visitDate: string;
  notes: string;
  isDirty: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  onVisitDateChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onDelete: () => void;
}

export const SessionDetailsForm: React.FC<SessionDetailsFormProps> = ({
  visitDate,
  notes,
  isDirty,
  isUpdating,
  isDeleting,
  onVisitDateChange,
  onNotesChange,
  onSubmit,
  onDelete,
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Visit Details
      </Typography>
      <Box component="form" onSubmit={onSubmit}>
        <TextField
          label="Visit Date"
          type="datetime-local"
          fullWidth
          margin="normal"
          value={visitDate}
          onChange={(event) => onVisitDateChange(event.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Session Notes"
          fullWidth
          multiline
          minRows={4}
          margin="normal"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Update notes captured during the visit"
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
            Delete Session
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
