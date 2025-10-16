import React from "react";
import {
  Paper,
  Stack,
  Box,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { DocumentListItem } from "./DocumentListItem";

interface DocumentMetadata {
  document_id: string;
  document_name: string;
  file_size: number;
  created_at: string;
  text_extracted: boolean;
}

interface SessionDocumentsListProps {
  documents: DocumentMetadata[];
  isLoading: boolean;
  selectedDocumentId: string | null;
  loadingDocumentId: string | null;
  onLoadText: (documentId: string, autoGenerate: boolean) => void;
  onClearSelection: () => void;
  formatFileSize: (size: number) => string;
}

export const SessionDocumentsList: React.FC<SessionDocumentsListProps> = ({
  documents,
  isLoading,
  selectedDocumentId,
  loadingDocumentId,
  onLoadText,
  onClearSelection,
  formatFileSize,
}) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h6">Session Documents</Typography>
          <Typography variant="body2" color="text.secondary">
            Load extracted text from an uploaded document to draft a SOAP note.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={onClearSelection}
          disabled={!selectedDocumentId}
        >
          Clear document selection
        </Button>
      </Stack>

      {isLoading && (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={20} />
          <Typography variant="body2">Loading documents…</Typography>
        </Stack>
      )}

      {!isLoading && documents.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No documents found for this session yet.
        </Typography>
      )}

      {!isLoading && documents.length > 0 && (
        <Stack spacing={2}>
          {documents.map((doc) => (
            <DocumentListItem
              key={doc.document_id}
              document={doc}
              isSelected={doc.document_id === selectedDocumentId}
              isLoading={loadingDocumentId === doc.document_id}
              onLoadText={(id) => onLoadText(id, false)}
              onLoadAndGenerate={(id) => onLoadText(id, true)}
              formatFileSize={formatFileSize}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
};
