import React from "react";
import { Paper, Typography, Grid, Divider, Stack, Chip } from "@mui/material";

interface SessionSummaryCardProps {
  metadata: Array<{ label: string; value: string }>;
  documentCount: number;
  soapNoteCount: number;
}

export const SessionSummaryCard: React.FC<SessionSummaryCardProps> = ({
  metadata,
  documentCount,
  soapNoteCount,
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Session Summary
      </Typography>
      <Grid container spacing={2}>
        {metadata.map((item) => (
          <Grid item xs={12} sm={6} key={item.label}>
            <Typography variant="body2" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
              {item.value}
            </Typography>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Stack direction="row" spacing={2}>
        <Chip
          label={`Documents: ${documentCount}`}
          color="primary"
          variant="outlined"
        />
        <Chip
          label={`SOAP Notes: ${soapNoteCount}`}
          color="primary"
          variant="outlined"
        />
      </Stack>
    </Paper>
  );
};
