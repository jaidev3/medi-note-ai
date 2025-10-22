import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  TextField,
  Grid,
  Alert,
} from "@mui/material";
import { Save, Restore } from "@mui/icons-material";

export const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    allowRegistration: true,
    requireEmailVerification: false,
    enableTwoFactor: false,
    maintenanceMode: false,
    autoBackup: true,
    maxUploadSize: "50",
    sessionTimeout: "30",
    apiRateLimit: "100",
  });

  const [saved, setSaved] = useState(false);

  const handleToggle = (setting: string) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof settings],
    }));
  };

  const handleChange = (setting: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleSave = () => {
    // Mock save - Replace with actual API call
    console.log("Saving settings:", settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    // Reset to default values
    setSettings({
      allowRegistration: true,
      requireEmailVerification: false,
      enableTwoFactor: false,
      maintenanceMode: false,
      autoBackup: true,
      maxUploadSize: "50",
      sessionTimeout: "30",
      apiRateLimit: "100",
    });
  };

  return (
    <Box>
      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {/* Authentication Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Authentication Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.allowRegistration}
                  onChange={() => handleToggle("allowRegistration")}
                />
              }
              label="Allow User Registration"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.requireEmailVerification}
                  onChange={() => handleToggle("requireEmailVerification")}
                />
              }
              label="Require Email Verification"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableTwoFactor}
                  onChange={() => handleToggle("enableTwoFactor")}
                />
              }
              label="Enable Two-Factor Authentication"
            />
          </Box>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            System Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.maintenanceMode}
                  onChange={() => handleToggle("maintenanceMode")}
                />
              }
              label="Maintenance Mode"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoBackup}
                  onChange={() => handleToggle("autoBackup")}
                />
              }
              label="Automatic Backup"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Resource Limits */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Resource Limits
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Max Upload Size (MB)"
                type="number"
                value={settings.maxUploadSize}
                onChange={(e) => handleChange("maxUploadSize", e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Session Timeout (minutes)"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleChange("sessionTimeout", e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="API Rate Limit (requests/min)"
                type="number"
                value={settings.apiRateLimit}
                onChange={(e) => handleChange("apiRateLimit", e.target.value)}
                size="small"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        <Button
          variant="outlined"
          startIcon={<Restore />}
          onClick={handleReset}
        >
          Reset to Defaults
        </Button>
        <Button variant="contained" startIcon={<Save />} onClick={handleSave}>
          Save Settings
        </Button>
      </Box>
    </Box>
  );
};
