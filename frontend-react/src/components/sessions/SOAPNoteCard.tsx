import React from "react";
import { Box, Typography, Button, Stack, Chip, Grid } from "@mui/material";
import type { SOAPNoteResponse } from "@/lib";

interface SOAPNoteCardProps {
  note: SOAPNoteResponse;
  patientName?: string;
  onApprove: (noteId: string, approved: boolean) => void;
  onExportPdf: (noteId: string, fileName: string) => void;
  onTriggerEmbedding: (noteId: string) => void;
  isApproving: boolean;
  isExporting: boolean;
  isTriggeringEmbedding: boolean;
}

export const SOAPNoteCard: React.FC<SOAPNoteCardProps> = ({
  note,
  patientName,
  onApprove,
  onExportPdf,
  onTriggerEmbedding,
  isApproving,
  isExporting,
  isTriggeringEmbedding,
}) => {
  const shortId = note.note_id.slice(0, 8).toUpperCase();
  const readableCreated = new Date(note.created_at).toLocaleString();

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        border: "1px solid #eee",
        borderRadius: 1,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
      >
        <Box>
          <Typography variant="subtitle2">
            {readableCreated} — Note {shortId}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            <Chip
              label={note.ai_approved ? "AI approved" : "AI check"}
              color={note.ai_approved ? "success" : "warning"}
              size="small"
            />
            <Chip
              label={
                note.user_approved ? "User approved" : "Awaiting user review"
              }
              color={note.user_approved ? "success" : "default"}
              size="small"
            />
            {note.context_data && (
              <Chip label="Context attached" size="small" />
            )}
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            size="small"
            variant="contained"
            onClick={() => onApprove(note.note_id, true)}
            disabled={isApproving}
          >
            {isApproving ? "Saving..." : "Approve"}
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onApprove(note.note_id, false)}
            disabled={isApproving}
          >
            Needs edits
          </Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
        <Button
          size="small"
          onClick={() =>
            onExportPdf(note.note_id, patientName || `soap-note-${shortId}`)
          }
          disabled={isExporting}
        >
          {isExporting ? "Exporting..." : "Export PDF"}
        </Button>
        <Button
          size="small"
          onClick={() => onTriggerEmbedding(note.note_id)}
          disabled={isTriggeringEmbedding}
        >
          {isTriggeringEmbedding ? "Triggering..." : "Trigger embedding"}
        </Button>
      </Stack>

      {note.soap_note ? (
        <Grid container spacing={1} sx={{ mt: 1 }}>
          {Object.entries(note.soap_note).map(([section, secData]) => (
            <Grid item xs={12} md={6} key={section}>
              <Typography variant="subtitle2">
                {section.toUpperCase()}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {(secData as { content?: string })?.content ?? JSON.stringify(secData)}
              </Typography>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(note.content, null, 2)}
        </Typography>
      )}
    </Box>
  );
};
