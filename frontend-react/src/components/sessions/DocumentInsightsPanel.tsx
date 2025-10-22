import React from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Grid,
} from "@mui/material";

interface MetadataData {
  file_path: string;
  processed_at?: string;
  soap_generated: boolean;
  text_extracted: boolean;
}

interface PiiData {
  pii_masked: boolean;
  pii_entities_found?: number;
  pii_processing_note?: string;
}

interface DocumentInsightsPanelProps {
  metadataDocId: string | null;
  piiDocId: string | null;
  metadataData?: MetadataData;
  piiData?: PiiData;
  isLoadingMetadata: boolean;
  isLoadingPii: boolean;
  metadataError: unknown;
  piiError: unknown;
  onClear: () => void;
  formatDisplayDate: (date: string) => string;
}

export const DocumentInsightsPanel: React.FC<DocumentInsightsPanelProps> = ({
  metadataDocId,
  piiDocId,
  metadataData,
  piiData,
  isLoadingMetadata,
  isLoadingPii,
  metadataError,
  piiError,
  onClear,
  formatDisplayDate,
}) => {
  if (!metadataDocId && !piiDocId) return null;

  return (
    <Box sx={{ mt: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle1">Document insights</Typography>
        <Button size="small" onClick={onClear}>
          Clear selections
        </Button>
      </Stack>

      {metadataDocId && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Metadata for document {metadataDocId?.slice(0, 8)}
          </Typography>
          {isLoadingMetadata ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} />
              <Typography variant="body2">Loading metadata…</Typography>
            </Stack>
          ) : metadataError ? (
            <Alert severity="error">Failed to fetch metadata.</Alert>
          ) : metadataData ? (
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  File path
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  {metadataData.file_path}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Processed at
                </Typography>
                <Typography variant="body2">
                  {metadataData.processed_at
                    ? formatDisplayDate(metadataData.processed_at)
                    : "Pending"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  SOAP generated
                </Typography>
                <Typography variant="body2">
                  {metadataData.soap_generated ? "Yes" : "No"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Text extracted
                </Typography>
                <Typography variant="body2">
                  {metadataData.text_extracted ? "Yes" : "No"}
                </Typography>
              </Grid>
            </Grid>
          ) : null}
        </Paper>
      )}

      {piiDocId && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            PII status for document {piiDocId?.slice(0, 8)}
          </Typography>
          {isLoadingPii ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} />
              <Typography variant="body2">Checking PII status…</Typography>
            </Stack>
          ) : piiError ? (
            <Alert severity="error">Failed to fetch PII status.</Alert>
          ) : piiData ? (
            <Stack spacing={1}>
              <Typography variant="body2">
                Masked: {piiData.pii_masked ? "Yes" : "No"}
              </Typography>
              <Typography variant="body2">
                Entities detected: {piiData.pii_entities_found ?? "Unknown"}
              </Typography>
              {piiData.pii_processing_note && (
                <Typography variant="body2">
                  Notes: {piiData.pii_processing_note}
                </Typography>
              )}
            </Stack>
          ) : null}
        </Paper>
      )}
    </Box>
  );
};
