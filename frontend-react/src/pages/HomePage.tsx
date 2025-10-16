import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
// Layout provides the shared Navbar
import {
  Description,
  Search,
  Security,
  Speed,
  TrendingUp,
  IntegrationInstructions,
} from "@mui/icons-material";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

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
    { value: "12x", label: "Faster Documentation" },
    { value: "98%", label: "Accuracy in Transcripts" },
    { value: "24/7", label: "Intelligent Assistance" },
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
      <Box className="bg-gradient-to-br from-blue-50 to-indigo-100" py={{ xs: 10, md: 14 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Chip
                  label="Purpose-built for audiology teams"
                  color="primary"
                  variant="outlined"
                  sx={{ alignSelf: "flex-start", fontWeight: 600 }}
                />
                <Typography variant="h3" component="h1" fontWeight={700}>
                  AI-Powered SOAP Notes for Hearing Care Professionals
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Automate documentation, stay HIPAA compliant, and give every patient more time with intelligent assistance tuned for hearing care.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate("/register")}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate("/login")}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    Sign In
                  </Button>
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: "relative",
                  bgcolor: "background.paper",
                  borderRadius: 6,
                  p: 4,
                  boxShadow: "0 40px 80px rgba(37, 56, 88, 0.18)",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(circle at top left, rgba(59,130,246,0.15), transparent 55%), radial-gradient(circle at bottom right, rgba(99,102,241,0.2), transparent 60%)",
                    zIndex: 0,
                  }}
                />
                <Stack spacing={3} sx={{ position: "relative", zIndex: 1 }}>
                  <Typography variant="subtitle2" color="primary" fontWeight={700}>
                    Live Summary Preview
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    “Patient reports gradual left-ear hearing decline with intermittent tinnitus. No dizziness or pain. Recommended updated audiogram and follow-up in 4 weeks.”
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
                    <Divider flexItem orientation="vertical" sx={{ borderColor: "rgba(37, 56, 88, 0.08)" }} />
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
                    p: 3,
                    textAlign: "center",
                    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <Typography variant="h5" fontWeight={700} color="primary" gutterBottom>
                    {item.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Box textAlign="center" mb={8}>
          <Typography variant="h4" component="h2" fontWeight={700} gutterBottom>
            Powerful Features for Hearing Care Professionals
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth="760px" mx="auto">
            Streamline your workflow with intelligent AI that understands the unique needs of audiology and hearing care.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 4,
                  p: 4,
                  bgcolor: "rgba(241, 245, 255, 0.7)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(99,102,241,0.1)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  '&:hover': {
                    transform: "translateY(-6px)",
                    boxShadow: "0 24px 40px rgba(15, 23, 42, 0.1)",
                  },
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Box mb={3}>{feature.icon}</Box>
                  <Typography variant="subtitle1" component="h3" fontWeight={600} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
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
                Give clinicians and coordinators a shared workspace that makes capturing, reviewing, and publishing notes effortless.
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
                  }}
                >
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="flex-start">
                    <Chip
                      label={item.step}
                      color="primary"
                      sx={{ fontWeight: 700, borderRadius: 2 }}
                    />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
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

      <Box sx={{ bgcolor: "rgba(15,23,42,0.04)", py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography variant="h4" component="h2" fontWeight={700} gutterBottom>
              Loved by leading hearing care teams
            </Typography>
            <Typography variant="body2" color="text.secondary" maxWidth="720px" mx="auto">
              Clinics around the world rely on MediNote AI to stay ahead of documentation backlogs while delivering exceptional patient experiences.
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    p: 4,
                    bgcolor: "white",
                    border: "1px solid rgba(15,23,42,0.06)",
                    boxShadow: "0 20px 45px rgba(15,23,42,0.08)",
                    height: "100%",
                  }}
                >
                  <Stack spacing={3}>
                    <Typography variant="body2" color="text.primary" fontStyle="italic">
                      “{testimonial.quote}”
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        {testimonial.name
                          .split(" ")
                          .map((value) => value[0])
                          .join("")
                          .slice(0, 2)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
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
      <Box className="bg-blue-600" py={{ xs: 8, md: 10 }}>
        <Container maxWidth="md">
          <Box
            textAlign="center"
            sx={{
              bgcolor: "rgba(255,255,255,0.08)",
              borderRadius: 5,
              p: { xs: 5, md: 7 },
              boxShadow: "0 28px 60px rgba(15, 23, 42, 0.18)",
            }}
          >
            <Typography
              variant="h4"
              component="h2"
              fontWeight={700}
              color="white"
              gutterBottom
            >
              Ready to Get Started?
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.85)" }} mb={4}>
              Join the future of hearing care documentation today.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/register")}
                sx={{ bgcolor: "white", color: "primary.main", px: 4, py: 1.5 }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/login")}
                sx={{ borderColor: "rgba(255,255,255,0.6)", color: "white", px: 4, py: 1.5 }}
              >
                Request a Demo
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
