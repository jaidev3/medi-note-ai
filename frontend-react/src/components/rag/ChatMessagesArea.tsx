import React, { useRef, useEffect } from "react";
import { Box, Paper, Typography, Fade, CircularProgress } from "@mui/material";
import { ChatMessageItem } from "./ChatMessageItem";
import { Psychology as AIIcon, QuestionAnswer as ChatIcon } from "@mui/icons-material";

interface SourceChunk {
  chunk_id: string;
  content: string;
  similarity_score: number;
  source_type: string;
  metadata?: Record<string, unknown>;
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp?: number;
  sources?: SourceChunk[];
  metadata?: {
    confidence?: number;
    processing_time?: number;
  };
}

interface ChatMessagesAreaProps {
  messages: Message[];
  patientId: string;
  isLoading?: boolean;
}

export const ChatMessagesArea: React.FC<ChatMessagesAreaProps> = ({
  messages,
  patientId,
  isLoading = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Paper
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 3,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        mb: 2,
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          background: "transparent",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(0, 0, 0, 0.2)",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(0, 0, 0, 0.3)",
          },
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "text.secondary",
              textAlign: "center",
              px: 3,
            }}
          >
            <Box
              sx={{
                mb: 3,
                p: 3,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)",
              }}
            >
              {patientId ? (
                <AIIcon sx={{ fontSize: 48, color: "white" }} />
              ) : (
                <ChatIcon sx={{ fontSize: 48, color: "white" }} />
              )}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: "#1e293b" }}>
              {patientId ? "Ready to assist!" : "Welcome to AI Medical Assistant"}
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748b", maxWidth: 400, lineHeight: 1.6 }}>
              {patientId
                ? "Ask me anything about this patient's medical history, visits, or notes. I'll provide accurate information based on their records."
                : "Select a patient from the dropdown above to start analyzing their medical records with AI-powered insights."}
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => (
              <Fade key={message.id} in timeout={300 + index * 100}>
                <div>
                  <ChatMessageItem key={message.id} message={message} />
                </div>
              </Fade>
            ))}
            {isLoading && (
              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: "success.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress size={20} sx={{ color: "white" }} />
                </Box>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "grey.100",
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    AI is thinking...
                  </Typography>
                </Paper>
              </Box>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </Box>
    </Paper>
  );
};
