import React from "react";
import {
  Box,
  Stack,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";

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
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: "divider",
        backgroundColor: "white",
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          placeholder="Ask a question..."
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={3}
          disabled={!patientId || isLoading}
          size="small"
        />
        <Button
          variant="contained"
          onClick={onSendMessage}
          disabled={!patientId || isLoading || !inputMessage.trim()}
          sx={{ alignSelf: "flex-end" }}
        >
          {isLoading ? <CircularProgress size={20} /> : <SendIcon />}
        </Button>
      </Stack>
    </Box>
  );
};
