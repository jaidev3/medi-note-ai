import React, { useMemo, useState } from "react";
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
  Avatar,
  IconButton,
  Menu,
  MenuItem as MenuItemInner,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from "@mui/material";
import {
  ClearAll as ClearAllIcon,
  FileDownload as FileDownloadIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const patientName = useMemo(
    () => patients.find((p) => p.id === patientId)?.name || "",
    [patients, patientId]
  );

  const sessionLabel = useMemo(() => {
    const s = sessions.find((s) => s.session_id === sessionId);
    return s?.visit_date ? new Date(s.visit_date).toLocaleDateString() : "";
  }, [sessions, sessionId]);

  const openMenu = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handleClearClick = () => setConfirmOpen(true);
  const handleConfirmClear = () => {
    setConfirmOpen(false);
    onClearChat();
  };
  const handleCancelClear = () => setConfirmOpen(false);

  const handleDownload = () => {
    closeMenu();
    // Currently the parent handles the transcript format. If needed,
    // extend onDownloadTranscript to accept a format argument.
    onDownloadTranscript();
  };

  return (
    <Paper sx={{ p: 3, mb: 3, boxShadow: 1 }}>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 1 }}>
        <Avatar sx={{ bgcolor: "primary.main", mr: 1 }} aria-hidden>
          {patientName ? patientName.charAt(0).toUpperCase() : <PersonIcon />}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Ask about patient records
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a patient and ask questions about their history, visits, or
            notes.
          </Typography>
        </Box>

        <Tooltip title={patientName || "No patient selected"}>
          <IconButton size="small" aria-label="patient-name">
            <Typography variant="body2">{patientName || "—"}</Typography>
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, flex: 1, minWidth: 240 }}>
          <FormControl fullWidth sx={{ maxWidth: 420 }} size="small">
            <InputLabel id="select-patient-label">Patient</InputLabel>
            <Select
              labelId="select-patient-label"
              value={patientId}
              onChange={(e) => onPatientChange(e.target.value)}
              label="Patient"
            >
              <MenuItem value="">Choose a patient...</MenuItem>
              {patients.map((patient) => (
                <MenuItem key={patient.id} value={patient.id}>
                  {patient.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ maxWidth: 320 }} size="small">
            <InputLabel id="select-session-label">
              Session (optional)
            </InputLabel>
            <Select
              labelId="select-session-label"
              value={sessionId}
              onChange={(e) => onSessionChange(e.target.value)}
              label="Session (optional)"
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
            onClick={handleClearClick}
            disabled={messages.length === 0}
            color="inherit"
          >
            Clear Chat
          </Button>

          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={openMenu}
            disabled={messages.length === 0}
          >
            Export
          </Button>

          <IconButton
            aria-label="more"
            size="small"
            onClick={openMenu}
            aria-haspopup="true"
            aria-expanded={Boolean(anchorEl) ? "true" : undefined}
          >
            <MoreVertIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={closeMenu}
          >
            <MenuItemInner onClick={() => handleDownload()}>
              Download .txt
            </MenuItemInner>
            <MenuItemInner onClick={() => handleDownload()}>
              Download .json
            </MenuItemInner>
          </Menu>
        </Stack>
      </Box>

      {/* chips for quick context */}
      <Box
        sx={{
          mt: 2,
          display: "flex",
          gap: 1,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {patientId && (
          <Chip label={patientName || "Patient"} color="primary" size="small" />
        )}
        {sessionId && <Chip label={sessionLabel || "Session"} size="small" />}
        <Chip label={`${messages.length} messages`} size="small" />
      </Box>

      <Dialog
        open={confirmOpen}
        onClose={handleCancelClear}
        aria-labelledby="confirm-clear-title"
      >
        <DialogTitle id="confirm-clear-title">Clear chat?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will remove all messages from the current conversation. This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClear}>Cancel</Button>
          <Button color="error" onClick={handleConfirmClear} autoFocus>
            Clear
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
