import React from "react";
import { Paper, Typography, Stack, Chip } from "@mui/material";

interface SourceChunk {
  chunk_id: string;
  content: string;
  similarity_score: number;
  source_type: string;
  metadata?: Record<string, unknown>;
}

interface SourceChunkItemProps {
  source: SourceChunk;
}

export const SourceChunkItem: React.FC<SourceChunkItemProps> = ({ source }) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        mb: 1,
        bgcolor: "white",
        borderColor: "divider",
        "&:hover": { boxShadow: 1 },
      }}
    >
      <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.5 }}>
        {source.content}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <Chip
          label={`Score: ${(source.similarity_score * 100).toFixed(1)}%`}
          size="small"
          variant="outlined"
        />
        <Chip label={source.source_type} size="small" variant="outlined" />
      </Stack>
    </Paper>
  );
};
