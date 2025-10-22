import React from "react";
import { Paper, Typography, Grid } from "@mui/material";

interface PatientOverviewProps {
  patient: {
    id: string;
    total_visits: number;
    last_visit?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  formatDateTime: (value?: string | null) => string;
}

export const PatientOverview: React.FC<PatientOverviewProps> = ({
  patient,
  formatDateTime,
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Overview
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Patient ID
          </Typography>
          <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
            {patient.id}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Total Visits
          </Typography>
          <Typography variant="body1">{patient.total_visits}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Last Visit
          </Typography>
          <Typography variant="body1">
            {formatDateTime(patient.last_visit)}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Created
          </Typography>
          <Typography variant="body1">
            {formatDateTime(patient.created_at)}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Updated
          </Typography>
          <Typography variant="body1">
            {formatDateTime(patient.updated_at)}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};
