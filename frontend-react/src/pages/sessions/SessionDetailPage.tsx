import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Button,
  Chip,
  Paper,
  Divider,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Tabs,
  Tab,
} from "@mui/material";
import {
  ArrowBack,
  Upload,
  Description,
  CalendarToday,
  Person,
  Edit,
  Delete,
  Download,
  Visibility,
  MedicalServices,
  Assessment,
  Subject,
  Assignment,
  Close,
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

const formatDisplayDate = (isoDate: string) => {
  try {
    return new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return isoDate;
  }
};

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
        {/* Session Summary */}
        <Box sx={{ flex: { md: "0 0 400px", xs: "1 1 100%" } }}>
          <Paper sx={{ p: 3, height: "fit-content" }}>
            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Person />
              Session Summary
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                {session.patient_name || "Unknown Patient"}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <CalendarToday sx={{ fontSize: 16, mr: 1, verticalAlign: "middle" }} />
                Visit Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                {formatDisplayDate(session.visit_date)}
              </Typography>
            </Box>

            {session.notes && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                  {session.notes}
                </Typography>
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={session.soap_note_count > 0 ? `${session.soap_note_count} SOAP Notes` : "No SOAP Notes"}
                color={session.soap_note_count > 0 ? "success" : "default"}
                size="small"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: "bold" }}>
                  {session.document_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Documents
                </Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="secondary" sx={{ fontWeight: "bold" }}>
                  {session.soap_note_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  SOAP Notes
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: { md: "1 1 auto", xs: "1 1 100%" } }}>
          <Stack spacing={3}>
            {/* Document Upload */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Upload />
                Quick Upload
              </Typography>

              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<Upload />}
                  disabled={uploadMutation.isPending}
                >
                  Choose File
                  <input
                    type="file"
                    hidden
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                  />
                </Button>

                {selectedFile && (
                  <>
                    <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                      {selectedFile.name}
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={handleUploadDocument}
                      disabled={uploadMutation.isPending}
                    >
                      Upload
                    </Button>
                  </>
                )}
              </Box>
            </Paper>

            {/* SOAP Notes */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Description />
                SOAP Notes
              </Typography>

              {soapNotesQuery.isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : soapNotesQuery.data?.length ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {soapNotesQuery.data.map((note: any) => (
                    <Card key={note.note_id} variant="outlined">
                      <CardContent sx={{ pb: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle2" color="primary">
                              {new Date(note.created_at).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {note.approved ? "Approved" : "Draft"}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => handleViewSOAPNote(note)}
                            >
                              View
                            </Button>
                            <Button
                              size="small"
                              startIcon={<Download />}
                              onClick={() => handleExportSOAP(note.note_id, `soap-note-${new Date(note.created_at).toISOString().slice(0, 10)}`)}
                              disabled={exportSoapPdfMutation.isPending}
                            >
                              Export
                            </Button>
                          </Box>
                        </Box>

                        <Typography variant="body2" sx={{
                          maxHeight: 100,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: "vertical"
                        }}>
                          {note.soap_note_content?.substring(0, 200)}...
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                  No SOAP notes generated yet. Upload documents to get started.
                </Typography>
              )}
            </Paper>

            {/* Documents */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Description />
                Documents ({sessionDocumentsQuery.data?.documents?.length || 0})
              </Typography>

              {sessionDocumentsQuery.isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : sessionDocumentsQuery.data?.documents?.length ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {sessionDocumentsQuery.data.documents.map((doc: any) => (
                    <Card key={doc.document_id} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Box>
                            <Typography variant="subtitle2">
                              {doc.filename}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(doc.uploaded_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Chip
                            label={doc.processed ? "Processed" : "Pending"}
                            color={doc.processed ? "success" : "warning"}
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                  No documents uploaded yet.
                </Typography>
              )}
            </Paper>
          </Stack>
        </Box>
      </Box>

      {/* Edit Session Dialog */}
      <Dialog
        open={isEditing}
        onClose={() => setIsEditing(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Session Details</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Visit Date"
              type="datetime-local"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Session Notes"
              multiline
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Update notes captured during the visit"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveSession}
            variant="contained"
            disabled={updateSessionMutation.isPending}
          >
            {updateSessionMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SOAP Note Detail Dialog */}
      <Dialog
        open={!!selectedSOAPNote}
        onClose={() => setSelectedSOAPNote(null)}
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
            SOAP Note Details - {session.patient_name}
          </Typography>
          <IconButton onClick={() => setSelectedSOAPNote(null)}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ borderBottom: 1, borderBottomColor: "divider", pb: 2, mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" color="primary">
                {new Date(selectedSOAPNote?.created_at).toLocaleDateString()} at {new Date(selectedSOAPNote?.created_at).toLocaleTimeString()}
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip
                  label={selectedSOAPNote?.approved ? "Approved" : "Draft"}
                  color={selectedSOAPNote?.approved ? "success" : "warning"}
                  size="small"
                />
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={() => {
                    handleExportSOAP(
                      selectedSOAPNote.note_id,
                      `soap-note-${new Date(selectedSOAPNote.created_at).toISOString().slice(0, 10)}`
                    );
                  }}
                  disabled={exportSoapPdfMutation.isPending}
                >
                  Export PDF
                </Button>
              </Box>
            </Box>
          </Box>

          <Tabs
            value={currentSOAPTab}
            onChange={(e, newValue) => setCurrentSOAPTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label="Subjective" />
            <Tab label="Objective" />
            <Tab label="Assessment" />
            <Tab label="Plan" />
          </Tabs>

          <Box sx={{ mt: 2 }}>
            {currentSOAPTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Subject color="primary" />
                  Subjective (S)
                </Typography>
                <Paper variant="outlined" sx={{ p: 3, minHeight: 200 }}>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {selectedSOAPNote?.content?.subjective?.content || "No subjective information recorded"}
                  </Typography>
                </Paper>
              </Box>
            )}

            {currentSOAPTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Assignment color="primary" />
                  Objective (O)
                </Typography>
                <Paper variant="outlined" sx={{ p: 3, minHeight: 200 }}>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {selectedSOAPNote?.content?.objective?.content || "No objective information recorded"}
                  </Typography>
                </Paper>
              </Box>
            )}

            {currentSOAPTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Assessment color="primary" />
                  Assessment (A)
                </Typography>
                <Paper variant="outlined" sx={{ p: 3, minHeight: 200 }}>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {selectedSOAPNote?.content?.assessment?.content || "No assessment information recorded"}
                  </Typography>
                </Paper>
              </Box>
            )}

            {currentSOAPTab === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MedicalServices color="primary" />
                  Plan (P)
                </Typography>
                <Paper variant="outlined" sx={{ p: 3, minHeight: 200 }}>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {selectedSOAPNote?.content?.plan?.content || "No plan information recorded"}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setSelectedSOAPNote(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};