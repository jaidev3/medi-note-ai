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
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import { ArrowBack, Search } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import {
  useQueryKnowledgeBase,
  useGenerateEmbeddings,
  useBatchEmbedSOAPNotes,
  useFindSimilarNotes,
  useSearchRAGBySimilarity,
  useRagEmbeddingStats,
  useNotesNeedingEmbedding,
  useEmbedApprovedNotes,
} from "@/hooks/useRagApi";
import { useListPatients } from "@/hooks/usePatientsApi";
import { useListSessions } from "@/hooks/useSessionsApi";

export const RAGQueryPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [query, setQuery] = useState("");
  const [patientId, setPatientId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [topK, setTopK] = useState(5);

  const [embedNoteId, setEmbedNoteId] = useState("");
  const [forceReembedSingle, setForceReembedSingle] = useState(false);
  const [batchNoteIdsInput, setBatchNoteIdsInput] = useState("");
  const [batchSessionId, setBatchSessionId] = useState("");
  const [batchPatientId, setBatchPatientId] = useState("");
  const [batchForceReembed, setBatchForceReembed] = useState(false);
  const [similarNoteId, setSimilarNoteId] = useState("");
  const [similarTopK, setSimilarTopK] = useState(5);
  const [similarityQuery, setSimilarityQuery] = useState("");
  const [similarityTopK, setSimilarityTopK] = useState(5);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
  const [embeddingStatsPatientId, setEmbeddingStatsPatientId] = useState("");
  const [needsNoteIdsInput, setNeedsNoteIdsInput] = useState("");
  const [needsSessionId, setNeedsSessionId] = useState("");
  const [needsPatientId, setNeedsPatientId] = useState("");
  const [embedApprovedForce, setEmbedApprovedForce] = useState(false);

  const queryMutation = useQueryKnowledgeBase();
  const embedMutation = useGenerateEmbeddings();
  const batchEmbedMutation = useBatchEmbedSOAPNotes();
  const similarMutation = useFindSimilarNotes();
  const similaritySearchMutation = useSearchRAGBySimilarity();
  const statsMutation = useRagEmbeddingStats();
  const notesNeedingMutation = useNotesNeedingEmbedding();
  const embedApprovedMutation = useEmbedApprovedNotes();
  const { data: patientsData } = useListPatients(1, 100);
  const { data: sessionsData } = useListSessions(
    1,
    100,
    patientId || undefined
  );

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;
  const formatLabel = (label: string) =>
    label
      .split("_")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");

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
                      label={`Confidence: ${(
                        (queryMutation.data.confidence ?? 0) * 100
                      ).toFixed(0)}%`}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`${queryMutation.data.total_chunks_found} chunks found`}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`${(
                        queryMutation.data.processing_time ?? 0
                      ).toFixed(2)}s`}
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

        <Paper sx={{ p: 4, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Find Similar SOAP Notes
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Reference note ID"
              value={similarNoteId}
              onChange={(e) => setSimilarNoteId(e.target.value)}
              fullWidth
              placeholder="UUID of note to compare"
            />
            <TextField
              label="Top K"
              type="number"
              value={similarTopK}
              onChange={(e) =>
                setSimilarTopK(
                  Math.min(50, Math.max(1, Number(e.target.value) || 1))
                )
              }
              inputProps={{ min: 1, max: 50 }}
              sx={{ maxWidth: 200 }}
            />
            <Button
              variant="contained"
              onClick={() =>
                similarMutation.mutate({
                  noteId: similarNoteId.trim(),
                  topK: similarTopK,
                })
              }
              disabled={!similarNoteId.trim() || similarMutation.isPending}
            >
              {similarMutation.isPending
                ? "Searching..."
                : "Find similar notes"}
            </Button>
            {similarMutation.error && (
              <Alert severity="error">
                {getErrorMessage(
                  similarMutation.error,
                  "Failed to find similar notes."
                )}
              </Alert>
            )}
            {similarMutation.data && (
              <Stack spacing={1}>
                <Typography variant="subtitle2">
                  {similarMutation.data.similar_notes.length} matches · Compared{" "}
                  {similarMutation.data.total_compared}
                </Typography>
                {similarMutation.data.similar_notes.map((note) => (
                  <Paper key={note.chunk_id} variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {note.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Score: {(note.similarity_score * 100).toFixed(1)}%
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: 4, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Search by Text Similarity
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Query text"
              multiline
              minRows={3}
              value={similarityQuery}
              onChange={(e) => setSimilarityQuery(e.target.value)}
              placeholder="Describe the case to find similar notes"
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Top K"
                type="number"
                value={similarityTopK}
                onChange={(e) =>
                  setSimilarityTopK(
                    Math.min(20, Math.max(1, Number(e.target.value) || 1))
                  )
                }
                inputProps={{ min: 1, max: 20 }}
              />
              <TextField
                label="Similarity threshold"
                type="number"
                value={similarityThreshold}
                onChange={(e) =>
                  setSimilarityThreshold(
                    Math.min(1, Math.max(0, Number(e.target.value) || 0))
                  )
                }
                inputProps={{ min: 0, max: 1, step: 0.05 }}
              />
            </Stack>
            <Button
              variant="contained"
              onClick={() =>
                similaritySearchMutation.mutate({
                  query_text: similarityQuery.trim(),
                  top_k: similarityTopK,
                  similarity_threshold: similarityThreshold,
                })
              }
              disabled={
                !similarityQuery.trim() || similaritySearchMutation.isPending
              }
            >
              {similaritySearchMutation.isPending
                ? "Searching..."
                : "Search notes"}
            </Button>
            {similaritySearchMutation.error && (
              <Alert severity="error">
                {getErrorMessage(
                  similaritySearchMutation.error,
                  "Similarity search failed."
                )}
              </Alert>
            )}
            {similaritySearchMutation.data && (
              <Stack spacing={1}>
                <Typography variant="subtitle2">
                  {similaritySearchMutation.data.similar_notes.length} matches ·
                  Processed in {similaritySearchMutation.data.processing_time}s
                </Typography>
                {similaritySearchMutation.data.similar_notes.map((note) => (
                  <Paper
                    key={`${note.chunk_id}-${note.source_id}`}
                    variant="outlined"
                    sx={{ p: 2 }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {note.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Score: {(note.similarity_score * 100).toFixed(1)}%
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: 4, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Embedding Actions
          </Typography>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Embed single SOAP note
              </Typography>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <TextField
                  label="Note ID"
                  value={embedNoteId}
                  onChange={(e) => setEmbedNoteId(e.target.value)}
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={forceReembedSingle}
                      onChange={(e) => setForceReembedSingle(e.target.checked)}
                    />
                  }
                  label="Force re-embed"
                />
                <Button
                  variant="contained"
                  onClick={() =>
                    embedMutation.mutate({
                      note_id: embedNoteId.trim(),
                      force_reembed: forceReembedSingle,
                    })
                  }
                  disabled={!embedNoteId.trim() || embedMutation.isPending}
                >
                  {embedMutation.isPending ? "Embedding..." : "Embed note"}
                </Button>
              </Stack>
              {embedMutation.error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {getErrorMessage(
                    embedMutation.error,
                    "Failed to embed note."
                  )}
                </Alert>
              )}
              {embedMutation.data && (
                <Alert
                  severity={embedMutation.data.success ? "success" : "warning"}
                  sx={{ mt: 2 }}
                >
                  {embedMutation.data.message} · Embedded{" "}
                  {embedMutation.data.embedded_count}
                </Alert>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Batch embed SOAP notes
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Note IDs (comma separated)"
                  value={batchNoteIdsInput}
                  onChange={(e) => setBatchNoteIdsInput(e.target.value)}
                  placeholder="id-1,id-2"
                  fullWidth
                />
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Session ID (optional)"
                    value={batchSessionId}
                    onChange={(e) => setBatchSessionId(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Patient ID (optional)"
                    value={batchPatientId}
                    onChange={(e) => setBatchPatientId(e.target.value)}
                    fullWidth
                  />
                </Stack>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={batchForceReembed}
                      onChange={(e) => setBatchForceReembed(e.target.checked)}
                    />
                  }
                  label="Force re-embed existing vectors"
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    const noteIds = batchNoteIdsInput
                      .split(",")
                      .map((id) => id.trim())
                      .filter(Boolean);

                    batchEmbedMutation.mutate({
                      note_ids: noteIds.length ? noteIds : undefined,
                      session_id: batchSessionId.trim() || undefined,
                      patient_id: batchPatientId.trim() || undefined,
                      force_reembed: batchForceReembed,
                    });
                  }}
                  disabled={batchEmbedMutation.isPending}
                >
                  {batchEmbedMutation.isPending
                    ? "Submitting..."
                    : "Start batch embedding"}
                </Button>
                {batchEmbedMutation.error && (
                  <Alert severity="error">
                    {getErrorMessage(
                      batchEmbedMutation.error,
                      "Batch embedding failed."
                    )}
                  </Alert>
                )}
                {batchEmbedMutation.data && (
                  <Alert
                    severity={
                      batchEmbedMutation.data.success ? "success" : "warning"
                    }
                  >
                    {batchEmbedMutation.data.message} · Embedded{" "}
                    {batchEmbedMutation.data.embedded_count}, Skipped{" "}
                    {batchEmbedMutation.data.skipped_count}
                  </Alert>
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: 4, mt: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Embedding Maintenance
          </Typography>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Embedding statistics
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Patient ID (optional)"
                  value={embeddingStatsPatientId}
                  onChange={(e) => setEmbeddingStatsPatientId(e.target.value)}
                />
                <Button
                  variant="contained"
                  onClick={() =>
                    statsMutation.mutate({
                      patientId: embeddingStatsPatientId.trim() || undefined,
                    })
                  }
                  disabled={statsMutation.isPending}
                >
                  {statsMutation.isPending ? "Fetching..." : "Get stats"}
                </Button>
              </Stack>
              {statsMutation.error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {getErrorMessage(
                    statsMutation.error,
                    "Failed to fetch embedding stats."
                  )}
                </Alert>
              )}
              {statsMutation.data && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                  <Stack spacing={0.5}>
                    {Object.entries(statsMutation.data).map(([key, value]) => (
                      <Typography variant="body2" key={key}>
                        <strong>{formatLabel(key)}:</strong> {String(value)}
                      </Typography>
                    ))}
                  </Stack>
                </Paper>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Notes needing embedding
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Note IDs (comma separated)"
                  value={needsNoteIdsInput}
                  onChange={(e) => setNeedsNoteIdsInput(e.target.value)}
                  placeholder="optional"
                />
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label="Session ID"
                    value={needsSessionId}
                    onChange={(e) => setNeedsSessionId(e.target.value)}
                  />
                  <TextField
                    label="Patient ID"
                    value={needsPatientId}
                    onChange={(e) => setNeedsPatientId(e.target.value)}
                  />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const noteIds = needsNoteIdsInput
                        .split(",")
                        .map((id) => id.trim())
                        .filter(Boolean);

                      notesNeedingMutation.mutate({
                        note_ids: noteIds.length ? noteIds : undefined,
                        session_id: needsSessionId.trim() || undefined,
                        patient_id: needsPatientId.trim() || undefined,
                      });
                    }}
                    disabled={notesNeedingMutation.isPending}
                  >
                    {notesNeedingMutation.isPending
                      ? "Checking..."
                      : "Show pending notes"}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      const noteIds = needsNoteIdsInput
                        .split(",")
                        .map((id) => id.trim())
                        .filter(Boolean);

                      embedApprovedMutation.mutate({
                        note_ids: noteIds.length ? noteIds : undefined,
                        session_id: needsSessionId.trim() || undefined,
                        patient_id: needsPatientId.trim() || undefined,
                        force_reembed: embedApprovedForce,
                      });
                    }}
                    disabled={embedApprovedMutation.isPending}
                  >
                    {embedApprovedMutation.isPending
                      ? "Triggering..."
                      : "Embed approved notes"}
                  </Button>
                </Stack>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={embedApprovedForce}
                      onChange={(e) => setEmbedApprovedForce(e.target.checked)}
                    />
                  }
                  label="Force re-embed approved notes"
                />
                {notesNeedingMutation.error && (
                  <Alert severity="error">
                    {getErrorMessage(
                      notesNeedingMutation.error,
                      "Failed to fetch pending notes."
                    )}
                  </Alert>
                )}
                {notesNeedingMutation.data && (
                  <Stack spacing={1}>
                    {notesNeedingMutation.data.length === 0 ? (
                      <Alert severity="success">
                        All approved notes are embedded.
                      </Alert>
                    ) : (
                      notesNeedingMutation.data.map((note) => (
                        <Paper
                          key={note.note_id}
                          variant="outlined"
                          sx={{ p: 2 }}
                        >
                          <Typography variant="body2">
                            Note {note.note_id} · Session{" "}
                            {note.session_id || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Approved: {note.user_approved ? "Yes" : "No"} · AI
                            approved: {note.ai_approved ? "Yes" : "No"}
                          </Typography>
                        </Paper>
                      ))
                    )}
                  </Stack>
                )}
                {embedApprovedMutation.error && (
                  <Alert severity="error">
                    {getErrorMessage(
                      embedApprovedMutation.error,
                      "Failed to trigger embeddings."
                    )}
                  </Alert>
                )}
                {embedApprovedMutation.data && (
                  <Alert
                    severity={
                      embedApprovedMutation.data.success ? "success" : "warning"
                    }
                  >
                    {embedApprovedMutation.data.message} · Embedded{" "}
                    {embedApprovedMutation.data.embedded_count}
                  </Alert>
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </div>
  );
};
