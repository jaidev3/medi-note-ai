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
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
} from "@mui/material";
import { ArrowBack, Send } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useGenerateSOAPNote, useUpdateSOAPNote } from "@/hooks/useSoapApi";
import { useListSessions } from "@/hooks/useSessionsApi";

export const SOAPGeneratePage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [transcript, setTranscript] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [generatedNote, setGeneratedNote] = useState<any>(null);

  const { data: sessionsData } = useListSessions(1, 100);
  const generateMutation = useGenerateSOAPNote();
  const updateMutation = useUpdateSOAPNote();

  const sessions = sessionsData?.sessions || [];

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      return;
    }

    try {
      const result = await generateMutation.mutateAsync({
        transcript,
        session_id: sessionId || undefined,
      });
      setGeneratedNote(result);
    } catch (err) {
      console.error("Failed to generate SOAP note:", err);
    }
  };

  const handleSave = async () => {
    if (!generatedNote?.id) return;

    try {
      await updateMutation.mutateAsync({
        id: generatedNote.id,
        data: {
          subjective: generatedNote.subjective,
          objective: generatedNote.objective,
          assessment: generatedNote.assessment,
          plan: generatedNote.plan,
        },
      });
      alert("SOAP note saved successfully!");
    } catch (err) {
      console.error("Failed to save SOAP note:", err);
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
            Generate SOAP Notes
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {generateMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to generate SOAP note: {generateMutation.error.message}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
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
        </Box>

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
              disabled={generateMutation.isPending || !transcript.trim()}
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

            {generatedNote ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Processing Time:{" "}
                    <Chip
                      label={`${
                        generatedNote.processing_time_seconds?.toFixed(2) || 0
                      }s`}
                      size="small"
                      color="primary"
                    />
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Subjective
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {generatedNote.subjective || "N/A"}
                  </Typography>
                  {generatedNote.subjective_confidence && (
                    <Chip
                      label={`Confidence: ${(
                        generatedNote.subjective_confidence * 100
                      ).toFixed(1)}%`}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Objective
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {generatedNote.objective || "N/A"}
                  </Typography>
                  {generatedNote.objective_confidence && (
                    <Chip
                      label={`Confidence: ${(
                        generatedNote.objective_confidence * 100
                      ).toFixed(1)}%`}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Assessment
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {generatedNote.assessment || "N/A"}
                  </Typography>
                  {generatedNote.assessment_confidence && (
                    <Chip
                      label={`Confidence: ${(
                        generatedNote.assessment_confidence * 100
                      ).toFixed(1)}%`}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Plan
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {generatedNote.plan || "N/A"}
                  </Typography>
                  {generatedNote.plan_confidence && (
                    <Chip
                      label={`Confidence: ${(
                        generatedNote.plan_confidence * 100
                      ).toFixed(1)}%`}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  sx={{ mt: 2 }}
                >
                  {updateMutation.isPending ? "Saving..." : "Save SOAP Note"}
                </Button>
              </>
            ) : (
              <Box sx={{ py: 10, textAlign: "center" }}>
                <Typography color="text.secondary">
                  Generated SOAP note will appear here...
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Container>
    </div>
  );
};
