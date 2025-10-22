import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Button,
  IconButton,
  Stack,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  Delete,
} from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetSession,
  useUpdateSession,
  useDeleteSession,
} from "@/hooks/useSessionsApi";
import {
  useListSOAPNotes,
  useExportSOAPNotePdf,
} from "@/hooks/useSoapApi";
import {
  useSessionDocuments,
  useUploadDocument,
} from "@/hooks/useDocumentsApi";
import { SessionSummary } from "./components/SessionSummary";
import { DocumentUpload } from "./components/DocumentUpload";
import { SOAPNotesList } from "./components/SOAPNotesList";
import { DocumentsList } from "./components/DocumentsList";
import { SOAPNoteDialog } from "./components/SOAPNoteDialog";
import { EditSessionDialog } from "./components/EditSessionDialog";

export const SessionDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  useAuth();

  const { data: session, isLoading, error } = useGetSession(sessionId ?? "");
  const soapNotesQuery = useListSOAPNotes(sessionId ?? "", false);
  const sessionDocumentsQuery = useSessionDocuments(sessionId ?? "", 1, 50);
  const exportSoapPdfMutation = useExportSOAPNotePdf();
  const uploadMutation = useUploadDocument();
  const updateSessionMutation = useUpdateSession();
  const deleteSessionMutation = useDeleteSession();

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedSOAPNote, setSelectedSOAPNote] = useState<any>(null);
  const [currentSOAPTab, setCurrentSOAPTab] = useState(0);

  useEffect(() => {
    if (session) {
      setVisitDate(new Date(session.visit_date).toISOString().slice(0, 16));
      setNotes(session.notes ?? "");
    }
  }, [session]);

  const handleEditSession = () => {
    setIsEditing(true);
  };

  const handleSaveSession = async () => {
    if (!sessionId) return;

    try {
      await updateSessionMutation.mutateAsync({
        id: sessionId,
        data: {
          visit_date: visitDate ? new Date(visitDate).toISOString() : undefined,
          notes: notes.trim() || undefined,
        }
      });

      setFeedback({
        type: "success",
        message: "Session updated successfully.",
      });
      setIsEditing(false);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to update session."
      });
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionId) return;

    const confirmed = window.confirm(
      "Delete this session? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await deleteSessionMutation.mutateAsync(sessionId);
      navigate("/sessions");
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to delete session."
      });
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !sessionId) return;

    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        session_id: sessionId,
        extract_text: true,
        generate_soap: false,
      } as any);

      setSelectedFile(null);
      setFeedback({
        type: "success",
        message: "Document uploaded successfully.",
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to upload document."
      });
    }
  };

  const handleViewSOAPNote = (note: any) => {
    setSelectedSOAPNote(note);
    setCurrentSOAPTab(0);
  };

  const handleExportSOAP = async (noteId: string, fileName: string) => {
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

      setFeedback({
        type: "success",
        message: "SOAP note exported as PDF.",
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to export SOAP note."
      });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !session) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error ? "Failed to load session details." : "Session not found."}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton onClick={() => navigate("/sessions")}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Session Details
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Edit />}
          onClick={handleEditSession}
          sx={{ mr: 2 }}
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={handleDeleteSession}
          disabled={deleteSessionMutation.isPending}
        >
          Delete
        </Button>
      </Box>

      {/* Feedback Alert */}
      {feedback && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 3 }}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
        <SessionSummary session={session} />

        <Box sx={{ flex: { md: "1 1 auto", xs: "1 1 100%" } }}>
          <Stack spacing={3}>
            <DocumentUpload
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              onUpload={handleUploadDocument}
              isUploading={uploadMutation.isPending}
            />

            <SOAPNotesList
              soapNotes={soapNotesQuery.data}
              isLoading={soapNotesQuery.isLoading}
              onViewNote={handleViewSOAPNote}
              onExportNote={handleExportSOAP}
              isExporting={exportSoapPdfMutation.isPending}
            />

            <DocumentsList
              documents={sessionDocumentsQuery.data?.documents}
              documentCount={sessionDocumentsQuery.data?.documents?.length || 0}
              isLoading={sessionDocumentsQuery.isLoading}
            />
          </Stack>
        </Box>
      </Box>

      <EditSessionDialog
        open={isEditing}
        visitDate={visitDate}
        notes={notes}
        onVisitDateChange={setVisitDate}
        onNotesChange={setNotes}
        onSave={handleSaveSession}
        onCancel={() => setIsEditing(false)}
        isSaving={updateSessionMutation.isPending}
      />

      <SOAPNoteDialog
        open={!!selectedSOAPNote}
        soapNote={selectedSOAPNote}
        patientName={session.patient_name || "Unknown Patient"}
        currentTab={currentSOAPTab}
        onTabChange={setCurrentSOAPTab}
        onClose={() => setSelectedSOAPNote(null)}
        onExport={handleExportSOAP}
        isExporting={exportSoapPdfMutation.isPending}
      />
    </Container>
  );
};