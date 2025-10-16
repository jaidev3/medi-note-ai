import React from "react";
import {
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
} from "@mui/material";

interface Session {
  session_id: string;
  visit_date: string;
}

interface SOAPConfigurationFormProps {
  sessionId: string;
  temperature: number;
  maxLength: number;
  includeContext: boolean;
  enablePiiMasking: boolean;
  preserveMedicalContext: boolean;
  sessions: Session[];
  sessionsLoading: boolean;
  onSessionChange: (sessionId: string) => void;
  onTemperatureChange: (value: number) => void;
  onMaxLengthChange: (value: number) => void;
  onIncludeContextChange: (checked: boolean) => void;
  onEnablePiiMaskingChange: (checked: boolean) => void;
  onPreserveMedicalContextChange: (checked: boolean) => void;
}

export const SOAPConfigurationForm: React.FC<SOAPConfigurationFormProps> = ({
  sessionId,
  temperature,
  maxLength,
  includeContext,
  enablePiiMasking,
  preserveMedicalContext,
  sessions,
  sessionsLoading,
  onSessionChange,
  onTemperatureChange,
  onMaxLengthChange,
  onIncludeContextChange,
  onEnablePiiMaskingChange,
  onPreserveMedicalContextChange,
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
      <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ mb: 2 }}>
        <FormControl fullWidth disabled={sessionsLoading}>
          <InputLabel>Session</InputLabel>
          <Select
            value={sessionId}
            onChange={(e) => onSessionChange(e.target.value as string)}
            label="Session"
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

        <TextField
          type="number"
          label="Temperature"
          value={temperature}
          onChange={(e) => onTemperatureChange(Number(e.target.value) || 0)}
          inputProps={{ min: 0, max: 2, step: 0.05 }}
          fullWidth
        />

        <TextField
          type="number"
          label="Max Length"
          value={maxLength}
          onChange={(e) => onMaxLengthChange(Number(e.target.value) || 0)}
          inputProps={{ min: 500, step: 100 }}
          fullWidth
        />
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <FormControlLabel
          control={
            <Switch
              checked={includeContext}
              onChange={(e) => onIncludeContextChange(e.target.checked)}
            />
          }
          label="Include medical context"
        />
        <FormControlLabel
          control={
            <Switch
              checked={enablePiiMasking}
              onChange={(e) => onEnablePiiMaskingChange(e.target.checked)}
            />
          }
          label="Enable PII masking"
        />
        <FormControlLabel
          control={
            <Switch
              checked={preserveMedicalContext}
              onChange={(e) => onPreserveMedicalContextChange(e.target.checked)}
              disabled={!enablePiiMasking}
            />
          }
          label="Preserve medical terminology"
        />
      </Stack>
    </Paper>
  );
};
