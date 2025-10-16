import React, { useRef, useEffect } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { ChatMessageItem } from "./ChatMessageItem";

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
}

export const ChatMessagesArea: React.FC<ChatMessagesAreaProps> = ({
  messages,
  patientId,
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
        boxShadow: 2,
        mb: 2,
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
            <ChatMessageItem key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>
    </Paper>
  );
};
