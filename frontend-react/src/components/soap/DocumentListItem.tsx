import React from "react";
import { Paper, Stack, Typography, Button } from "@mui/material";

interface DocumentMetadata {
  document_id: string;
  document_name: string;
  file_size: number;
  created_at: string;
  text_extracted: boolean;
}

interface DocumentListItemProps {
  document: DocumentMetadata;
  isSelected: boolean;
  isLoading: boolean;
  onLoadText: (documentId: string) => void;
  onLoadAndGenerate: (documentId: string) => void;
  formatFileSize: (size: number) => string;
}

export const DocumentListItem: React.FC<DocumentListItemProps> = ({
  document: doc,
  isSelected,
  isLoading,
  onLoadText,
  onLoadAndGenerate,
  formatFileSize,
}) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderColor: isSelected ? "primary.main" : "divider",
        backgroundColor: isSelected ? "action.selected" : "inherit",
      }}
    >
      <Stack spacing={1}>
        <Typography variant="subtitle1" fontWeight={600}>
          {doc.document_name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Size: {formatFileSize(doc.file_size)} · Uploaded:{" "}
          {new Date(doc.created_at).toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Status: {doc.text_extracted ? "Text extracted" : "Extraction pending"}
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Button
            variant="contained"
            size="small"
            onClick={() => onLoadText(doc.document_id)}
            disabled={isLoading}
          >
            {isLoading ? "Loading…" : "Load into transcript"}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => onLoadAndGenerate(doc.document_id)}
            disabled={isLoading}
          >
            {isLoading ? "Processing…" : "Load & generate"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};
