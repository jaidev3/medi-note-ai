import React, { useState } from "react";
import { Container, Box } from "@mui/material";
import { useQueryKnowledgeBase } from "@/hooks/useRagApi";
import { useListPatients } from "@/hooks/usePatientsApi";
import { useListSessions } from "@/hooks/useSessionsApi";
import { useAuth } from "@/hooks/useAuth";
import { RAGHeader, ChatMessagesArea, ChatInputArea } from "@/components/rag";

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

  const queryMutation = useQueryKnowledgeBase();
  const { data: patientsData } = useListPatients(1, 100);
  const { data: sessionsData } = useListSessions(
    1,
    100,
    patientId || undefined
  );

  const patients = patientsData?.patients || [];
  const sessions = sessionsData?.sessions || [];

  const handlePatientChange = (newPatientId: string) => {
    setPatientId(newPatientId);
    setSessionId(""); // Clear session when changing patient
    setMessages([]); // Clear chat when switching patients
  };

  const handleSessionChange = (newSessionId: string) => {
    setSessionId(newSessionId);
    setMessages([]); // Clear chat when switching sessions
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleDownloadTranscript = () => {
    const text = messages
      .map((m) => {
        const time = m.timestamp ? new Date(m.timestamp).toLocaleString() : "";
        return `[${time}] ${m.type === "user" ? "User" : "AI"}: ${m.content}`;
      })
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${patientId || "chat"}-transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #ddd6fe 75%, #f3e8ff 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          py: 3,
          px: { xs: 2, sm: 3 },
        }}
      >
        <RAGHeader
          patientId={patientId}
          sessionId={sessionId}
          patients={patients}
          sessions={sessions}
          messages={messages}
          onPatientChange={handlePatientChange}
          onSessionChange={handleSessionChange}
          onClearChat={handleClearChat}
          onDownloadTranscript={handleDownloadTranscript}
        />

        <ChatMessagesArea
          messages={messages}
          patientId={patientId}
          isLoading={queryMutation.isPending}
        />

        <ChatInputArea
          inputMessage={inputMessage}
          patientId={patientId}
          isLoading={queryMutation.isPending}
          error={queryMutation.error}
          onInputChange={setInputMessage}
          onSendMessage={handleSendMessage}
        />
      </Container>
    </Box>
  );
};
