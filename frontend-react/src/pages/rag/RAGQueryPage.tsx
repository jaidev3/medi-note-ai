import React, { useState, useRef, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from "@mui/material";
import {
  Send as SendIcon,
  ClearAll as ClearAllIcon,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material";
import { useQueryKnowledgeBase } from "@/hooks/useRagApi";
import { useListPatients } from "@/hooks/usePatientsApi";
import { useListSessions } from "@/hooks/useSessionsApi";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp?: number;
  sources?: Array<{
    chunk_id: string;
    content: string;
    similarity_score: number;
    source_type: string;
    metadata?: Record<string, unknown>;
  }>;
  metadata?: {
    confidence?: number;
    processing_time?: number;
  };
}

export const RAGQueryPage: React.FC = () => {
  useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [patientId, setPatientId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const queryMutation = useQueryKnowledgeBase();
  const { data: patientsData } = useListPatients(1, 100);
  const { data: sessionsData } = useListSessions(
    1,
    100,
    patientId || undefined
  );

  const patients = patientsData?.patients || [];
  const sessions = sessionsData?.sessions || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) {
      return;
    }

    if (!patientId) {
      alert("Please select a patient first");
      return;
    }

    // Add user message to chat
    const now = Date.now();
    const userMessageId = `msg-${now}`;
    const userMessage: Message = {
      id: userMessageId,
      type: "user",
      content: inputMessage,
      timestamp: now,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    // Query the knowledge base
    try {
      const response = await queryMutation.mutateAsync({
        query: inputMessage,
        patient_id: patientId,
        session_id: sessionId || undefined,
        top_k: 5,
      });

      // Add assistant message with answer
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        type: "assistant",
        content: response.answer || "I couldn't find a relevant answer.",
        sources: response.retrieved_chunks || [],
        timestamp: Date.now(),
        metadata: {
          confidence: response.confidence,
          processing_time: response.processing_time,
        },
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        type: "assistant",
        content: `I encountered an error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      <Container
        maxWidth="md"
        sx={{ display: "flex", flexDirection: "column", flex: 1, py: 3 }}
      >
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3, boxShadow: 1 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 600, mb: 2 }}
          >
            Ask About Patient Records
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a patient and ask any question about their medical history,
            visits, or notes
          </Typography>

          {/* Selected patient/session chips */}
          <Box
            sx={{
              mb: 2,
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {patientId && (
              <Chip
                label={
                  patients.find((p) => p.id === patientId)?.name || "Patient"
                }
                color="primary"
                size="small"
              />
            )}
            {sessionId && (
              <Chip
                label={
                  sessions.find((s) => s.session_id === sessionId)?.visit_date
                    ? new Date(
                        sessions.find(
                          (s) => s.session_id === sessionId
                        )!.visit_date
                      ).toLocaleDateString()
                    : "Session"
                }
                size="small"
              />
            )}
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "flex-start",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{display:"flex", gap: 2 }}>
              <FormControl fullWidth sx={{ maxWidth: 400 }}>
                <InputLabel>Select Patient</InputLabel>
                <Select
                  value={patientId}
                  onChange={(e) => {
                    setPatientId(e.target.value);
                    setSessionId(""); // Clear session when changing patient
                    setMessages([]); // Clear chat when switching patients
                  }}
                  label="Select Patient"
                >
                  <MenuItem value="">Choose a patient...</MenuItem>
                  {patients.map((patient) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ maxWidth: 400}}>
                <InputLabel>Session (Optional)</InputLabel>
                <Select
                  value={sessionId}
                  onChange={(e) => {
                    setSessionId(e.target.value);
                    setMessages([]); // Clear chat when switching sessions
                  }}
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
            </Box>

            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Button
                variant="outlined"
                startIcon={<ClearAllIcon />}
                onClick={() => setMessages([])}
                disabled={messages.length === 0}
              >
                Clear Chat
              </Button>
              <Button
                variant="contained"
                startIcon={<FileDownloadIcon />}
                onClick={() => {
                  const text = messages
                    .map((m) => {
                      const time = m.timestamp
                        ? new Date(m.timestamp).toLocaleString()
                        : "";
                      return `[${time}] ${m.type === "user" ? "User" : "AI"}: ${
                        m.content
                      }`;
                    })
                    .join("\n\n");
                  const blob = new Blob([text], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${patientId || "chat"}-transcript.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={messages.length === 0}
              >
                Download Transcript
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* Chat Area */}
        <Paper
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: 2,
            mb: 2,
          }}
        >
          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              backgroundColor: "#fafafa",
            }}
          >
            {messages.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "text.secondary",
                }}
              >
                <Typography variant="body1" textAlign="center">
                  {patientId
                    ? "Start a conversation! Ask me anything about this patient's records."
                    : "Select a patient to begin"}
                </Typography>
              </Box>
            ) : (
              messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: "flex",
                    justifyContent:
                      message.type === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      maxWidth: "85%",
                      flexDirection:
                        message.type === "user" ? "row-reverse" : "row",
                      alignItems: "flex-start",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor:
                          message.type === "user"
                            ? "primary.main"
                            : "success.main",
                      }}
                    >
                      {message.type === "user" ? "U" : "AI"}
                    </Avatar>
                    <Box>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor:
                            message.type === "user"
                              ? "primary.main"
                              : "grey.100",
                          color:
                            message.type === "user" ? "white" : "text.primary",
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: "pre-wrap" }}
                        >
                          {message.content}
                        </Typography>

                        {/* Confidence & Processing Time */}
                        {message.metadata && (
                          <Box
                            sx={{
                              mt: 1.5,
                              display: "flex",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            {message.metadata.confidence !== undefined && (
                              <Chip
                                label={`Confidence: ${(
                                  message.metadata.confidence * 100
                                ).toFixed(0)}%`}
                                size="small"
                                sx={{
                                  bgcolor:
                                    message.type === "user"
                                      ? "rgba(255,255,255,0.2)"
                                      : "rgba(0,0,0,0.1)",
                                  color:
                                    message.type === "user"
                                      ? "white"
                                      : "inherit",
                                }}
                              />
                            )}
                            {message.metadata.processing_time !== undefined && (
                              <Chip
                                label={`${message.metadata.processing_time.toFixed(
                                  2
                                )}s`}
                                size="small"
                                sx={{
                                  bgcolor:
                                    message.type === "user"
                                      ? "rgba(255,255,255,0.2)"
                                      : "rgba(0,0,0,0.1)",
                                  color:
                                    message.type === "user"
                                      ? "white"
                                      : "inherit",
                                }}
                              />
                            )}
                          </Box>
                        )}

                        {/* Timestamp */}
                        {message.timestamp && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 1 }}
                          >
                            {new Date(message.timestamp).toLocaleString()}
                          </Typography>
                        )}
                      </Paper>

                      {/* Source Chunks */}
                      {message.sources && message.sources.length > 0 && (
                        <Box sx={{ mt: 1.5 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 1 }}
                          >
                            📄 {message.sources.length} source
                            {message.sources.length !== 1 ? "s" : ""}
                          </Typography>
                          {message.sources.map((source) => (
                            <Paper
                              key={source.chunk_id}
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                mb: 1,
                                bgcolor: "white",
                                borderColor: "divider",
                                "&:hover": { boxShadow: 1 },
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ mb: 1, lineHeight: 1.5 }}
                              >
                                {source.content}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{ flexWrap: "wrap" }}
                              >
                                <Chip
                                  label={`Score: ${(
                                    source.similarity_score * 100
                                  ).toFixed(1)}%`}
                                  size="small"
                                  variant="outlined"
                                />
                                <Chip
                                  label={source.source_type}
                                  size="small"
                                  variant="outlined"
                                />
                              </Stack>
                            </Paper>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: "divider",
              backgroundColor: "white",
            }}
          >
            {queryMutation.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {queryMutation.error.message}
              </Alert>
            )}
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                placeholder="Ask a question..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), handleSendMessage())
                }
                multiline
                maxRows={3}
                disabled={!patientId || queryMutation.isPending}
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={
                  !patientId || queryMutation.isPending || !inputMessage.trim()
                }
                sx={{ alignSelf: "flex-end" }}
              >
                {queryMutation.isPending ? (
                  <CircularProgress size={20} />
                ) : (
                  <SendIcon />
                )}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </div>
  );
};
