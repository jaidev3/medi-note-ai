import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";

interface AdminStatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";
  subtitle?: string;
}

export const AdminStatsCard: React.FC<AdminStatsCardProps> = ({
  title,
  value,
  icon,
  color = "primary",
  subtitle,
}) => {
  return (
    <Card
      sx={{
        height: "100%",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: `${color}.lighter`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" component="div" fontWeight="bold" gutterBottom>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
