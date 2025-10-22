import React from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import { Description } from "@mui/icons-material";

interface DocumentsListProps {
  documents: any[] | undefined;
  documentCount: number;
  isLoading: boolean;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({
  documents,
  documentCount,
  isLoading,
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Description />
        Documents ({documentCount})
      </Typography>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : documents?.length ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {documents.map((doc: any) => (
            <Card key={doc.document_id} variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="subtitle2">
                      {doc.filename}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Chip
                    label={doc.processed ? "Processed" : "Pending"}
                    color={doc.processed ? "success" : "warning"}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          No documents uploaded yet.
        </Typography>
      )}
    </Paper>
  );
};