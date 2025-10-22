import React from "react";
import { Box, Typography, Button, Stack, Chip } from "@mui/material";

interface Document {
  document_id: string;
  document_name: string;
  file_type?: string;
  file_size: number;
  created_at: string;
  upload_status: string;
  text_extracted: boolean;
  soap_generated: boolean;
}

interface DocumentListItemProps {
  document: Document;
  isProcessing: boolean;
  isLoadingContent: boolean;
  isMetadataActive: boolean;
  isPiiActive: boolean;
  onViewText: (documentId: string) => void;
  onReprocess: (documentId: string) => void;
  onToggleMetadata: (documentId: string) => void;
  onTogglePii: (documentId: string) => void;
  formatDisplayDate: (date: string) => string;
}

export const DocumentListItem: React.FC<DocumentListItemProps> = ({
  document: doc,
  isProcessing,
  isLoadingContent,
  isMetadataActive,
  isPiiActive,
  onViewText,
  onReprocess,
  onToggleMetadata,
  onTogglePii,
  formatDisplayDate,
}) => {
  const fileSizeKb = (doc.file_size / 1024).toFixed(1);
  const createdDisplay = formatDisplayDate(doc.created_at);

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        border: "1px solid #f1f1f1",
        borderRadius: 1,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={1.5}
        alignItems={{ xs: "flex-start", md: "center" }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {doc.document_name || "Document"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {doc.file_type?.toUpperCase() || "UNKNOWN"} • {fileSizeKb}
            KB • Uploaded {createdDisplay}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            <Chip
              label={doc.upload_status}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={
                doc.text_extracted ? "Text extracted" : "Extraction pending"
              }
              size="small"
              color={doc.text_extracted ? "success" : "default"}
            />
            {doc.soap_generated && (
              <Chip label="SOAP generated" size="small" color="success" />
            )}
          </Stack>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Button
            size="small"
            onClick={() => onViewText(doc.document_id)}
            disabled={isLoadingContent}
          >
            {isLoadingContent ? "Loading..." : "View text"}
          </Button>
          <Button
            size="small"
            onClick={() => onReprocess(doc.document_id)}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Reprocess"}
          </Button>
          <Button
            size="small"
            variant={isMetadataActive ? "contained" : "outlined"}
            onClick={() => onToggleMetadata(doc.document_id)}
          >
            Metadata
          </Button>
          <Button
            size="small"
            variant={isPiiActive ? "contained" : "outlined"}
            onClick={() => onTogglePii(doc.document_id)}
          >
            PII status
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};
