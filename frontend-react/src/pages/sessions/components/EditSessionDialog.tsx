import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
} from "@mui/material";

interface EditSessionDialogProps {
  open: boolean;
  visitDate: string;
  notes: string;
  onVisitDateChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const EditSessionDialog: React.FC<EditSessionDialogProps> = ({
  open,
  visitDate,
  notes,
  onVisitDateChange,
  onNotesChange,
  onSave,
  onCancel,
  isSaving,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Edit Session Details</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Visit Date"
            type="datetime-local"
            value={visitDate}
            onChange={(e) => onVisitDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Session Notes"
            multiline
            rows={4}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Update notes captured during the visit"
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};