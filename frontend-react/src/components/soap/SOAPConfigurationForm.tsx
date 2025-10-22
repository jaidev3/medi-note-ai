import React from "react";
import {
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
}

interface Session {
  session_id: string;
  visit_date: string;
}

interface SOAPConfigurationFormProps {
  patientId: string;
  sessionId: string;
  patients: Patient[];
  sessions: Session[];
  patientsLoading: boolean;
  sessionsLoading: boolean;
  onPatientChange: (patientId: string) => void;
  onSessionChange: (sessionId: string) => void;
}

export const SOAPConfigurationForm: React.FC<SOAPConfigurationFormProps> = ({
  patientId,
  sessionId,
  patients,
  sessions,
  patientsLoading,
  sessionsLoading,
  onPatientChange,
  onSessionChange,
}) => {
  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        border: "1px solid #e8ebf8",
        boxShadow: "0 4px 20px rgba(102, 126, 234, 0.08)",
      }}
    >
      <Stack spacing={3}>
        <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
          <FormControl fullWidth disabled={patientsLoading}>
            <InputLabel>Select Patient</InputLabel>
            <Select
              value={patientId}
              onChange={(e) => onPatientChange(e.target.value as string)}
              label="Select Patient"
            >
              <MenuItem value="">Select patient</MenuItem>
              {patients.map((patient) => (
                <MenuItem key={patient.id} value={patient.id}>
                  {patient.name}
                  {patient.email && ` - ${patient.email}`}
                  {patient.date_of_birth && ` (DOB: ${new Date(patient.date_of_birth).toLocaleDateString()})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={sessionsLoading || !patientId}>
            <InputLabel>Select Session</InputLabel>
            <Select
              value={sessionId}
              onChange={(e) => onSessionChange(e.target.value as string)}
              label="Select Session"
            >
              <MenuItem value="">Select session</MenuItem>
              {sessions.map((session) => (
                <MenuItem key={session.session_id} value={session.session_id}>
                  Session {session.session_id.slice(0, 8)} -{" "}
                  {new Date(session.visit_date).toLocaleDateString()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>
    </Paper>
  );
};
