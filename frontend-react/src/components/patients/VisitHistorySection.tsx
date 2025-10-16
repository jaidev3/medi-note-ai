import React from "react";
import {
  Paper,
  Typography,
  Stack,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Pagination,
} from "@mui/material";
import { SessionResponse } from "@/lib";
import { VisitsTable } from "./VisitsTable";

interface VisitHistorySectionProps {
  patient: {
    total_visits: number;
    last_visit?: string | null;
  };
  visits: SessionResponse[];
  isLoading: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  formatDateTime: (value?: string | null) => string;
  onPageChange: (page: number) => void;
  onViewSession: (sessionId: string) => void;
}

export const VisitHistorySection: React.FC<VisitHistorySectionProps> = ({
  patient,
  visits,
  isLoading,
  error,
  currentPage,
  totalPages,
  formatDateTime,
  onPageChange,
  onViewSession,
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Visit History</Typography>
        <Stack direction="row" spacing={1}>
          <Chip
            label={`Total: ${patient.total_visits}`}
            color="primary"
            variant="outlined"
          />
          {patient.last_visit && (
            <Chip
              label={`Last visit: ${formatDateTime(patient.last_visit)}`}
              variant="outlined"
            />
          )}
        </Stack>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : error ? (
        <Alert severity="error">Failed to load visit history.</Alert>
      ) : visits.length === 0 ? (
        <Alert severity="info">
          No sessions recorded for this patient yet.
        </Alert>
      ) : (
        <Box>
          <VisitsTable
            visits={visits}
            formatDateTime={formatDateTime}
            onViewSession={onViewSession}
          />

          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => onPageChange(page)}
                color="primary"
                size="small"
              />
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};
