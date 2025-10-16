import React from "react";
import {
  Container,
  Box,
  Button,
  Typography,
  Grid,
  Stack,
  Chip,
  Divider,
} from "@mui/material";

interface HeroSectionProps {
  onSignupClick: () => void;
  onLoginClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSignupClick,
  onLoginClick,
}) => {
  return (
    <Box
      sx={{
        py: { xs: 12, md: 16 },
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#f8f9ff",
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack spacing={4}>
              <Chip
                label="✨ Purpose-built for audiology teams"
                sx={{
                  alignSelf: "flex-start",
                  fontWeight: 600,
                  backgroundColor: "#e0e7ff",
                  color: "#4338ca",
                  border: "none",
                }}
              />
              <Typography
                variant="h2"
                component="h1"
                fontWeight={800}
                sx={{ color: "#1f2937", lineHeight: 1.2 }}
              >
                AI-Powered SOAP Notes for Hearing Care
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "#4b5563", fontWeight: 400, lineHeight: 1.6 }}
              >
                Automate documentation, stay HIPAA compliant, and give every
                patient more time with intelligent assistance tuned for
                hearing care.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={onSignupClick}
                  sx={{
                    px: 4,
                    py: 1.5,
                    backgroundColor: "#4f46e5",
                    color: "white",
                    fontWeight: 700,
                    "&:hover": {
                      backgroundColor: "#4338ca",
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={onLoginClick}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderColor: "#4338ca",
                    color: "#4338ca",
                    fontWeight: 700,
                    "&:hover": {
                      borderColor: "#312e81",
                      backgroundColor: "rgba(79,70,229,0.08)",
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  Sign In
                </Button>
              </Stack>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                flexWrap="wrap"
              >
                {[
                  "HIPAA & SOC 2",
                  "End-to-end encryption",
                  "Audit-ready logs",
                ].map((badge) => (
                  <Chip
                    key={badge}
                    label={badge}
                    sx={{
                      bgcolor: "white",
                      color: "#4338ca",
                      border: "1px solid #c7d2fe",
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                position: "relative",
                bgcolor: "background.paper",
                borderRadius: 6,
                p: { xs: 3.5, md: 4 },
                boxShadow: "0 24px 50px rgba(79, 70, 229, 0.15)",
                overflow: "hidden",
              }}
            >
              <Stack spacing={3}>
                <Typography
                  variant="subtitle2"
                  color="primary"
                  fontWeight={700}
                >
                  Live Summary Preview
                </Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                  "Patient reports gradual left-ear hearing decline with
                  intermittent tinnitus. No dizziness or pain. Recommended
                  updated audiogram and follow-up in 4 weeks."
                </Typography>
                <Divider sx={{ borderColor: "rgba(37, 56, 88, 0.08)" }} />
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      4m 12s
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average note turn-around
                    </Typography>
                  </Box>
                  <Divider
                    flexItem
                    orientation="vertical"
                    sx={{ borderColor: "rgba(37, 56, 88, 0.08)" }}
                  />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      HIPAA & SOC 2
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Always-on compliance guardrails
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
