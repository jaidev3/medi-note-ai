import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Box, CircularProgress, Alert, Stack } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetSession,
  useUpdateSession,
  useDeleteSession,
} from "@/hooks/useSessionsApi";
import { useGetPatient } from "@/hooks/usePatientsApi";
import {
  useListSOAPNotes,
  useApproveSOAPNote,
  useExportSOAPNotePdf,
  useTriggerSOAPEmbedding,
} from "@/hooks/useSoapApi";
import {
  useSessionDocuments,
  useUploadDocument,
  useDocumentContent,
  useProcessDocument,
  useDocumentMetadata,
  useDocumentPiiStatus,
} from "@/hooks/useDocumentsApi";
import {
  SessionSummaryCard,
  SOAPNotesSection,
  DocumentsSection,
  SessionDetailsForm,
} from "@/components/sessions";

const toLocalInputValue = (isoDate: string) => {
  const date = new Date(isoDate);
  const offsetMs = date.getTimezoneOffset() * 60000;
  const shifted = new Date(date.getTime() - offsetMs);
  return shifted.toISOString().slice(0, 16);
};

const formatDisplayDate = (isoDate: string) => {
  try {
    return new Date(isoDate).toLocaleString();
  } catch (error) {
    return isoDate;
  }
};

export const SessionDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  useAuth();

  const { data: session, isLoading, error } = useGetSession(sessionId ?? "");
  const { data: patient } = useGetPatient(session?.patient_id ?? "");

  const updateSessionMutation = useUpdateSession();
  const deleteSessionMutation = useDeleteSession();
  const soapNotesQuery = useListSOAPNotes(sessionId ?? "", false);
  const approveSoapMutation = useApproveSOAPNote();
  const exportSoapPdfMutation = useExportSOAPNotePdf();
  const triggerEmbeddingMutation = useTriggerSOAPEmbedding();

  const sessionDocumentsQuery = useSessionDocuments(sessionId ?? "", 1, 50);
  const uploadMutation = useUploadDocument();
  const documentContentMutation = useDocumentContent();
  const processDocumentMutation = useProcessDocument();
  const [metadataDocId, setMetadataDocId] = useState<string | null>(null);
  const [piiDocId, setPiiDocId] = useState<string | null>(null);
  const documentMetadataQuery = useDocumentMetadata(metadataDocId ?? "");
  const documentPiiQuery = useDocumentPiiStatus(piiDocId ?? "");
  const [documentActionMessage, setDocumentActionMessage] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [soapActionFeedback, setSoapActionFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [processingDocumentId, setProcessingDocumentId] = useState<
    string | null
  >(null);
  const [loadingContentDocId, setLoadingContentDocId] = useState<string | null>(
    null
  );

  const [visitDate, setVisitDate] = useState("");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractText, setExtractText] = useState(true);
  const [generateSoap, setGenerateSoap] = useState(false);
  const [viewingDocumentContent, setViewingDocumentContent] = useState<{
    documentId: string;
    content: string;
  } | null>(null);

  useEffect(() => {
    if (session) {
      setVisitDate(toLocalInputValue(session.visit_date));
      setNotes(session.notes ?? "");
      setIsDirty(false);
    }
  }, [session?.session_id]);

  const metadata = useMemo(() => {
    if (!session) return [];
    return [
      { label: "Session ID", value: session.session_id },
      { label: "Patient", value: patient?.name ?? session.patient_id },
      {
        label: "Professional",
        value: session.professional_id ?? "Assigned on visit",
      },
      { label: "Created", value: formatDisplayDate(session.created_at) },
      { label: "Updated", value: formatDisplayDate(session.updated_at) },
    ];
  }, [patient?.name, session]);

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionId) return;
    setFeedback(null);

    try {
      const payload = {
        visit_date: visitDate ? new Date(visitDate).toISOString() : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      };

      await updateSessionMutation.mutateAsync({ id: sessionId, data: payload });
      setFeedback({
        type: "success",
        message: "Session updated successfully.",
      });
      setIsDirty(false);
    } catch (err: any) {
      const message = err?.message || "Failed to update session.";
      setFeedback({ type: "error", message });
    }
  };

  const handleDelete = async () => {
    if (!sessionId) return;
    const confirmed = window.confirm(
      "Delete this session? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await deleteSessionMutation.mutateAsync(sessionId);
      navigate("/sessions");
    } catch (err: any) {
      const message = err?.message || "Failed to delete session.";
      setFeedback({ type: "error", message });
    }
  };

  const handleApproveNote = async (noteId: string, approved: boolean) => {
    setSoapActionFeedback(null);
    try {
      await approveSoapMutation.mutateAsync({ id: noteId, approved });
      setSoapActionFeedback({
        type: "success",
        message: approved
          ? "SOAP note approved successfully."
          : "SOAP note marked as needing revisions.",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update SOAP note approval status.";
      setSoapActionFeedback({ type: "error", message });
    }
  };

  const handleExportNotePdf = async (noteId: string, fileName: string) => {
    try {
      const blob = await exportSoapPdfMutation.mutateAsync(noteId);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${fileName || "soap-note"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setSoapActionFeedback({
        type: "success",
        message: "SOAP note exported as PDF.",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to export SOAP note as PDF.";
      setSoapActionFeedback({ type: "error", message });
    }
  };

  const handleTriggerNoteEmbedding = async (noteId: string) => {
    setSoapActionFeedback(null);
    try {
      const result = await triggerEmbeddingMutation.mutateAsync({
        note_ids: [noteId],
      });
      setSoapActionFeedback({
        type: result.success ? "success" : "error",
        message:
          result.message ||
          (result.success
            ? "Embedding triggered for SOAP note."
            : "Embedding trigger failed."),
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to trigger embeddings for SOAP note.";
      setSoapActionFeedback({ type: "error", message });
    }
  };

  const handleProcessDocument = async (documentId: string) => {
    setProcessingDocumentId(documentId);
    setDocumentActionMessage(null);
    try {
      const response = await processDocumentMutation.mutateAsync({
        id: documentId,
      });
      setDocumentActionMessage({
        type: response.success ? "success" : "info",
        message:
          response.message ||
          "Document processing complete. Refresh in a moment to see updates.",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to process document.";
      setDocumentActionMessage({ type: "error", message });
    } finally {
      setProcessingDocumentId(null);
    }
  };

  const handleViewDocumentText = async (documentId: string) => {
    setLoadingContentDocId(documentId);
    try {
      const res = await documentContentMutation.mutateAsync(documentId);
      setViewingDocumentContent({
        documentId: documentId,
        content: res.content,
      });
      setDocumentActionMessage({
        type: res.extracted ? "success" : "info",
        message:
          res.message ||
          (res.extracted
            ? "Extracted text loaded."
            : "Text extraction pending; retry shortly."),
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load document content.";
      setDocumentActionMessage({
        type: "error",
        message,
      });
    } finally {
      setLoadingContentDocId(null);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !sessionId)
      return alert("Select a file and ensure session is available");
    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        session_id: sessionId,
        extract_text: extractText,
        generate_soap: generateSoap,
      } as any);
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">Failed to load session details.</Alert>
        ) : !session ? (
          <Alert severity="warning">Session not found.</Alert>
        ) : (
          <Stack spacing={3}>
            {feedback && (
              <Alert severity={feedback.type}>{feedback.message}</Alert>
            )}

            <SessionSummaryCard
              metadata={metadata}
              documentCount={session.document_count}
              soapNoteCount={session.soap_note_count}
            />

            <SOAPNotesSection
              notes={soapNotesQuery.data}
              patientName={patient?.name}
              isLoading={soapNotesQuery.isLoading}
              error={soapNotesQuery.error}
              actionFeedback={soapActionFeedback}
              onApprove={handleApproveNote}
              onExportPdf={handleExportNotePdf}
              onTriggerEmbedding={handleTriggerNoteEmbedding}
              onClearFeedback={() => setSoapActionFeedback(null)}
              isApproving={approveSoapMutation.isPending}
              isExporting={exportSoapPdfMutation.isPending}
              isTriggeringEmbedding={triggerEmbeddingMutation.isPending}
            />

            <DocumentsSection
              documents={sessionDocumentsQuery.data?.documents}
              isLoading={sessionDocumentsQuery.isLoading}
              error={sessionDocumentsQuery.error}
              actionMessage={documentActionMessage}
              onClearActionMessage={() => setDocumentActionMessage(null)}
              selectedFile={selectedFile}
              extractText={extractText}
              generateSoap={generateSoap}
              isUploading={uploadMutation.isPending}
              uploadSuccess={uploadMutation.isSuccess}
              uploadError={uploadMutation.error}
              uploadMessage={uploadMutation.data?.message}
              onFileSelect={setSelectedFile}
              onUpload={handleUploadDocument}
              onToggleExtractText={() => setExtractText((s) => !s)}
              onToggleGenerateSoap={() => setGenerateSoap((s) => !s)}
              processingDocumentId={processingDocumentId}
              loadingContentDocId={loadingContentDocId}
              onViewText={handleViewDocumentText}
              onReprocess={handleProcessDocument}
              metadataDocId={metadataDocId}
              piiDocId={piiDocId}
              onToggleMetadata={(id) =>
                setMetadataDocId((prev) => (prev === id ? null : id))
              }
              onTogglePii={(id) =>
                setPiiDocId((prev) => (prev === id ? null : id))
              }
              onClearInsights={() => {
                setMetadataDocId(null);
                setPiiDocId(null);
                setDocumentActionMessage(null);
              }}
              metadataData={documentMetadataQuery.data}
              piiData={documentPiiQuery.data}
              isLoadingMetadata={documentMetadataQuery.isLoading}
              isLoadingPii={documentPiiQuery.isLoading}
              metadataError={documentMetadataQuery.error}
              piiError={documentPiiQuery.error}
              viewingContent={viewingDocumentContent}
              onCloseContentViewer={() => setViewingDocumentContent(null)}
              formatDisplayDate={formatDisplayDate}
            />

            <SessionDetailsForm
              visitDate={visitDate}
              notes={notes}
              isDirty={isDirty}
              isUpdating={updateSessionMutation.isPending}
              isDeleting={deleteSessionMutation.isPending}
              onVisitDateChange={(value) => {
                setVisitDate(value);
                setIsDirty(true);
              }}
              onNotesChange={(value) => {
                setNotes(value);
                setIsDirty(true);
              }}
              onSubmit={handleUpdate}
              onDelete={handleDelete}
            />
          </Stack>
        )}
      </Container>
    </div>
  );
};
