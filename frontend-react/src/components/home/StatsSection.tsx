import React from "react";
import { Container, Box, Typography, Grid, Stack, useTheme } from "@mui/material";
import { Bolt, AutoAwesome, AccessTime } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

export const StatsSection: React.FC = () => {
  const theme = useTheme();
  const stats = [
    {
      value: "12x",
      label: "Faster Documentation",
      description: "Complete SOAP notes in minutes instead of hours.",
      icon: <Bolt color="primary" fontSize="large" />,
    },
    {
      value: "98%",
      label: "Accuracy in Transcripts",
      description: "Clinical terminology tuned for audiology workflows.",
      icon: <AutoAwesome color="primary" fontSize="large" />,
    },
    {
      value: "24/7",
      label: "Intelligent Assistance",
      description: "Always-available co-pilot for every patient visit.",
      icon: <AccessTime color="primary" fontSize="large" />,
    },
  ];

  return (
    <Box sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.02), pb: { xs: 8, md: 10 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {stats.map((item, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Box
                sx={{
                  bgcolor: "white",
                  borderRadius: 4,
                  p: 3.5,
                  textAlign: "left",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  boxShadow: `0 18px 32px ${alpha(theme.palette.primary.main, 0.08)}`,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  {item.icon}
                  <Box>
                    <Typography variant="h5" fontWeight={700} color="primary">
                      {item.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      {item.label}
                    </Typography>
                  </Box>
                </Stack>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 2,
                    color: theme.palette.text.secondary,
                  }}
                >
                  {item.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
