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
  Fade,
} from "@mui/material";
import {
  ClearAll as ClearAllIcon,
  FileDownload as FileDownloadIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  History as HistoryIcon,
  Chat as ChatIcon,
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
    <Fade in timeout={500}>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e2e8f0",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              boxShadow: "0 8px 20px rgba(59, 130, 246, 0.3)",
            }}
          >
            <MedicalIcon sx={{ fontSize: 28, color: "white" }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 0.5,
              }}
            >
              AI Medical Assistant
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#64748b",
                fontSize: "15px",
                lineHeight: 1.5,
              }}
            >
              Intelligent analysis of patient records through natural conversation
            </Typography>
          </Box>

          {patientName && (
            <Fade in timeout={600}>
              <Tooltip title={`Currently viewing: ${patientName}`} placement="top">
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1.5,
                    borderRadius: 2,
                    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                    border: "1px solid #bae6fd",
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    {patientName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "#0c4a6e" }}
                  >
                    {patientName}
                  </Typography>
                </Box>
              </Tooltip>
            </Fade>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 2, flex: 1, minWidth: 280 }}>
            <FormControl
              fullWidth
              sx={{ maxWidth: 400 }}
              size="small"
              variant="outlined"
            >
              <InputLabel
                id="select-patient-label"
                sx={{
                  fontSize: "14px",
                  "&.Mui-focused": { color: "#3b82f6" },
                }}
              >
                Select Patient
              </InputLabel>
              <Select
                labelId="select-patient-label"
                value={patientId}
                onChange={(e) => onPatientChange(e.target.value)}
                label="Select Patient"
                sx={{
                  borderRadius: 2,
                  fontSize: "14px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e2e8f0",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#cbd5e1",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#3b82f6",
                    borderWidth: 2,
                  },
                }}
              >
                <MenuItem value="" sx={{ fontSize: "14px" }}>
                  <em>Choose a patient to begin...</em>
                </MenuItem>
                {patients.map((patient) => (
                  <MenuItem
                    key={patient.id}
                    value={patient.id}
                    sx={{ fontSize: "14px" }}
                  >
                    {patient.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl
              fullWidth
              sx={{ maxWidth: 300 }}
              size="small"
              variant="outlined"
            >
              <InputLabel
                id="select-session-label"
                sx={{
                  fontSize: "14px",
                  "&.Mui-focused": { color: "#3b82f6" },
                }}
              >
                Specific Visit (Optional)
              </InputLabel>
              <Select
                labelId="select-session-label"
                value={sessionId}
                onChange={(e) => onSessionChange(e.target.value)}
                label="Specific Visit (Optional)"
                disabled={!patientId}
                sx={{
                  borderRadius: 2,
                  fontSize: "14px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e2e8f0",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#cbd5e1",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#3b82f6",
                    borderWidth: 2,
                  },
                }}
              >
                <MenuItem value="" sx={{ fontSize: "14px" }}>
                  <em>All Visits</em>
                </MenuItem>
                {sessions.map((session) => (
                  <MenuItem
                    key={session.session_id}
                    value={session.session_id}
                    sx={{ fontSize: "14px" }}
                  >
                    {new Date(session.visit_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Button
              variant="outlined"
              startIcon={<ClearAllIcon />}
              onClick={handleClearClick}
              disabled={messages.length === 0}
              sx={{
                borderRadius: 2,
                fontSize: "14px",
                fontWeight: 500,
                px: 2,
                py: 1,
                borderColor: "#e2e8f0",
                color: "#64748b",
                "&:hover": {
                  borderColor: "#cbd5e1",
                  bgcolor: "rgba(100, 116, 139, 0.04)",
                  color: "#475569",
                },
                "&:disabled": {
                  borderColor: "#f1f5f9",
                  color: "#cbd5e1",
                },
              }}
            >
              Clear
            </Button>

            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={openMenu}
              disabled={messages.length === 0}
              sx={{
                borderRadius: 2,
                fontSize: "14px",
                fontWeight: 500,
                px: 2,
                py: 1,
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
                  transform: "translateY(-1px)",
                },
                "&:disabled": {
                  background: "#e2e8f0",
                  boxShadow: "none",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              Export
            </Button>
          </Stack>
        </Box>

        {/* Enhanced context chips */}
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {patientId && (
            <Chip
              icon={<PersonIcon sx={{ fontSize: 16 }} />}
              label={patientName || "Patient"}
              sx={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "white",
                fontSize: "12px",
                fontWeight: 500,
                height: 28,
                "& .MuiChip-icon": { color: "white" },
              }}
            />
          )}
          {sessionId && (
            <Chip
              icon={<HistoryIcon sx={{ fontSize: 16 }} />}
              label={sessionLabel || "Specific Visit"}
              sx={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                fontSize: "12px",
                fontWeight: 500,
                height: 28,
                "& .MuiChip-icon": { color: "white" },
              }}
            />
          )}
          <Chip
            icon={<ChatIcon sx={{ fontSize: 16 }} />}
            label={`${messages.length} message${messages.length !== 1 ? "s" : ""}`}
            sx={{
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "white",
              fontSize: "12px",
              fontWeight: 500,
              height: 28,
              "& .MuiChip-icon": { color: "white" },
            }}
          />
        </Box>

        <Dialog
          open={confirmOpen}
          onClose={handleCancelClear}
          aria-labelledby="confirm-clear-title"
          PaperProps={{
            sx: { borderRadius: 3 },
          }}
        >
          <DialogTitle
            id="confirm-clear-title"
            sx={{ pb: 1, fontSize: "18px", fontWeight: 600 }}
          >
            Clear conversation history?
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <DialogContentText sx={{ fontSize: "14px", color: "#64748b" }}>
              This will permanently remove all messages from the current conversation
              with {patientName || "the selected patient"}. This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleCancelClear}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                color: "#64748b",
              }}
            >
              Cancel
            </Button>
            <Button
              color="error"
              onClick={handleConfirmClear}
              autoFocus
              variant="contained"
              sx={{
                textTransform: "none",
                fontWeight: 500,
                borderRadius: 2,
              }}
            >
              Clear Chat
            </Button>
          </DialogActions>
        </Dialog>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={closeMenu}
          PaperProps={{
            sx: { borderRadius: 2, minWidth: 180 },
          }}
        >
          <MenuItemInner
            onClick={() => handleDownload()}
            sx={{ fontSize: "14px", py: 1.5 }}
          >
            📄 Download as Text
          </MenuItemInner>
          <MenuItemInner
            onClick={() => handleDownload()}
            sx={{ fontSize: "14px", py: 1.5 }}
          >
            📊 Download as JSON
          </MenuItemInner>
        </Menu>
      </Paper>
    </Fade>
  );
};
