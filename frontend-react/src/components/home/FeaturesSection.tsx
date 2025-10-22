import React from "react";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Description,
  Search,
  Security,
  Speed,
  TrendingUp,
  IntegrationInstructions,
} from "@mui/icons-material";

export const FeaturesSection: React.FC = () => {
  const theme = useTheme();
  const features = [
    {
      icon: <Description sx={{ color: theme.palette.primary.main }} fontSize="large" />,
      title: "AI-Powered SOAP Notes",
      description:
        "Automatically generate comprehensive SOAP notes from patient conversations with industry-specific terminology recognition.",
    },
    {
      icon: <Search sx={{ color: theme.palette.success.main }} fontSize="large" />,
      title: "Smart Querying",
      description:
        "Ask natural language questions about patient records and get instant, accurate answers from your documentation.",
    },
    {
      icon: <Security sx={{ color: theme.palette.secondary.main }} fontSize="large" />,
      title: "HIPAA Compliant",
      description:
        "Built with enterprise-grade security and full HIPAA compliance to protect sensitive patient information.",
    },
    {
      icon: <Speed sx={{ color: theme.palette.warning.main }} fontSize="large" />,
      title: "Real-time Processing",
      description:
        "Process conversation transcripts in real-time and generate SOAP notes with minimal delay.",
    },
    {
      icon: <TrendingUp sx={{ color: theme.palette.error.main }} fontSize="large" />,
      title: "Analytics & Insights",
      description:
        "Track documentation efficiency and gain insights into patient care patterns over time.",
    },
    {
      icon: (
        <IntegrationInstructions sx={{ color: theme.palette.info.main }} fontSize="large" />
      ),
      title: "EHR Integration",
      description:
        "Seamlessly integrate with existing Electronic Health Record systems for smooth workflow integration.",
    },
  ];

  return (
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
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-6px)",
                  boxShadow: `0 16px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
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
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
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
  );
};
