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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Box className="bg-gradient-to-br from-blue-50 to-indigo-100" py={12}>
        <Container maxWidth="lg">
          <Box textAlign="center" py={8}>
            <Typography
              variant="h2"
              component="h1"
              fontWeight="bold"
              gutterBottom
            >
              AI-Powered SOAP Notes for
            </Typography>
            <Typography
              variant="h2"
              component="h1"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
              Hearing Care Professionals
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              mb={4}
              maxWidth="800px"
              mx="auto"
            >
              Streamline your documentation workflow with intelligent AI that
              understands the unique needs of audiology and hearing care
            </Typography>
            <Box display="flex" gap={2} justifyContent="center" mt={4}>
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
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" mb={6}>
          <Typography
            variant="h3"
            component="h2"
            fontWeight="bold"
            gutterBottom
          >
            Powerful Features for Hearing Care Professionals
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            maxWidth="800px"
            mx="auto"
          >
            Streamline your workflow with intelligent AI that understands the
            unique needs of audiology and hearing care
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card elevation={2} sx={{ height: "100%", p: 2 }}>
                <CardContent>
                  <Box mb={2}>{feature.icon}</Box>
                  <Typography
                    variant="h6"
                    component="h3"
                    fontWeight="600"
                    gutterBottom
                  >
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

      {/* CTA Section */}
      <Box className="bg-blue-600" py={8}>
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography
              variant="h3"
              component="h2"
              fontWeight="bold"
              color="white"
              gutterBottom
            >
              Ready to Get Started?
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "rgba(255,255,255,0.9)" }}
              mb={4}
            >
              Join the future of hearing care documentation today
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/register")}
              sx={{ bgcolor: "white", color: "primary.main", px: 4, py: 1.5 }}
            >
              Get Started
            </Button>
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
