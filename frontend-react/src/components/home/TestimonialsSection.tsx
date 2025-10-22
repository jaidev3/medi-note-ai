import React from "react";
import {
  Container,
  Box,
  Typography,
  Card,
  Grid,
  Stack,
  Avatar,
  Divider,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

export const TestimonialsSection: React.FC = () => {
  const theme = useTheme();
  const testimonials = [
    {
      name: "Dr. Aisha Reynolds",
      role: "Lead Audiologist, SoundWave Clinic",
      quote:
        "MediNote AI has transformed our clinic's productivity. Notes are ready before patients leave the room.",
    },
    {
      name: "Kevin Liu",
      role: "Clinic Director, Hearing First",
      quote:
        "The accuracy and compliance safeguards give us confidence to scale without sacrificing care quality.",
    },
  ];

  return (
    <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02), py: { xs: 10, md: 14 } }}>
      <Container maxWidth="lg">
        <Box textAlign="center" mb={8}>
          <Typography variant="h3" component="h2" fontWeight={800} gutterBottom>
            Loved by leading hearing care teams
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            maxWidth="720px"
            mx="auto"
            sx={{ fontWeight: 400, lineHeight: 1.6 }}
          >
            Clinics around the world rely on MediNote AI to stay ahead of
            documentation backlogs while delivering exceptional patient
            experiences.
          </Typography>
        </Box>
        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  p: 4,
                  bgcolor: "white",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.06)}`,
                  height: "100%",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.12)}`,
                    transform: "translateY(-4px)",
                    borderColor: alpha(theme.palette.primary.main, 0.15),
                  },
                }}
              >
                <Stack spacing={3}>
                  <Typography
                    variant="body2"
                    color="text.primary"
                    fontStyle="italic"
                    sx={{ fontSize: "1.05rem", lineHeight: 1.6 }}
                  >
                    "{testimonial.quote}"
                  </Typography>
                  <Divider />
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        fontWeight: 700,
                        color: "white",
                        width: 48,
                        height: 48,
                        backgroundColor: theme.palette.primary.main,
                      }}
                    >
                      {testimonial.name
                        .split(" ")
                        .map((value) => value[0])
                        .join("")
                        .slice(0, 2)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
