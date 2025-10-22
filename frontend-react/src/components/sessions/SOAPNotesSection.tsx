import React from "react";
import { Paper, Typography, Box, CircularProgress, Alert } from "@mui/material";
import type { SOAPNoteResponse } from "@/lib";
import { SOAPNoteCard } from "./SOAPNoteCard";

interface SOAPNotesSectionProps {
  notes: SOAPNoteResponse[] | undefined;
  patientName?: string;
  isLoading: boolean;
  error: unknown;
  actionFeedback: { type: "success" | "error"; message: string } | null;
  onApprove: (noteId: string, approved: boolean) => void;
  onExportPdf: (noteId: string, fileName: string) => void;
  onTriggerEmbedding: (noteId: string) => void;
  onClearFeedback: () => void;
  isApproving: boolean;
  isExporting: boolean;
  isTriggeringEmbedding: boolean;
}

export const SOAPNotesSection: React.FC<SOAPNotesSectionProps> = ({
  notes,
  patientName,
  isLoading,
  error,
  actionFeedback,
  onApprove,
  onExportPdf,
  onTriggerEmbedding,
  onClearFeedback,
  isApproving,
  isExporting,
  isTriggeringEmbedding,
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        SOAP Notes
      </Typography>

      {actionFeedback && (
        <Alert
          severity={actionFeedback.type}
          sx={{ mb: 2 }}
          onClose={onClearFeedback}
        >
          {actionFeedback.message}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ py: 2, textAlign: "center" }}>
          <CircularProgress size={20} />
        </Box>
      ) : error ? (
        <Alert severity="error">Failed to load SOAP notes.</Alert>
      ) : !notes || notes.length === 0 ? (
        <Alert severity="info">No SOAP notes for this session yet.</Alert>
      ) : (
        notes.map((note) => (
          <SOAPNoteCard
            key={note.note_id}
            note={note}
            patientName={patientName}
            onApprove={onApprove}
            onExportPdf={onExportPdf}
            onTriggerEmbedding={onTriggerEmbedding}
            isApproving={isApproving}
            isExporting={isExporting}
            isTriggeringEmbedding={isTriggeringEmbedding}
          />
        ))
      )}
    </Paper>
  );
};
