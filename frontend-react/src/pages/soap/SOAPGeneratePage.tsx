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
} from "@mui/material";
import { ArrowBack, Send } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";

export const SOAPGeneratePage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [transcript, setTranscript] = useState("");
  const [soapNote, setSoapNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setError("Please enter a transcript");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSoapNote(
        "Generated SOAP note will appear here...\n\nSubjective:\n\nObjective:\n\nAssessment:\n\nPlan:"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate SOAP note");
    } finally {
      setLoading(false);
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
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
              startIcon={loading ? <CircularProgress size={20} /> : <Send />}
              onClick={handleGenerate}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? "Generating..." : "Generate SOAP Note"}
            </Button>
          </Paper>

          <Paper sx={{ p: 3, flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Generated SOAP Note
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={20}
              value={soapNote}
              onChange={(e) => setSoapNote(e.target.value)}
              placeholder="Generated SOAP note will appear here..."
              variant="outlined"
            />
            <Button
              variant="outlined"
              fullWidth
              disabled={!soapNote}
              sx={{ mt: 2 }}
            >
              Save SOAP Note
            </Button>
          </Paper>
        </Box>
      </Container>
    </div>
  );
};
