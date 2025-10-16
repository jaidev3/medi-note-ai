import React from "react";
import {
  Paper,
  Typography,
  Stack,
  Chip,
  Box,
  Alert,
  Button,
  Divider,
} from "@mui/material";
import { SOAPSectionEditor } from "./SOAPSectionEditor";

interface SOAPSection {
  content: string;
  confidence?: number;
  word_count?: number;
}

interface SOAPNote {
  subjective: SOAPSection;
  objective: SOAPSection;
  assessment: SOAPSection;
  plan: SOAPSection;
}

interface ContextData {
  total_entities: number;
  processing_time: number;
}

interface SOAPGenerationResponse {
  note_id?: string;
  soap_note?: SOAPNote | null;
  processing_time: number;
  ai_approved: boolean;
  regeneration_count: number;
  pii_entities_found?: number;
  context_data?: ContextData;
  validation_feedback?: string;
  message?: string;
}

type SOAPSectionKey = "subjective" | "objective" | "assessment" | "plan";

const SECTION_CONFIG: Array<{ key: SOAPSectionKey; label: string }> = [
  { key: "subjective", label: "Subjective" },
  { key: "objective", label: "Objective" },
  { key: "assessment", label: "Assessment" },
  { key: "plan", label: "Plan" },
];

interface SOAPNoteEditorProps {
  generationResult: SOAPGenerationResponse | null;
  editedNote: SOAPNote | null;
  isSaving: boolean;
  onSectionChange: (key: SOAPSectionKey, value: string) => void;
  onSave: () => void;
}

export const SOAPNoteEditor: React.FC<SOAPNoteEditorProps> = ({
  generationResult,
  editedNote,
  isSaving,
  onSectionChange,
  onSave,
}) => {
  return (
    <Paper sx={{ p: 3, flex: 1 }}>
      <Typography variant="h6" gutterBottom>
        Generated SOAP Note
      </Typography>

      {generationResult && (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          <Chip
            label={`Processing: ${generationResult.processing_time.toFixed(
              2
            )}s`}
            color="primary"
            size="small"
          />
          <Chip
            label={
              generationResult.ai_approved ? "AI approved" : "Needs review"
            }
            color={generationResult.ai_approved ? "success" : "warning"}
            size="small"
          />
          <Chip
            label={`Regenerations: ${generationResult.regeneration_count}`}
            size="small"
          />
          {typeof generationResult.pii_entities_found === "number" && (
            <Chip
              label={`PII entities masked: ${generationResult.pii_entities_found}`}
              size="small"
            />
          )}
        </Stack>
      )}

      {generationResult?.context_data && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Extracted context ({generationResult.context_data.total_entities}{" "}
            entities)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Processing time: {generationResult.context_data.processing_time}s
          </Typography>
        </Box>
      )}

      {generationResult?.soap_note && editedNote ? (
        <>
          {SECTION_CONFIG.map(({ key, label }) => (
            <SOAPSectionEditor
              key={key}
              sectionKey={key}
              label={label}
              section={editedNote[key]}
              onSectionChange={onSectionChange}
            />
          ))}

          <Divider sx={{ my: 2 }} />

          {generationResult.validation_feedback && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {generationResult.validation_feedback}
            </Alert>
          )}

          <Button
            variant="outlined"
            fullWidth
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save SOAP Note"}
          </Button>

          {!generationResult.note_id && (
            <Alert severity="info" sx={{ mt: 2 }}>
              The AI response did not return a note ID. Saving is disabled until
              a linked session generates a persisted note.
            </Alert>
          )}
        </>
      ) : generationResult ? (
        <Alert severity="warning">
          {generationResult.message || "SOAP note could not be generated."}
        </Alert>
      ) : (
        <Box sx={{ py: 10, textAlign: "center" }}>
          <Typography color="text.secondary">
            Generated SOAP note will appear here once available.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
