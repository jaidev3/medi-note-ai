import React from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
} from "@mui/material";
import { Upload } from "@mui/icons-material";

interface DocumentUploadProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  onUpload: () => void;
  isUploading: boolean;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  selectedFile,
  onFileSelect,
  onUpload,
  isUploading,
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Upload />
        Quick Upload
      </Typography>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Button
          variant="contained"
          component="label"
          startIcon={<Upload />}
          disabled={isUploading}
        >
          Choose File
          <input
            type="file"
            hidden
            onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
            accept=".pdf,.doc,.docx,.txt,.jpg,.png"
          />
        </Button>

        {selectedFile && (
          <>
            <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
              {selectedFile.name}
            </Typography>
            <Button
              variant="outlined"
              onClick={onUpload}
              disabled={isUploading}
            >
              Upload
            </Button>
          </>
        )}
      </Box>
    </Paper>
  );
};