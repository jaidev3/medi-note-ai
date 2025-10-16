import React from "react";
import { Container, Box, Typography, Grid, Stack } from "@mui/material";
import { Bolt, AutoAwesome, AccessTime } from "@mui/icons-material";

export const StatsSection: React.FC = () => {
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
    <Box sx={{ backgroundColor: "#f8f9ff", pb: { xs: 8, md: 10 } }}>
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
                  border: "1px solid #e0e7ff",
                  boxShadow: "0 18px 32px rgba(148, 163, 184, 0.18)",
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  {item.icon}
                  <Box>
                    <Typography variant="h5" fontWeight={700} color="primary">
                      {item.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#4b5563" }}>
                      {item.label}
                    </Typography>
                  </Box>
                </Stack>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 2,
                    color: "#6b7280",
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
