import React from "react";
import { Box, Typography } from "@mui/material";
import Logo from "@/components/Logo";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle }) => {
  return (
    <Box textAlign="center" mb={4}>
      <Box
        display="flex"
        justifyContent="center"
        mb={2}
        sx={{
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: "50%",
          width: 80,
          height: 80,
          mx: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Logo width={64} height={64} aria-hidden={false} />
      </Box>
      <Typography
        variant="h4"
        component="h1"
        fontWeight={800}
        gutterBottom
        sx={{ color: "white" }}
      >
        {title}
      </Typography>
      <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.9)" }}>
        {subtitle}
      </Typography>
    </Box>
  );
};
