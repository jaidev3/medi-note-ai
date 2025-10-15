import React from "react";
import { Button, Chip } from "@mui/material";
import { AdminPanelSettings } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface AdminAccessButtonProps {
  variant?: "button" | "chip";
}

export const AdminAccessButton: React.FC<AdminAccessButtonProps> = ({
  variant = "button",
}) => {
  const navigate = useNavigate();

  if (variant === "chip") {
    return (
      <Chip
        icon={<AdminPanelSettings />}
        label="Admin"
        color="error"
        onClick={() => navigate("/admin")}
        sx={{ cursor: "pointer" }}
      />
    );
  }

  return (
    <Button
      variant="outlined"
      color="error"
      startIcon={<AdminPanelSettings />}
      onClick={() => navigate("/admin")}
      size="small"
    >
      Admin
    </Button>
  );
};
