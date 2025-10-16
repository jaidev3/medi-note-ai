import React from "react";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Description,
  Search,
  Security,
  Speed,
  TrendingUp,
  IntegrationInstructions,
} from "@mui/icons-material";

export const FeaturesSection: React.FC = () => {
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
  );
};
