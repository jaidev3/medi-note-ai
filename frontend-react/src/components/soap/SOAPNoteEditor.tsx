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
  CircularProgress,
} from "@mui/material";
import { Save, CheckCircle, Error, Info } from "@mui/icons-material";
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
        <CheckCircle color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" fontWeight={600}>
          Generated SOAP Note
        </Typography>
      </Box>

      {generationResult && (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          <Chip
            icon={<CircularProgress size={14} />}
            label={`Processing: ${generationResult.processing_time.toFixed(2)}s`}
            color="primary"
            size="small"
            variant="outlined"
          />
          <Chip
            icon={generationResult.ai_approved ? <CheckCircle /> : <Error />}
            label={generationResult.ai_approved ? "AI approved" : "Needs review"}
            color={generationResult.ai_approved ? "success" : "warning"}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`Regenerations: ${generationResult.regeneration_count}`}
            size="small"
            variant="outlined"
          />
          {typeof generationResult.pii_entities_found === "number" && (
            <Chip
              icon={<Info />}
              label={`PII entities masked: ${generationResult.pii_entities_found}`}
              size="small"
              variant="outlined"
              color="info"
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
            variant="contained"
            size="large"
            fullWidth
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={onSave}
            disabled={isSaving}
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
            {isSaving ? "Saving SOAP Note..." : "Save SOAP Note"}
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
        <Box sx={{ py: 12, textAlign: "center" }}>
          <CheckCircle sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={500} gutterBottom>
            Ready for SOAP Note Generation
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Select a professional and session, then enter a transcript to generate your SOAP note.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
