import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Button,
  Chip,
} from "@mui/material";
import {
  Close,
  Download,
  Subject,
  Assignment,
  Assessment,
  MedicalServices,
} from "@mui/icons-material";

interface SOAPNoteDialogProps {
  open: boolean;
  soapNote: any | null;
  patientName: string;
  currentTab: number;
  onTabChange: (newValue: number) => void;
  onClose: () => void;
  onExport: (noteId: string, fileName: string) => void;
  isExporting: boolean;
}

export const SOAPNoteDialog: React.FC<SOAPNoteDialogProps> = ({
  open,
  soapNote,
  patientName,
  currentTab,
  onTabChange,
  onClose,
  onExport,
  isExporting,
}) => {
  const tabContent = [
    { label: "Subjective", icon: <Subject />, key: "subjective" },
    { label: "Objective", icon: <Assignment />, key: "objective" },
    { label: "Assessment", icon: <Assessment />, key: "assessment" },
    { label: "Plan", icon: <MedicalServices />, key: "plan" },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          minHeight: 600
        }
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">
          SOAP Note Details - {patientName}
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderBottomColor: "divider", pb: 2, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle1" color="primary">
              {soapNote && new Date(soapNote.created_at).toLocaleDateString()} at {soapNote && new Date(soapNote.created_at).toLocaleTimeString()}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip
                label={soapNote?.approved ? "Approved" : "Draft"}
                color={soapNote?.approved ? "success" : "warning"}
                size="small"
              />
              <Button
                size="small"
                startIcon={<Download />}
                onClick={() => {
                  onExport(
                    soapNote.note_id,
                    `soap-note-${new Date(soapNote.created_at).toISOString().slice(0, 10)}`
                  );
                }}
                disabled={isExporting}
              >
                Export PDF
              </Button>
            </Box>
          </Box>
        </Box>

        <Tabs
          value={currentTab}
          onChange={(_, newValue) => onTabChange(newValue)}
          sx={{ mb: 3 }}
        >
          {tabContent.map((tab) => (
            <Tab key={tab.key} label={tab.label} icon={tab.icon} />
          ))}
        </Tabs>

        <Box sx={{ mt: 2 }}>
          {tabContent.map((tab, index) => (
            index === currentTab && (
              <Box key={tab.key}>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {React.cloneElement(tab.icon, { color: "primary" as any })}
                  {tab.label} ({tab.key[0].toUpperCase()})
                </Typography>
                <Paper variant="outlined" sx={{ p: 3, minHeight: 200 }}>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {soapNote?.content?.[tab.key]?.content || `No ${tab.label.toLowerCase()} information recorded`}
                  </Typography>
                </Paper>
              </Box>
            )
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};