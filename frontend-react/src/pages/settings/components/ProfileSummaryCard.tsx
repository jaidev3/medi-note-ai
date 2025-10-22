import React from "react";
import {
  Box,
  Avatar,
  Typography,
  useTheme,
} from "@mui/material";
import { EnhancedCard } from "@/components/ui";

interface ProfileSummaryCardProps {
  userName: string;
  userEmail: string;
  userRole: string;
}

export const ProfileSummaryCard: React.FC<ProfileSummaryCardProps> = ({
  userName,
  userEmail,
  userRole,
}) => {
  const theme = useTheme();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <EnhancedCard color="primary">
      <Box sx={{ textAlign: "center" }}>
        <Avatar
          sx={{
            width: 80,
            height: 80,
            mx: "auto",
            mb: 2,
            fontSize: "2rem",
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          }}
        >
          {getInitials(userName || userEmail)}
        </Avatar>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {userName || "User Name"}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {userEmail}
        </Typography>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 2,
            py: 1,
            borderRadius: 2,
            background: `${theme.palette.primary.main}10`,
            border: `1px solid ${theme.palette.primary.main}30`,
          }}
        >
          <Typography variant="body2" fontWeight={500}>
            {userRole}
          </Typography>
        </Box>
      </Box>
    </EnhancedCard>
  );
};