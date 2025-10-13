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
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { ArrowBack, Search } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useQueryKnowledgeBase } from "@/hooks/useRagApi";
import { useListPatients } from "@/hooks/usePatientsApi";
import { useListSessions } from "@/hooks/useSessionsApi";

export const RAGQueryPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [query, setQuery] = useState("");
  const [patientId, setPatientId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [topK, setTopK] = useState(5);

  const queryMutation = useQueryKnowledgeBase();
  const { data: patientsData } = useListPatients(1, 100);
  const { data: sessionsData } = useListSessions(
    1,
    100,
    patientId || undefined
  );

  const patients = patientsData?.patients || [];
  const sessions = sessionsData?.sessions || [];

  const handleSearch = async () => {
    if (!query.trim()) {
      return;
    }

    await queryMutation.mutateAsync({
      query,
      patient_id: patientId || undefined,
      session_id: sessionId || undefined,
      top_k: topK,
    });
  };

  const results = queryMutation.data?.retrieved_chunks || [];
  const answer = queryMutation.data?.answer || "";

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
            Query Documents
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Search Patient Documents
          </Typography>

          {queryMutation.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {queryMutation.error.message}
            </Alert>
          )}

          <Stack spacing={2} sx={{ mb: 3 }}>
            <Box display="flex" gap={2}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Patient (Optional)</InputLabel>
                <Select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  label="Patient (Optional)"
                >
                  <MenuItem value="">All Patients</MenuItem>
                  {patients.map((patient) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Session (Optional)</InputLabel>
                <Select
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  label="Session (Optional)"
                  disabled={!patientId}
                >
                  <MenuItem value="">All Sessions</MenuItem>
                  {sessions.map((session) => (
                    <MenuItem
                      key={session.session_id}
                      value={session.session_id}
                    >
                      {new Date(session.visit_date).toLocaleDateString()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Top K</InputLabel>
                <Select
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  label="Top K"
                >
                  <MenuItem value={3}>3</MenuItem>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about patient records..."
                variant="outlined"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={queryMutation.isPending || !query.trim()}
                startIcon={
                  queryMutation.isPending ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Search />
                  )
                }
              >
                Search
              </Button>
            </Box>
          </Stack>

          {answer && (
            <Card sx={{ mb: 3, bgcolor: "primary.light" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Answer
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {answer}
                </Typography>
                {queryMutation.data && (
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={`Confidence: ${queryMutation.data.confidence}`}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`${queryMutation.data.total_chunks_found} chunks found`}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`${queryMutation.data.processing_time.toFixed(
                        2
                      )}s`}
                      size="small"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Source Chunks ({results.length})
              </Typography>
              <List>
                {results.map((result) => (
                  <ListItem key={result.chunk_id} divider>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body2" component="span">
                            {result.content}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={`Score: ${(
                                result.similarity_score * 100
                              ).toFixed(1)}%`}
                              size="small"
                              color="primary"
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              label={result.source_type}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            {result.metadata && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                component="span"
                              >
                                {JSON.stringify(result.metadata)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      </Container>
    </div>
  );
};
