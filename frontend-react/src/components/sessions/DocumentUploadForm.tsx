import React from "react";
import { Box, Button, Typography, Alert } from "@mui/material";

interface DocumentUploadFormProps {
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
}

export const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({
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
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <input
        accept=".pdf,.doc,.docx,.txt"
        style={{ display: "none" }}
        id="session-file-upload"
        type="file"
        onChange={(e) => {
          if (e.target.files && e.target.files[0])
            onFileSelect(e.target.files[0]);
        }}
      />
      <label htmlFor="session-file-upload">
        <Button variant="outlined" component="span" fullWidth sx={{ mb: 1 }}>
          Select File to Upload
        </Button>
      </label>

      {selectedFile && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Selected: {selectedFile.name} —{" "}
          {(selectedFile.size / 1024).toFixed(2)} KB
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
        <Button variant="contained" onClick={onUpload} disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload to Session"}
        </Button>
        <Button variant="outlined" onClick={onToggleExtractText}>
          {extractText ? "Extract: ON" : "Extract: OFF"}
        </Button>
        <Button variant="outlined" onClick={onToggleGenerateSoap}>
          {generateSoap ? "Generate SOAP: ON" : "Generate SOAP: OFF"}
        </Button>
      </Box>
      {uploadSuccess && (
        <Alert severity="success" sx={{ mt: 1 }}>
          {uploadMessage || "Uploaded"}
        </Alert>
      )}
      {Boolean(uploadError) && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {uploadError instanceof Error ? uploadError.message : "Upload failed"}
        </Alert>
      )}
    </Box>
  );
};
