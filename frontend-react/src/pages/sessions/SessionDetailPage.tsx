import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Typography,
  Button,
  Container,
  Paper,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
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
import type { SOAPNoteResponse } from "@/lib";

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

  const handleShowMetadata = (documentId: string) => {
    setMetadataDocId((prev) => (prev === documentId ? null : documentId));
  };

  const handleShowPii = (documentId: string) => {
    setPiiDocId((prev) => (prev === documentId ? null : documentId));
  };

  const handleClearDocumentInsights = () => {
    setMetadataDocId(null);
    setPiiDocId(null);
    setDocumentActionMessage(null);
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

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Session Summary
              </Typography>
              <Grid container spacing={2}>
                {metadata.map((item) => (
                  <Grid item xs={12} sm={6} key={item.label}>
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ wordBreak: "break-word" }}
                    >
                      {item.value}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 3 }} />
              <Stack direction="row" spacing={2}>
                <Chip
                  label={`Documents: ${session.document_count}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`SOAP Notes: ${session.soap_note_count}`}
                  color="primary"
                  variant="outlined"
                />
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                SOAP Notes
              </Typography>

              {soapActionFeedback && (
                <Alert
                  severity={soapActionFeedback.type}
                  sx={{ mb: 2 }}
                  onClose={() => setSoapActionFeedback(null)}
                >
                  {soapActionFeedback.message}
                </Alert>
              )}

              {soapNotesQuery.isLoading ? (
                <Box sx={{ py: 2, textAlign: "center" }}>
                  <CircularProgress size={20} />
                </Box>
              ) : soapNotesQuery.error ? (
                <Alert severity="error">Failed to load SOAP notes.</Alert>
              ) : !soapNotesQuery.data || soapNotesQuery.data.length === 0 ? (
                <Alert severity="info">
                  No SOAP notes for this session yet.
                </Alert>
              ) : (
                soapNotesQuery.data.map((note: SOAPNoteResponse) => {
                  const shortId = note.note_id.slice(0, 8).toUpperCase();
                  const readableCreated = new Date(
                    note.created_at
                  ).toLocaleString();

                  return (
                    <Box
                      key={note.note_id}
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
                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            sx={{ mt: 1 }}
                          >
                            <Chip
                              label={
                                note.ai_approved ? "AI approved" : "AI check"
                              }
                              color={note.ai_approved ? "success" : "warning"}
                              size="small"
                            />
                            <Chip
                              label={
                                note.user_approved
                                  ? "User approved"
                                  : "Awaiting user review"
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
                            onClick={() =>
                              handleApproveNote(note.note_id, true)
                            }
                            disabled={approveSoapMutation.isPending}
                          >
                            {approveSoapMutation.isPending
                              ? "Saving..."
                              : "Approve"}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              handleApproveNote(note.note_id, false)
                            }
                            disabled={approveSoapMutation.isPending}
                          >
                            Needs edits
                          </Button>
                        </Stack>
                      </Stack>

                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{ mt: 1 }}
                      >
                        <Button
                          size="small"
                          onClick={() =>
                            handleExportNotePdf(
                              note.note_id,
                              patient?.name || `soap-note-${shortId}`
                            )
                          }
                          disabled={exportSoapPdfMutation.isPending}
                        >
                          {exportSoapPdfMutation.isPending
                            ? "Exporting..."
                            : "Export PDF"}
                        </Button>
                        <Button
                          size="small"
                          onClick={() =>
                            handleTriggerNoteEmbedding(note.note_id)
                          }
                          disabled={triggerEmbeddingMutation.isPending}
                        >
                          {triggerEmbeddingMutation.isPending
                            ? "Triggering..."
                            : "Trigger embedding"}
                        </Button>
                      </Stack>

                      {note.soap_note ? (
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          {Object.entries(note.soap_note).map(
                            ([section, secData]) => (
                              <Grid item xs={12} md={6} key={section}>
                                <Typography variant="subtitle2">
                                  {section.toUpperCase()}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ whiteSpace: "pre-wrap" }}
                                >
                                  {/* @ts-ignore */}
                                  {secData?.content ?? JSON.stringify(secData)}
                                </Typography>
                              </Grid>
                            )
                          )}
                        </Grid>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ mt: 1, whiteSpace: "pre-wrap" }}
                        >
                          {JSON.stringify(note.content, null, 2)}
                        </Typography>
                      )}
                    </Box>
                  );
                })
              )}
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Documents
              </Typography>

              {/* Upload form */}
              <Box sx={{ mb: 2 }}>
                <input
                  accept=".pdf,.doc,.docx,.txt"
                  style={{ display: "none" }}
                  id="session-file-upload"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0])
                      setSelectedFile(e.target.files[0]);
                  }}
                />
                <label htmlFor="session-file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    Select File to Upload
                  </Button>
                </label>

                {selectedFile && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Selected: {selectedFile.name} —{" "}
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </Typography>
                )}

                <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                  <Button
                    variant="contained"
                    onClick={async () => {
                      if (!selectedFile || !sessionId)
                        return alert(
                          "Select a file and ensure session is available"
                        );
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
                    }}
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending
                      ? "Uploading..."
                      : "Upload to Session"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setExtractText((s) => !s);
                    }}
                  >
                    {extractText ? "Extract: ON" : "Extract: OFF"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setGenerateSoap((s) => !s)}
                  >
                    {generateSoap ? "Generate SOAP: ON" : "Generate SOAP: OFF"}
                  </Button>
                </Box>
                {uploadMutation.isSuccess && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    {uploadMutation.data?.message || "Uploaded"}
                  </Alert>
                )}
                {uploadMutation.error && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {(uploadMutation.error as any).message || "Upload failed"}
                  </Alert>
                )}
              </Box>

              {documentActionMessage && (
                <Alert
                  severity={documentActionMessage.type}
                  sx={{ mb: 2 }}
                  onClose={() => setDocumentActionMessage(null)}
                >
                  {documentActionMessage.message}
                </Alert>
              )}

              {/* Document list */}
              {sessionDocumentsQuery.isLoading ? (
                <Box sx={{ py: 2, textAlign: "center" }}>
                  <CircularProgress size={20} />
                </Box>
              ) : sessionDocumentsQuery.error ? (
                <Alert severity="error">Failed to load documents.</Alert>
              ) : !sessionDocumentsQuery.data ||
                sessionDocumentsQuery.data.documents.length === 0 ? (
                <Alert severity="info">
                  No documents uploaded for this session.
                </Alert>
              ) : (
                sessionDocumentsQuery.data.documents.map((doc) => {
                  const isProcessing = processingDocumentId === doc.document_id;
                  const isMetadataActive = metadataDocId === doc.document_id;
                  const isPiiActive = piiDocId === doc.document_id;
                  const fileSizeKb = (doc.file_size / 1024).toFixed(1);
                  const createdDisplay = formatDisplayDate(doc.created_at);

                  return (
                    <Box
                      key={doc.document_id}
                      sx={{
                        mb: 2,
                        p: 2,
                        border: "1px solid #f1f1f1",
                        borderRadius: 1,
                      }}
                    >
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        justifyContent="space-between"
                        spacing={1.5}
                        alignItems={{ xs: "flex-start", md: "center" }}
                      >
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            {doc.document_name || "Document"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {doc.file_type?.toUpperCase() || "UNKNOWN"} •{" "}
                            {fileSizeKb}
                            KB • Uploaded {createdDisplay}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            sx={{ mt: 1 }}
                          >
                            <Chip
                              label={doc.upload_status}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              label={
                                doc.text_extracted
                                  ? "Text extracted"
                                  : "Extraction pending"
                              }
                              size="small"
                              color={doc.text_extracted ? "success" : "default"}
                            />
                            {doc.soap_generated && (
                              <Chip
                                label="SOAP generated"
                                size="small"
                                color="success"
                              />
                            )}
                          </Stack>
                        </Box>

                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          alignItems={{ xs: "stretch", sm: "center" }}
                        >
                          <Button
                            size="small"
                            onClick={async () => {
                              setLoadingContentDocId(doc.document_id);
                              try {
                                const res =
                                  await documentContentMutation.mutateAsync(
                                    doc.document_id
                                  );
                                setViewingDocumentContent({
                                  documentId: doc.document_id,
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
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to load document content.";
                                setDocumentActionMessage({
                                  type: "error",
                                  message,
                                });
                              } finally {
                                setLoadingContentDocId(null);
                              }
                            }}
                            disabled={
                              documentContentMutation.isPending &&
                              loadingContentDocId === doc.document_id
                            }
                          >
                            {documentContentMutation.isPending &&
                            loadingContentDocId === doc.document_id
                              ? "Loading..."
                              : "View text"}
                          </Button>
                          <Button
                            size="small"
                            onClick={() =>
                              handleProcessDocument(doc.document_id)
                            }
                            disabled={
                              isProcessing || processDocumentMutation.isPending
                            }
                          >
                            {isProcessing || processDocumentMutation.isPending
                              ? "Processing..."
                              : "Reprocess"}
                          </Button>
                          <Button
                            size="small"
                            variant={
                              isMetadataActive ? "contained" : "outlined"
                            }
                            onClick={() => handleShowMetadata(doc.document_id)}
                          >
                            Metadata
                          </Button>
                          <Button
                            size="small"
                            variant={isPiiActive ? "contained" : "outlined"}
                            onClick={() => handleShowPii(doc.document_id)}
                          >
                            PII status
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  );
                })
              )}

              {(metadataDocId || piiDocId) && (
                <Box sx={{ mt: 3 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="subtitle1">
                      Document insights
                    </Typography>
                    <Button size="small" onClick={handleClearDocumentInsights}>
                      Clear selections
                    </Button>
                  </Stack>

                  {metadataDocId && (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Metadata for document {metadataDocId?.slice(0, 8)}
                      </Typography>
                      {documentMetadataQuery.isLoading ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CircularProgress size={16} />
                          <Typography variant="body2">
                            Loading metadata…
                          </Typography>
                        </Stack>
                      ) : documentMetadataQuery.error ? (
                        <Alert severity="error">
                          Failed to fetch metadata.
                        </Alert>
                      ) : documentMetadataQuery.data ? (
                        <Grid container spacing={1}>
                          <Grid item xs={12} sm={6}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              File path
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ wordBreak: "break-all" }}
                            >
                              {documentMetadataQuery.data.file_path}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Processed at
                            </Typography>
                            <Typography variant="body2">
                              {documentMetadataQuery.data.processed_at
                                ? formatDisplayDate(
                                    documentMetadataQuery.data.processed_at
                                  )
                                : "Pending"}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              SOAP generated
                            </Typography>
                            <Typography variant="body2">
                              {documentMetadataQuery.data.soap_generated
                                ? "Yes"
                                : "No"}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Text extracted
                            </Typography>
                            <Typography variant="body2">
                              {documentMetadataQuery.data.text_extracted
                                ? "Yes"
                                : "No"}
                            </Typography>
                          </Grid>
                        </Grid>
                      ) : null}
                    </Paper>
                  )}

                  {piiDocId && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        PII status for document {piiDocId?.slice(0, 8)}
                      </Typography>
                      {documentPiiQuery.isLoading ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CircularProgress size={16} />
                          <Typography variant="body2">
                            Checking PII status…
                          </Typography>
                        </Stack>
                      ) : documentPiiQuery.error ? (
                        <Alert severity="error">
                          Failed to fetch PII status.
                        </Alert>
                      ) : documentPiiQuery.data ? (
                        <Stack spacing={1}>
                          <Typography variant="body2">
                            Masked:{" "}
                            {documentPiiQuery.data.pii_masked ? "Yes" : "No"}
                          </Typography>
                          <Typography variant="body2">
                            Entities detected:{" "}
                            {documentPiiQuery.data.pii_entities_found ??
                              "Unknown"}
                          </Typography>
                          {documentPiiQuery.data.pii_processing_note && (
                            <Typography variant="body2">
                              Notes: {documentPiiQuery.data.pii_processing_note}
                            </Typography>
                          )}
                        </Stack>
                      ) : null}
                    </Paper>
                  )}
                </Box>
              )}

              {viewingDocumentContent && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: "background.paper",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle2">Document Text</Typography>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", mt: 1 }}
                  >
                    {viewingDocumentContent.content}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      onClick={() => setViewingDocumentContent(null)}
                    >
                      Close
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Visit Details
              </Typography>
              <Box component="form" onSubmit={handleUpdate}>
                <TextField
                  label="Visit Date"
                  type="datetime-local"
                  fullWidth
                  margin="normal"
                  value={visitDate}
                  onChange={(event) => {
                    setVisitDate(event.target.value);
                    setIsDirty(true);
                  }}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Session Notes"
                  fullWidth
                  multiline
                  minRows={4}
                  margin="normal"
                  value={notes}
                  onChange={(event) => {
                    setNotes(event.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Update notes captured during the visit"
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 3,
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleDelete}
                    disabled={deleteSessionMutation.isPending}
                  >
                    Delete Session
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={!isDirty || updateSessionMutation.isPending}
                  >
                    {updateSessionMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Stack>
        )}
      </Container>
    </div>
  );
};
