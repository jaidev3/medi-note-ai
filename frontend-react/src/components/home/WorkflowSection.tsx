import React from "react";
import {
  Container,
  Box,
  Typography,
  Card,
  Grid,
  Stack,
  Chip,
} from "@mui/material";

export const WorkflowSection: React.FC = () => {
  const workflow = [
    {
      step: "Capture",
      title: "Record the consultation",
      description:
        "Upload transcripts or connect Scribe integrations to capture every patient interaction effortlessly.",
    },
    {
      step: "Analyze",
      title: "AI processing in seconds",
      description:
        "Our models understand the nuances of audiology to structure SOAP notes with precise clinical language.",
    },
    {
      step: "Document",
      title: "Publish to your EHR",
      description:
        "Review, edit, and sync finalized notes directly to your existing EHR workflows without disruption.",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 10 } }}>
      <Grid container spacing={6} alignItems="center">
        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="primary" fontWeight={600}>
              Seamless Workflow
            </Typography>
            <Typography variant="h4" component="h2" fontWeight={700}>
              Designed for every step of patient documentation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Give clinicians and coordinators a shared workspace that makes
              capturing, reviewing, and publishing notes effortless.
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            {workflow.map((item, index) => (
              <Card
                key={index}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  p: 3,
                  border: "1px solid rgba(15,23,42,0.08)",
                  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
                  transition: "transform 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    borderColor: "rgba(102,126,234,0.6)",
                  },
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={3}
                  alignItems="flex-start"
                >
                  <Chip
                    label={item.step}
                    color="primary"
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                  />
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      gutterBottom
                    >
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};
