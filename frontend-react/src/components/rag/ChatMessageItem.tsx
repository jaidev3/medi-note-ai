import React from "react";
import { Box, Avatar, Paper, Typography, Chip } from "@mui/material";
import { SourceChunkItem } from "./SourceChunkItem";

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

interface ChatMessageItemProps {
  message: Message;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: message.type === "user" ? "flex-end" : "flex-start",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          maxWidth: "85%",
          flexDirection: message.type === "user" ? "row-reverse" : "row",
          alignItems: "flex-start",
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: message.type === "user" ? "primary.main" : "success.main",
          }}
        >
          {message.type === "user" ? "U" : "AI"}
        </Avatar>
        <Box>
          <Paper
            sx={{
              p: 2,
              bgcolor: message.type === "user" ? "primary.main" : "grey.100",
              color: message.type === "user" ? "white" : "text.primary",
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
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
                      color: message.type === "user" ? "white" : "inherit",
                    }}
                  />
                )}
                {message.metadata.processing_time !== undefined && (
                  <Chip
                    label={`${message.metadata.processing_time.toFixed(2)}s`}
                    size="small"
                    sx={{
                      bgcolor:
                        message.type === "user"
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(0,0,0,0.1)",
                      color: message.type === "user" ? "white" : "inherit",
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
                <SourceChunkItem key={source.chunk_id} source={source} />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
