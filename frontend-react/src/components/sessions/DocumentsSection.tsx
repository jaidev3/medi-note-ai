import React from "react";
import { Paper, Typography, Box, CircularProgress, Alert } from "@mui/material";
import { DocumentUploadForm } from "./DocumentUploadForm";
import { DocumentListItem } from "./DocumentListItem";
import { DocumentInsightsPanel } from "./DocumentInsightsPanel";
import { DocumentContentViewer } from "./DocumentContentViewer";

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

interface DocumentsSectionProps {
  documents: Document[] | undefined;
  isLoading: boolean;
  error: unknown;
  actionMessage: { type: "success" | "error" | "info"; message: string } | null;
  onClearActionMessage: () => void;
  // Upload props
  selectedFile: File | null;
  extractText: boolean;
  generateSoap: boolean;
  isUploading: boolean;
  uploadSuccess: boolean;
  uploadError: unknown;
  uploadMessage?: string;
  onFileSelect: (file: File | null) => void;
  onUpload: () => void;
  onToggleExtractText: () => void;
  onToggleGenerateSoap: () => void;
  // Document actions
  processingDocumentId: string | null;
  loadingContentDocId: string | null;
  onViewText: (documentId: string) => void;
  onReprocess: (documentId: string) => void;
  // Insights
  metadataDocId: string | null;
  piiDocId: string | null;
  onToggleMetadata: (documentId: string) => void;
  onTogglePii: (documentId: string) => void;
  onClearInsights: () => void;
  metadataData?: any;
  piiData?: any;
  isLoadingMetadata: boolean;
  isLoadingPii: boolean;
  metadataError: unknown;
  piiError: unknown;
  // Content viewer
  viewingContent: { documentId: string; content: string } | null;
  onCloseContentViewer: () => void;
  formatDisplayDate: (date: string) => string;
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  documents,
  isLoading,
  error,
  actionMessage,
  onClearActionMessage,
  selectedFile,
  extractText,
  generateSoap,
  isUploading,
  uploadSuccess,
  uploadError,
  uploadMessage,
  onFileSelect,
  onUpload,
  onToggleExtractText,
  onToggleGenerateSoap,
  processingDocumentId,
  loadingContentDocId,
  onViewText,
  onReprocess,
  metadataDocId,
  piiDocId,
  onToggleMetadata,
  onTogglePii,
  onClearInsights,
  metadataData,
  piiData,
  isLoadingMetadata,
  isLoadingPii,
  metadataError,
  piiError,
  viewingContent,
  onCloseContentViewer,
  formatDisplayDate,
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Documents
      </Typography>

      <DocumentUploadForm
        selectedFile={selectedFile}
        extractText={extractText}
        generateSoap={generateSoap}
        isUploading={isUploading}
        uploadSuccess={uploadSuccess}
        uploadError={uploadError}
        uploadMessage={uploadMessage}
        onFileSelect={onFileSelect}
        onUpload={onUpload}
        onToggleExtractText={onToggleExtractText}
        onToggleGenerateSoap={onToggleGenerateSoap}
      />

      {actionMessage && (
        <Alert
          severity={actionMessage.type}
          sx={{ mb: 2 }}
          onClose={onClearActionMessage}
        >
          {actionMessage.message}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ py: 2, textAlign: "center" }}>
          <CircularProgress size={20} />
        </Box>
      ) : error ? (
        <Alert severity="error">Failed to load documents.</Alert>
      ) : !documents || documents.length === 0 ? (
        <Alert severity="info">No documents uploaded for this session.</Alert>
      ) : (
        documents.map((doc) => (
          <DocumentListItem
            key={doc.document_id}
            document={doc}
            isProcessing={processingDocumentId === doc.document_id}
            isLoadingContent={loadingContentDocId === doc.document_id}
            isMetadataActive={metadataDocId === doc.document_id}
            isPiiActive={piiDocId === doc.document_id}
            onViewText={onViewText}
            onReprocess={onReprocess}
            onToggleMetadata={onToggleMetadata}
            onTogglePii={onTogglePii}
            formatDisplayDate={formatDisplayDate}
          />
        ))
      )}

      <DocumentInsightsPanel
        metadataDocId={metadataDocId}
        piiDocId={piiDocId}
        metadataData={metadataData}
        piiData={piiData}
        isLoadingMetadata={isLoadingMetadata}
        isLoadingPii={isLoadingPii}
        metadataError={metadataError}
        piiError={piiError}
        onClear={onClearInsights}
        formatDisplayDate={formatDisplayDate}
      />

      {viewingContent && (
        <DocumentContentViewer
          content={viewingContent.content}
          onClose={onCloseContentViewer}
        />
      )}
    </Paper>
  );
};
