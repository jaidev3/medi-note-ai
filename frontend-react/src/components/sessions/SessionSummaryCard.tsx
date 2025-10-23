import React from "react";
import { Card, CardContent, Typography, Grid, Stack, Chip } from "@mui/material";

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
    <Card variant="outlined">
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Session Summary
        </Typography>
        <Grid container spacing={2}>
          {metadata.map((item) => (
            <Grid item xs={12} sm={6} key={item.label}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {item.label}
              </Typography>
              <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
                {item.value}
              </Typography>
            </Grid>
          ))}
        </Grid>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Chip
            label={`${documentCount} Documents`}
            color="primary"
            variant="outlined"
            size="small"
          />
          <Chip
            label={`${soapNoteCount} SOAP Notes`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Stack>
      </CardContent>
    </Card>
  );
};
