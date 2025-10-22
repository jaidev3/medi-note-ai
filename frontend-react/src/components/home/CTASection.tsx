import React from "react";
import { Container, Box, Button, Typography, Stack, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

interface CTASectionProps {
  onSignupClick: () => void;
  onLoginClick: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({
  onSignupClick,
  onLoginClick,
}) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        py: { xs: 10, md: 14 },
        position: "relative",
        overflow: "hidden",
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
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
              color: theme.palette.text.secondary,
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
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: theme.palette.primary.contrastText,
                fontWeight: 700,
                px: 4,
                py: 1.5,
                boxShadow: theme.shadows[2],
                "&:hover": {
                  boxShadow: theme.shadows[4],
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
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                fontWeight: 700,
                borderWidth: 2,
                px: 4,
                py: 1.5,
                "&:hover": {
                  borderColor: theme.palette.primary.dark,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
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
