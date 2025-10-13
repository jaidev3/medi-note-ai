import React, { useEffect, useState } from "react";
// navigation not needed; header provided by Layout
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  Switch,
  FormControlLabel,
  Stack,
} from "@mui/material";
import { Send } from "@mui/icons-material";
import { useGenerateSOAPNote, useUpdateSOAPNote } from "@/hooks/useSoapApi";
import { useListSessions } from "@/hooks/useSessionsApi";
import {
  useSessionDocuments,
  useDocumentContent,
} from "@/hooks/useDocumentsApi";
import { SOAPGenerationResponse, SOAPNote, DocumentMetadata } from "@/lib";

type SOAPSectionKey = "subjective" | "objective" | "assessment" | "plan";

const SECTION_CONFIG: Array<{ key: SOAPSectionKey; label: string }> = [
  { key: "subjective", label: "Subjective" },
  { key: "objective", label: "Objective" },
  { key: "assessment", label: "Assessment" },
  { key: "plan", label: "Plan" },
];

const cloneSoapNote = (note: SOAPNote): SOAPNote =>
  JSON.parse(JSON.stringify(note));

export const SOAPGeneratePage: React.FC = () => {
  const [transcript, setTranscript] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [includeContext, setIncludeContext] = useState(true);
  const [enablePiiMasking, setEnablePiiMasking] = useState(true);
  const [preserveMedicalContext, setPreserveMedicalContext] = useState(true);
  const [temperature, setTemperature] = useState(0.1);
  const [maxLength, setMaxLength] = useState(8000);
  const [generationResult, setGenerationResult] =
    useState<SOAPGenerationResponse | null>(null);
  const [editedNote, setEditedNote] = useState<SOAPNote | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [documentInfoMessage, setDocumentInfoMessage] = useState<string | null>(
    null
  );
  const [loadingDocumentId, setLoadingDocumentId] = useState<string | null>(
    null
  );

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useListSessions(1, 100);
  const generateMutation = useGenerateSOAPNote();
  const updateMutation = useUpdateSOAPNote();
  const sessionDocumentsQuery = useSessionDocuments(sessionId, 1, 50);
  const documentContentMutation = useDocumentContent();

  const sessions = sessionsData?.sessions || [];
  const sessionDocuments: DocumentMetadata[] =
    sessionDocumentsQuery.data?.documents || [];
  const sessionDocumentsLoading =
    sessionDocumentsQuery.isLoading || sessionDocumentsQuery.isFetching;
  const sessionsErrorMessage =
    sessionsError instanceof Error ? sessionsError.message : null;
  const generationErrorMessage =
    generateMutation.error instanceof Error
      ? generateMutation.error.message
      : null;
  const saveMutationErrorMessage =
    updateMutation.error instanceof Error ? updateMutation.error.message : null;
  const sessionDocumentsErrorMessage =
    sessionDocumentsQuery.error instanceof Error
      ? sessionDocumentsQuery.error.message
      : null;

  const formatFileSize = (sizeInBytes: number) => {
    if (!Number.isFinite(sizeInBytes) || sizeInBytes <= 0) {
      return "0 B";
    }
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    }
    const kilobytes = sizeInBytes / 1024;
    if (kilobytes < 1024) {
      return `${kilobytes.toFixed(1)} KB`;
    }
    const megabytes = kilobytes / 1024;
    if (megabytes < 1024) {
      return `${megabytes.toFixed(1)} MB`;
    }
    const gigabytes = megabytes / 1024;
    return `${gigabytes.toFixed(1)} GB`;
  };

  useEffect(() => {
    setSelectedDocumentId(null);
    setGenerationResult(null);
    setEditedNote(null);
    setTranscript("");
    setFormError(null);
    setSaveError(null);
    setSuccessMessage(null);
    setDocumentInfoMessage(null);
  }, [sessionId]);

  const handleSectionChange = (section: SOAPSectionKey, value: string) => {
    setEditedNote((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          content: value,
        },
      };
    });
  };

  const runGeneration = async (inputText: string, documentId?: string) => {
    const cleanedText = inputText.trim();

    if (!cleanedText) {
      setFormError("Transcript is required.");
      return;
    }

    if (!sessionId) {
      setFormError("Select a session to link this SOAP note.");
      return;
    }

    setFormError(null);
    setSaveError(null);
    setSuccessMessage(null);
    setDocumentInfoMessage(null);

    const payloadMaxLength = maxLength > 0 ? maxLength : 8000;
    const payloadTemperature = temperature >= 0 ? temperature : 0.1;

    try {
      const result = await generateMutation.mutateAsync({
        text: cleanedText,
        session_id: sessionId,
        document_id: documentId ?? null,
        include_context: includeContext,
        max_length: payloadMaxLength,
        temperature: payloadTemperature,
        enable_pii_masking: enablePiiMasking,
        preserve_medical_context: preserveMedicalContext,
      });

      setGenerationResult(result);
      setEditedNote(result.soap_note ? cloneSoapNote(result.soap_note) : null);
      setSelectedDocumentId(documentId ?? null);
    } catch (error) {
      console.error("Failed to generate SOAP note:", error);
    }
  };

  const handleGenerate = async () => {
    await runGeneration(transcript, selectedDocumentId || undefined);
  };

  const handleSave = async () => {
    if (!generationResult?.note_id) {
      setSaveError(
        "No note ID returned. Regenerate after linking this transcript to a session."
      );
      return;
    }

    if (!editedNote) {
      setSaveError("Nothing to save yet.");
      return;
    }

    setSaveError(null);
    setSuccessMessage(null);

    try {
      await updateMutation.mutateAsync({
        id: generationResult.note_id,
        data: { content: cloneSoapNote(editedNote) },
      });

      setSuccessMessage("SOAP note saved successfully.");
      setGenerationResult((prev) =>
        prev ? { ...prev, soap_note: cloneSoapNote(editedNote) } : prev
      );
    } catch (error) {
      console.error("Failed to save SOAP note:", error);
    }
  };

  const handleLoadDocumentText = async (
    documentId: string,
    autoGenerate: boolean = false
  ) => {
    if (!sessionId) {
      setFormError("Select a session before loading document text.");
      return;
    }

    setLoadingDocumentId(documentId);
    setDocumentInfoMessage(null);
    setFormError(null);

    try {
      const result = await documentContentMutation.mutateAsync(documentId);

      if (!result.extracted || !result.content) {
        setDocumentInfoMessage(
          result.message ||
            "Document text is not available yet. Please run extraction or try again later."
        );
        if (autoGenerate) {
          setFormError(
            "Cannot generate SOAP because no extracted text was found."
          );
        }
        return;
      }

      setTranscript(result.content);
      setSelectedDocumentId(documentId);
      setDocumentInfoMessage(
        result.message || "Document text loaded into transcript."
      );

      if (autoGenerate) {
        await runGeneration(result.content, documentId);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch document content.";
      setDocumentInfoMessage(message);
    } finally {
      setLoadingDocumentId(null);
    }
  };

  const handleClearDocumentSelection = () => {
    setSelectedDocumentId(null);
    setDocumentInfoMessage(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {formError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}

        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {documentInfoMessage && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {documentInfoMessage}
          </Alert>
        )}

        {sessionsErrorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load sessions: {sessionsErrorMessage}
          </Alert>
        )}

        {generationErrorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to generate SOAP note: {generationErrorMessage}
          </Alert>
        )}

        {saveMutationErrorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to save SOAP note: {saveMutationErrorMessage}
          </Alert>
        )}

        {sessionDocumentsErrorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load session documents: {sessionDocumentsErrorMessage}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack
            spacing={2}
            direction={{ xs: "column", md: "row" }}
            sx={{ mb: 2 }}
          >
            <FormControl fullWidth disabled={sessionsLoading}>
              <InputLabel>Session</InputLabel>
              <Select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value as string)}
                label="Session"
              >
                <MenuItem value="">Select session</MenuItem>
                {sessions.map((session) => (
                  <MenuItem key={session.session_id} value={session.session_id}>
                    Session {session.session_id.slice(0, 8)} -{" "}
                    {new Date(session.visit_date).toLocaleDateString()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              type="number"
              label="Temperature"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value) || 0)}
              inputProps={{ min: 0, max: 2, step: 0.05 }}
              fullWidth
            />

            <TextField
              type="number"
              label="Max Length"
              value={maxLength}
              onChange={(e) => setMaxLength(Number(e.target.value) || 0)}
              inputProps={{ min: 500, step: 100 }}
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={includeContext}
                  onChange={(e) => setIncludeContext(e.target.checked)}
                />
              }
              label="Include medical context"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={enablePiiMasking}
                  onChange={(e) => setEnablePiiMasking(e.target.checked)}
                />
              }
              label="Enable PII masking"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preserveMedicalContext}
                  onChange={(e) => setPreserveMedicalContext(e.target.checked)}
                  disabled={!enablePiiMasking}
                />
              }
              label="Preserve medical terminology"
            />
          </Stack>
        </Paper>

        {sessionId && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h6">Session Documents</Typography>
                <Typography variant="body2" color="text.secondary">
                  Load extracted text from an uploaded document to draft a SOAP
                  note.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={handleClearDocumentSelection}
                disabled={!selectedDocumentId}
              >
                Clear document selection
              </Button>
            </Stack>

            {sessionDocumentsLoading && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={20} />
                <Typography variant="body2">Loading documents…</Typography>
              </Stack>
            )}

            {!sessionDocumentsLoading && sessionDocuments.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No documents found for this session yet.
              </Typography>
            )}

            {!sessionDocumentsLoading && sessionDocuments.length > 0 && (
              <Stack spacing={2}>
                {sessionDocuments.map((doc) => {
                  const isSelected = doc.document_id === selectedDocumentId;
                  return (
                    <Paper
                      key={doc.document_id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderColor: isSelected ? "primary.main" : "divider",
                        backgroundColor: isSelected
                          ? "action.selected"
                          : "inherit",
                      }}
                    >
                      <Stack spacing={1}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {doc.document_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Size: {formatFileSize(doc.file_size)} · Uploaded:{" "}
                          {new Date(doc.created_at).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Status:{" "}
                          {doc.text_extracted
                            ? "Text extracted"
                            : "Extraction pending"}
                        </Typography>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          alignItems={{ xs: "stretch", sm: "center" }}
                        >
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() =>
                              handleLoadDocumentText(doc.document_id, false)
                            }
                            disabled={loadingDocumentId === doc.document_id}
                          >
                            {loadingDocumentId === doc.document_id
                              ? "Loading…"
                              : "Load into transcript"}
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                              handleLoadDocumentText(doc.document_id, true)
                            }
                            disabled={loadingDocumentId === doc.document_id}
                          >
                            {loadingDocumentId === doc.document_id
                              ? "Processing…"
                              : "Load & generate"}
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Paper>
        )}

        <Box
          display="flex"
          gap={2}
          sx={{ flexDirection: { xs: "column", md: "row" } }}
        >
          <Paper sx={{ p: 3, flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Conversation Transcript
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={20}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Enter patient conversation transcript here..."
              variant="outlined"
            />
            <Button
              variant="contained"
              fullWidth
              startIcon={
                generateMutation.isPending ? (
                  <CircularProgress size={20} />
                ) : (
                  <Send />
                )
              }
              onClick={handleGenerate}
              disabled={
                generateMutation.isPending || !transcript.trim() || !sessionId
              }
              sx={{ mt: 2 }}
            >
              {generateMutation.isPending
                ? "Generating..."
                : "Generate SOAP Note"}
            </Button>
          </Paper>

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
                    generationResult.ai_approved
                      ? "AI approved"
                      : "Needs review"
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
                  Extracted context (
                  {generationResult.context_data.total_entities} entities)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Processing time:{" "}
                  {generationResult.context_data.processing_time}s
                </Typography>
              </Box>
            )}

            {generationResult?.soap_note && editedNote ? (
              <>
                {SECTION_CONFIG.map(({ key, label }) => {
                  const section = editedNote[key];
                  return (
                    <Box key={key} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {label}
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        minRows={5}
                        value={section?.content || ""}
                        onChange={(e) =>
                          handleSectionChange(key, e.target.value)
                        }
                        sx={{ mt: 1 }}
                      />
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        {typeof section?.confidence === "number" && (
                          <Chip
                            label={`Confidence: ${(
                              section.confidence * 100
                            ).toFixed(1)}%`}
                            size="small"
                          />
                        )}
                        {typeof section?.word_count === "number" && (
                          <Chip
                            label={`Words: ${section.word_count}`}
                            size="small"
                          />
                        )}
                      </Stack>
                    </Box>
                  );
                })}

                <Divider sx={{ my: 2 }} />

                {generationResult.validation_feedback && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {generationResult.validation_feedback}
                  </Alert>
                )}

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save SOAP Note"}
                </Button>

                {!generationResult.note_id && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    The AI response did not return a note ID. Saving is disabled
                    until a linked session generates a persisted note.
                  </Alert>
                )}
              </>
            ) : generationResult ? (
              <Alert severity="warning">
                {generationResult.message ||
                  "SOAP note could not be generated."}
              </Alert>
            ) : (
              <Box sx={{ py: 10, textAlign: "center" }}>
                <Typography color="text.secondary">
                  Generated SOAP note will appear here once available.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Container>
    </div>
  );
};
