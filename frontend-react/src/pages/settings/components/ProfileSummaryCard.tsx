import React from "react";
import {
  Box,
  Avatar,
  Typography,
  useTheme,
  Chip,
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
            width: 64,
            height: 64,
            mx: "auto",
            mb: 2,
            fontSize: "1.5rem",
            fontWeight: 600,
            bgcolor: theme.palette.primary.main,
            color: "white",
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
        <Chip
          label={userRole}
          color="primary"
          variant="outlined"
          size="small"
          sx={{ fontWeight: 500 }}
        />
      </Box>
    </EnhancedCard>
  );
};