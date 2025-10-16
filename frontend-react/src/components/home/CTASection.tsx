import React from "react";
import { Container, Box, Button, Typography, Stack } from "@mui/material";

interface CTASectionProps {
  onSignupClick: () => void;
  onLoginClick: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({
  onSignupClick,
  onLoginClick,
}) => {
  return (
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
              onClick={onSignupClick}
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
              onClick={onLoginClick}
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
  );
};
