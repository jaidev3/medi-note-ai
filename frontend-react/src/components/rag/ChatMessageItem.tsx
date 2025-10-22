import React from "react";
import { Box, Avatar, Paper, Typography, Chip, Fade } from "@mui/material";
import { SourceChunkItem } from "./SourceChunkItem";
import { Person as UserIcon, SmartToy as BotIcon } from "@mui/icons-material";

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
  const isUser = message.type === "user";

  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: "flex",
          justifyContent: isUser ? "flex-end" : "flex-start",
          mb: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            maxWidth: "75%",
            flexDirection: isUser ? "row-reverse" : "row",
            alignItems: "flex-start",
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: isUser
                ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              border: "2px solid white",
            }}
          >
            {isUser ? (
              <UserIcon sx={{ fontSize: 20, color: "white" }} />
            ) : (
              <BotIcon sx={{ fontSize: 20, color: "white" }} />
            )}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Paper
              sx={{
                p: 2.5,
                background: isUser
                  ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                  : "white",
                color: isUser ? "white" : "#1e293b",
                borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                boxShadow: isUser
                  ? "0 4px 12px rgba(59, 130, 246, 0.3)"
                  : "0 4px 12px rgba(0, 0, 0, 0.08)",
                border: isUser ? "none" : "1px solid #e2e8f0",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: isUser
                    ? "0 6px 16px rgba(59, 130, 246, 0.4)"
                    : "0 6px 16px rgba(0, 0, 0, 0.12)",
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  fontSize: "14px",
                }}
              >
                {message.content}
              </Typography>

              {/* Confidence & Processing Time */}
              {message.metadata && (
                <Box
                  sx={{
                    mt: 2,
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
                      icon={<Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: message.metadata.confidence > 0.8 ? "#4ade80" : message.metadata.confidence > 0.6 ? "#facc15" : "#f87171", mr: 0.5 }} />}
                      sx={{
                        bgcolor: isUser
                          ? "rgba(255,255,255,0.25)"
                          : "#f1f5f9",
                        color: isUser ? "white" : "#475569",
                        fontSize: "11px",
                        height: 24,
                        "& .MuiChip-label": { px: 1 },
                      }}
                    />
                  )}
                  {message.metadata.processing_time !== undefined && (
                    <Chip
                      label={`${message.metadata.processing_time.toFixed(2)}s`}
                      size="small"
                      sx={{
                        bgcolor: isUser
                          ? "rgba(255,255,255,0.25)"
                          : "#f1f5f9",
                        color: isUser ? "white" : "#475569",
                        fontSize: "11px",
                        height: 24,
                        "& .MuiChip-label": { px: 1 },
                      }}
                    />
                  )}
                </Box>
              )}

              {/* Timestamp */}
              {message.timestamp && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1.5,
                    fontSize: "10px",
                    opacity: 0.8,
                    letterSpacing: 0.3,
                  }}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              )}
            </Paper>

            {/* Source Chunks */}
            {message.sources && message.sources.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mb: 1,
                    color: "#64748b",
                    fontSize: "11px",
                    fontWeight: 500,
                    letterSpacing: 0.3,
                  }}
                >
                  📄 {message.sources.length} source{message.sources.length !== 1 ? "s" : ""} referenced
                </Typography>
                {message.sources.map((source, index) => (
                  <Fade key={source.chunk_id} in timeout={400 + index * 100}>
                    <div>
                      <SourceChunkItem source={source} />
                    </div>
                  </Fade>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Fade>
  );
};
