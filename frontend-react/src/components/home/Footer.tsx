import React from "react";
import { Container, Box, Typography } from "@mui/material";

export const Footer: React.FC = () => {
  return (
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
  );
};
