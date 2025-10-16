import React, { useEffect, useState } from "react";
import { Container, Box, Typography, Alert } from "@mui/material";
import { useGenerateSOAPNote, useUpdateSOAPNote } from "@/hooks/useSoapApi";
import { useListSessions } from "@/hooks/useSessionsApi";
import {
  useSessionDocuments,
  useDocumentContent,
} from "@/hooks/useDocumentsApi";
import { SOAPGenerationResponse, SOAPNote } from "@/lib";
import {
  SOAPConfigurationForm,
  SessionDocumentsList,
  TranscriptInput,
  SOAPNoteEditor,
} from "@/components/soap";

type SOAPSectionKey = "subjective" | "objective" | "assessment" | "plan";

const cloneSoapNote = (note: SOAPNote): SOAPNote =>
  JSON.parse(JSON.stringify(note));

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
  const sessionDocuments = sessionDocumentsQuery.data?.documents || [];
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
    <div className="min-h-screen" style={{ backgroundColor: "#f5f7fb" }}>
      <Container maxWidth="lg" sx={{ mt: 5, mb: 6 }}>
        <Box mb={4}>
          <Typography variant="h4" component="h1" fontWeight={800} gutterBottom>
            Generate SOAP Notes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create AI-powered SOAP notes from patient transcripts.
          </Typography>
        </Box>

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

        <SOAPConfigurationForm
          sessionId={sessionId}
          temperature={temperature}
          maxLength={maxLength}
          includeContext={includeContext}
          enablePiiMasking={enablePiiMasking}
          preserveMedicalContext={preserveMedicalContext}
          sessions={sessions}
          sessionsLoading={sessionsLoading}
          onSessionChange={setSessionId}
          onTemperatureChange={setTemperature}
          onMaxLengthChange={setMaxLength}
          onIncludeContextChange={setIncludeContext}
          onEnablePiiMaskingChange={setEnablePiiMasking}
          onPreserveMedicalContextChange={setPreserveMedicalContext}
        />

        {sessionId && (
          <SessionDocumentsList
            documents={sessionDocuments}
            isLoading={sessionDocumentsLoading}
            selectedDocumentId={selectedDocumentId}
            loadingDocumentId={loadingDocumentId}
            onLoadText={handleLoadDocumentText}
            onClearSelection={handleClearDocumentSelection}
            formatFileSize={formatFileSize}
          />
        )}

        <Box
          display="flex"
          gap={2}
          sx={{ flexDirection: { xs: "column", md: "row" } }}
        >
          <TranscriptInput
            transcript={transcript}
            isGenerating={generateMutation.isPending}
            isDisabled={
              generateMutation.isPending || !transcript.trim() || !sessionId
            }
            onTranscriptChange={setTranscript}
            onGenerate={handleGenerate}
          />

          <SOAPNoteEditor
            generationResult={generationResult}
            editedNote={editedNote}
            isSaving={updateMutation.isPending}
            onSectionChange={handleSectionChange}
            onSave={handleSave}
          />
        </Box>
      </Container>
    </div>
  );
};
