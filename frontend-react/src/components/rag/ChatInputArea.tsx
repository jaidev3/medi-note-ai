import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Typography,
} from "@mui/material";
import { Send as SendIcon, Mic as MicIcon, AttachFile as AttachIcon } from "@mui/icons-material";

interface ChatInputAreaProps {
  inputMessage: string;
  patientId: string;
  isLoading: boolean;
  error?: { message: string } | null;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  inputMessage,
  patientId,
  isLoading,
  error,
  onInputChange,
  onSendMessage,
}) => {
  const [isRecording, setIsRecording] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording functionality
  };

  const handleAttachClick = () => {
    // TODO: Implement file attachment functionality
  };

  const getPlaceholderText = () => {
    if (!patientId) return "Select a patient first to start asking questions...";
    if (isLoading) return "AI is processing your request...";
    return "Ask about patient history, medications, diagnoses, or any medical details...";
  };

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 3,
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e2e8f0",
      }}
    >
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            borderRadius: 2,
            "& .MuiAlert-message": { fontSize: "14px" }
          }}
        >
          {error.message}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 1.5,
          p: 1.5,
          borderRadius: 2,
          background: "white",
          border: "2px solid #e2e8f0",
          transition: "all 0.2s ease-in-out",
          "&:focus-within": {
            borderColor: "#3b82f6",
            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
          },
        }}
      >
        <Tooltip title="Attach file (coming soon)">
          <IconButton
            size="small"
            onClick={handleAttachClick}
            disabled={!patientId || isLoading}
            sx={{
              color: "#64748b",
              "&:hover": { color: "#3b82f6", bgcolor: "rgba(59, 130, 246, 0.04)" },
              "&:disabled": { color: "#cbd5e1" },
            }}
          >
            <AttachIcon />
          </IconButton>
        </Tooltip>

        <TextField
          fullWidth
          placeholder={getPlaceholderText()}
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={4}
          disabled={!patientId || isLoading}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: "14px",
              "& .MuiInputBase-input::placeholder": {
                color: "#94a3b8",
                fontSize: "14px",
              },
              "& .MuiInputBase-input": {
                py: 1,
              },
            },
          }}
        />

        <Tooltip title={isRecording ? "Stop recording" : "Voice input (coming soon)"}>
          <IconButton
            size="small"
            onClick={handleMicClick}
            disabled={!patientId || isLoading}
            sx={{
              color: isRecording ? "#ef4444" : "#64748b",
              "&:hover": {
                color: isRecording ? "#dc2626" : "#3b82f6",
                bgcolor: isRecording ? "rgba(239, 68, 68, 0.04)" : "rgba(59, 130, 246, 0.04)"
              },
              "&:disabled": { color: "#cbd5e1" },
              animation: isRecording ? "pulse 1.5s infinite" : "none",
            }}
          >
            <MicIcon />
          </IconButton>
        </Tooltip>

        <Button
          variant="contained"
          onClick={onSendMessage}
          disabled={!patientId || isLoading || !inputMessage.trim()}
          sx={{
            minWidth: 44,
            height: 44,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              boxShadow: "0 6px 16px rgba(59, 130, 246, 0.4)",
              transform: "translateY(-1px)",
            },
            "&:disabled": {
              background: "#e2e8f0",
              boxShadow: "none",
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          {isLoading ? (
            <CircularProgress size={20} sx={{ color: "white" }} />
          ) : (
            <SendIcon sx={{ fontSize: 18 }} />
          )}
        </Button>
      </Box>

      {!patientId && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 1.5,
            color: "#64748b",
            textAlign: "center",
            fontSize: "12px",
          }}
        >
          💡 Select a patient above to start analyzing their medical records
        </Typography>
      )}
    </Paper>
  );
};
