import React from "react";
import {
  Paper,
  Stack,
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
} from "@mui/material";
import { FolderOpen, Clear } from "@mui/icons-material";
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
    <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        border: "1px solid #e8ebf8",
        boxShadow: "0 4px 20px rgba(102, 126, 234, 0.08)",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        sx={{ mb: 2 }}
      >
        <Box>
          <Box display="flex" alignItems="center" mb={1}>
            <FolderOpen color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              Session Documents
            </Typography>
            {documents.length > 0 && (
              <Chip
                label={`${documents.length} documents`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ ml: 2 }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Load extracted text from uploaded documents to generate SOAP notes.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Clear />}
          onClick={onClearSelection}
          disabled={!selectedDocumentId}
          sx={{ borderRadius: 2 }}
        >
          Clear Selection
        </Button>
      </Stack>

      {isLoading && (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={20} />
          <Typography variant="body2">Loading documents…</Typography>
        </Stack>
      )}

      {!isLoading && documents.length === 0 && (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <FolderOpen sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={500} gutterBottom>
            No Documents Available
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Upload and process documents for this session to generate SOAP notes from them.
          </Typography>
        </Box>
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
