import React, { useEffect } from "react";
import {
  Container,
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Avatar,
  Divider,
  Chip,
} from "@mui/material";
import {
  Description,
  Search,
  Security,
  Speed,
  TrendingUp,
  IntegrationInstructions,
  Bolt,
  AutoAwesome,
  AccessTime,
} from "@mui/icons-material";
import { useAuthModals } from "@/contexts/AuthModalsContext";

export const HomePage: React.FC = () => {
  const { openLoginModal, openSignupModal } = useAuthModals();

  useEffect(() => {
    const timer = setInterval(() => {
      const viewers = document.querySelectorAll("spline-viewer");
      viewers.forEach((viewer) => {
        if (viewer.shadowRoot) {
          const logo = viewer.shadowRoot.querySelector("#logo");
          if (logo) {
            logo.remove();
            clearInterval(timer);
          }
        }
      });
    }, 400);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <Description className="text-blue-600" fontSize="large" />,
      title: "AI-Powered SOAP Notes",
      description:
        "Automatically generate comprehensive SOAP notes from patient conversations with industry-specific terminology recognition.",
    },
    {
      icon: <Search className="text-green-600" fontSize="large" />,
      title: "Smart Querying",
      description:
        "Ask natural language questions about patient records and get instant, accurate answers from your documentation.",
    },
    {
      icon: <Security className="text-purple-600" fontSize="large" />,
      title: "HIPAA Compliant",
      description:
        "Built with enterprise-grade security and full HIPAA compliance to protect sensitive patient information.",
    },
    {
      icon: <Speed className="text-orange-600" fontSize="large" />,
      title: "Real-time Processing",
      description:
        "Process conversation transcripts in real-time and generate SOAP notes with minimal delay.",
    },
    {
      icon: <TrendingUp className="text-red-600" fontSize="large" />,
      title: "Analytics & Insights",
      description:
        "Track documentation efficiency and gain insights into patient care patterns over time.",
    },
    {
      icon: (
        <IntegrationInstructions className="text-indigo-600" fontSize="large" />
      ),
      title: "EHR Integration",
      description:
        "Seamlessly integrate with existing Electronic Health Record systems for smooth workflow integration.",
    },
  ];

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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
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
                    onClick={openSignupModal}
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
                    onClick={openLoginModal}
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
                    “Patient reports gradual left-ear hearing decline with
                    intermittent tinnitus. No dizziness or pain. Recommended
                    updated audiogram and follow-up in 4 weeks.”
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
          <Grid container spacing={4} mt={{ xs: 6, md: 10 }}>
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

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 10, md: 14 } }}>
        <Box textAlign="center" mb={10}>
          <Typography variant="h3" component="h2" fontWeight={800} gutterBottom>
            Powerful Features
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            maxWidth="720px"
            mx="auto"
            sx={{ fontWeight: 400, lineHeight: 1.6 }}
          >
            Streamline your workflow with intelligent AI that understands the
            unique needs of audiology and hearing care.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  p: 4,
                  bgcolor: "#f8f9ff",
                  border: "1px solid #e0e7ff",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 16px 32px rgba(102, 126, 234, 0.18)",
                    borderColor: "#818cf8",
                  },
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Box
                    mb={3}
                    sx={{
                      display: "inline-flex",
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: "rgba(102, 126, 234, 0.1)",
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    component="h3"
                    fontWeight={700}
                    gutterBottom
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

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

      <Box sx={{ bgcolor: "#f8f9ff", py: { xs: 10, md: 14 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Typography
              variant="h3"
              component="h2"
              fontWeight={800}
              gutterBottom
            >
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
                    border: "1px solid #e8ebf8",
                    boxShadow: "0 4px 20px rgba(102, 126, 234, 0.08)",
                    height: "100%",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: "0 12px 40px rgba(102, 126, 234, 0.15)",
                      transform: "translateY(-4px)",
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
                          backgroundColor: "#4f46e5",
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

      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 10, md: 14 },
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#eef2ff",
        }}
      >
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <Box textAlign="center">
            <Typography
              variant="h3"
              component="h2"
              fontWeight={800}
              color="primary"
              gutterBottom
            >
              Ready to Transform Your Documentation?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "#4b5563",
                fontWeight: 400,
                mb: 4,
                lineHeight: 1.6,
              }}
            >
              Join the future of hearing care documentation today.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                variant="contained"
                size="large"
                onClick={openSignupModal}
                sx={{
                  bgcolor: "#4f46e5",
                  color: "white",
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  "&:hover": {
                    backgroundColor: "#4338ca",
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Get Started Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={openLoginModal}
                sx={{
                  borderColor: "#4338ca",
                  color: "#4338ca",
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
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
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box bgcolor="grey.900" color="white" py={4}>
        <Container maxWidth="lg">
          <Box textAlign="center">
            <Typography variant="body2" color="grey.400">
              © 2025 MediNote AI. All rights reserved. | HIPAA Compliant | SOC 2
              Type II Certified
            </Typography>
          </Box>
        </Container>
      </Box>
    </div>
  );
};
