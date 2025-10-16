import React from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { Send } from "@mui/icons-material";

interface TranscriptInputProps {
  transcript: string;
  isGenerating: boolean;
  isDisabled: boolean;
  onTranscriptChange: (value: string) => void;
  onGenerate: () => void;
}

export const TranscriptInput: React.FC<TranscriptInputProps> = ({
  transcript,
  isGenerating,
  isDisabled,
  onTranscriptChange,
  onGenerate,
}) => {
  return (
    <Paper sx={{ p: 3, flex: 1 }}>
      <Typography variant="h6" gutterBottom>
        Conversation Transcript
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={20}
        value={transcript}
        onChange={(e) => onTranscriptChange(e.target.value)}
        placeholder="Enter patient conversation transcript here..."
        variant="outlined"
      />
      <Button
        variant="contained"
        fullWidth
        startIcon={isGenerating ? <CircularProgress size={20} /> : <Send />}
        onClick={onGenerate}
        disabled={isDisabled}
        sx={{ mt: 2 }}
      >
        {isGenerating ? "Generating..." : "Generate SOAP Note"}
      </Button>
    </Paper>
  );
};
