import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Paper,
  IconButton,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import { ArrowBack, CloudUpload, Delete } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import {
  useUploadDocument,
  useDocuments,
  useDeleteDocument,
} from "@/hooks/useDocumentsApi";
import { useListSessions } from "@/hooks/useSessionsApi";

export const DocumentUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [description, setDescription] = useState("");
  const [extractText, setExtractText] = useState(true);
  const [generateSoap, setGenerateSoap] = useState(false);

  const uploadMutation = useUploadDocument();
  const { data: documents, isLoading: documentsLoading } = useDocuments();
  const { data: sessionsData } = useListSessions(1, 100);
  const deleteMutation = useDeleteDocument();

  const sessions = sessionsData?.sessions || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    if (!sessionId) {
      alert("Please select a session before uploading");
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        session_id: sessionId,
        description: description || undefined,
        extract_text: extractText,
        generate_soap: generateSoap,
      });
      setSelectedFile(null);
      setDescription("");
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteMutation.mutateAsync(documentId);
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2 }}>
            Upload Documents
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Upload Document
          </Typography>

          {uploadMutation.isSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              File uploaded successfully!
            </Alert>
          )}
          {uploadMutation.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadMutation.error.message}
            </Alert>
          )}

          <Box sx={{ mt: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Session (Optional)</InputLabel>
              <Select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                label="Session (Optional)"
              >
                <MenuItem value="">None</MenuItem>
                {sessions.map((session) => (
                  <MenuItem key={session.session_id} value={session.session_id}>
                    Session {session.session_id} -{" "}
                    {new Date(session.visit_date).toLocaleDateString()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={extractText}
                  onChange={(e) => setExtractText(e.target.checked)}
                />
              }
              label="Extract text from document"
              sx={{ mb: 1, display: "block" }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={generateSoap}
                  onChange={(e) => setGenerateSoap(e.target.checked)}
                />
              }
              label="Generate SOAP note automatically"
              sx={{ mb: 2, display: "block" }}
            />

            <input
              accept=".pdf,.doc,.docx,.txt"
              style={{ display: "none" }}
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Select File
              </Button>
            </label>

            {selectedFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Selected: {selectedFile.name} (
                {(selectedFile.size / 1024).toFixed(2)} KB)
              </Typography>
            )}

            <Button
              variant="contained"
              fullWidth
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </Button>

            {uploadMutation.isPending && <LinearProgress sx={{ mt: 2 }} />}
          </Box>

          {documentsLoading ? (
            <Box sx={{ mt: 4, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          ) : documents && documents.length > 0 ? (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Recent Documents
              </Typography>
              <List>
                {documents.slice(0, 5).map((file) => (
                  <ListItem key={file.id}>
                    <ListItemText
                      primary={file.filename}
                      secondary={`${(file.file_size / 1024).toFixed(
                        2
                      )} KB - ${new Date(
                        file.created_at
                      ).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDelete(file.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : null}
        </Paper>
      </Container>
    </div>
  );
};
