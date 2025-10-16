import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ClearAll as ClearAllIcon,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface Patient {
  id: string;
  name: string;
}

interface Session {
  session_id: string;
  visit_date: string;
}

interface RAGHeaderProps {
  patientId: string;
  sessionId: string;
  patients: Patient[];
  sessions: Session[];
  messages: Message[];
  onPatientChange: (patientId: string) => void;
  onSessionChange: (sessionId: string) => void;
  onClearChat: () => void;
  onDownloadTranscript: () => void;
}

export const RAGHeader: React.FC<RAGHeaderProps> = ({
  patientId,
  sessionId,
  patients,
  sessions,
  messages,
  onPatientChange,
  onSessionChange,
  onClearChat,
  onDownloadTranscript,
}) => {
  return (
    <Paper sx={{ p: 3, mb: 3, boxShadow: 1 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 2 }}>
        Ask About Patient Records
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select a patient and ask any question about their medical history,
        visits, or notes
      </Typography>

      {/* Selected patient/session chips */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          gap: 1,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {patientId && (
          <Chip
            label={patients.find((p) => p.id === patientId)?.name || "Patient"}
            color="primary"
            size="small"
          />
        )}
        {sessionId && (
          <Chip
            label={
              sessions.find((s) => s.session_id === sessionId)?.visit_date
                ? new Date(
                    sessions.find((s) => s.session_id === sessionId)!.visit_date
                  ).toLocaleDateString()
                : "Session"
            }
            size="small"
          />
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "flex-start",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl fullWidth sx={{ maxWidth: 400 }}>
            <InputLabel>Select Patient</InputLabel>
            <Select
              value={patientId}
              onChange={(e) => onPatientChange(e.target.value)}
              label="Select Patient"
            >
              <MenuItem value="">Choose a patient...</MenuItem>
              {patients.map((patient) => (
                <MenuItem key={patient.id} value={patient.id}>
                  {patient.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ maxWidth: 400 }}>
            <InputLabel>Session (Optional)</InputLabel>
            <Select
              value={sessionId}
              onChange={(e) => onSessionChange(e.target.value)}
              label="Session (Optional)"
              disabled={!patientId}
            >
              <MenuItem value="">All Sessions</MenuItem>
              {sessions.map((session) => (
                <MenuItem key={session.session_id} value={session.session_id}>
                  {new Date(session.visit_date).toLocaleDateString()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Button
            variant="outlined"
            startIcon={<ClearAllIcon />}
            onClick={onClearChat}
            disabled={messages.length === 0}
          >
            Clear Chat
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={onDownloadTranscript}
            disabled={messages.length === 0}
          >
            Download Transcript
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};
