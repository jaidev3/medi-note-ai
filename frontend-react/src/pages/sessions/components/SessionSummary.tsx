import React from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
} from "@mui/material";
import {
  Person,
  CalendarToday,
} from "@mui/icons-material";

const formatDisplayDate = (isoDate: string) => {
  try {
    return new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return isoDate;
  }
};

interface SessionSummaryProps {
  session: any;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({ session }) => {
  return (
    <Box sx={{ flex: { md: "0 0 400px", xs: "1 1 100%" } }}>
      <Paper sx={{ p: 3, height: "fit-content" }}>
        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Person />
          Session Summary
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Patient
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: "medium" }}>
            {session.patient_name || "Unknown Patient"}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <CalendarToday sx={{ fontSize: 16, mr: 1, verticalAlign: "middle" }} />
            Visit Date
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: "medium" }}>
            {formatDisplayDate(session.visit_date)}
          </Typography>
        </Box>

        {session.notes && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Notes
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
              {session.notes}
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Status
          </Typography>
          <Chip
            label={session.soap_note_count > 0 ? `${session.soap_note_count} SOAP Notes` : "No SOAP Notes"}
            color={session.soap_note_count > 0 ? "success" : "default"}
            size="small"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: "bold" }}>
              {session.document_count}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Documents
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" color="secondary" sx={{ fontWeight: "bold" }}>
              {session.soap_note_count}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              SOAP Notes
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};