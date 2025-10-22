import React from "react";
import { Box, Button, Typography, Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { PersonAdd } from "@mui/icons-material";

interface RegisterFormActionsProps {
  isLoading: boolean;
}

export const RegisterFormActions: React.FC<RegisterFormActionsProps> = ({
  isLoading,
}) => {
  return (
    <>
      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={isLoading}
        startIcon={<PersonAdd />}
        sx={{
          py: 1.5,
          fontWeight: 700,
          textTransform: "none",
          fontSize: "1rem",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 12px 24px rgba(102, 126, 234, 0.4)",
          },
          transition: "all 0.3s ease",
        }}
      >
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>

      <Box textAlign="center">
        <Typography variant="body2" color="text.secondary">
          Already have an account?{" "}
          <Link component={RouterLink} to="/login" underline="hover">
            Sign in
          </Link>
        </Typography>
      </Box>
    </>
  );
};
