import React from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Box,
  Chip,
} from "@mui/material";
import { Send, Description } from "@mui/icons-material";

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
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  return (
    <Paper
      sx={{
        p: 3,
        flex: 1,
        borderRadius: 3,
        border: "1px solid #e8ebf8",
        boxShadow: "0 4px 20px rgba(102, 126, 234, 0.08)",
      }}
    >
      <Box display="flex" alignItems="center" mb={2}>
        <Description color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" fontWeight={600}>
          Conversation Transcript
        </Typography>
        {wordCount > 0 && (
          <Chip
            label={`${wordCount} words`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ ml: 'auto' }}
          />
        )}
      </Box>

      <TextField
        fullWidth
        multiline
        rows={18}
        value={transcript}
        onChange={(e) => onTranscriptChange(e.target.value)}
        placeholder="Enter patient conversation transcript here...
Example:
Patient: 'I've been experiencing frequent headaches for the past two weeks. They usually start in the morning and get worse throughout the day.'
Doctor: 'Can you describe the pain? Is it sharp or dull?'
Patient: 'It's a dull, throbbing pain, mostly in my forehead. Sometimes I feel nauseous too.'"
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
          },
        }}
      />

      <Box mt={2} display="flex" alignItems="center" gap={1}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <Send />}
          onClick={onGenerate}
          disabled={isDisabled}
          sx={{
            borderRadius: 2,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
            },
          }}
        >
          {isGenerating ? "Generating SOAP Note..." : "Generate SOAP Note"}
        </Button>
      </Box>

      {isDisabled && transcript.trim() && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Please select a professional and session to generate SOAP notes
        </Typography>
      )}
    </Paper>
  );
};
