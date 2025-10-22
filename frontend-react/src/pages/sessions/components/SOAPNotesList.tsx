import React from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import {
  Description,
  Visibility,
  Download,
} from "@mui/icons-material";

interface SOAPNotesListProps {
  soapNotes: any[] | undefined;
  isLoading: boolean;
  onViewNote: (note: any) => void;
  onExportNote: (noteId: string, fileName: string) => void;
  isExporting: boolean;
}

export const SOAPNotesList: React.FC<SOAPNotesListProps> = ({
  soapNotes,
  isLoading,
  onViewNote,
  onExportNote,
  isExporting,
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Description />
        SOAP Notes
      </Typography>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : soapNotes?.length ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {soapNotes.map((note: any) => (
            <Card key={note.note_id} variant="outlined">
              <CardContent sx={{ pb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="primary">
                      {new Date(note.created_at).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {note.approved ? "Approved" : "Draft"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => onViewNote(note)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => onExportNote(note.note_id, `soap-note-${new Date(note.created_at).toISOString().slice(0, 10)}`)}
                      disabled={isExporting}
                    >
                      Export
                    </Button>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{
                  maxHeight: 100,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical"
                }}>
                  {note.soap_note_content?.substring(0, 200)}...
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          No SOAP notes generated yet. Upload documents to get started.
        </Typography>
      )}
    </Paper>
  );
};