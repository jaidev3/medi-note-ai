import React from "react";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  chipLabel?: string;
  color?: "primary" | "secondary" | "success" | "warning" | "info" | "error";
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  chipLabel,
  color = "primary",
}) => {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1.5}
        >
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          {icon && (
            <Box
              sx={{
                bgcolor: `${color}.light`,
                color: `${color}.contrastText`,
                borderRadius: 2,
                p: 0.75,
                display: "inline-flex",
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {value}
        </Typography>
        {chipLabel && (
          <Chip
            size="small"
            label={chipLabel}
            color={color}
            variant="outlined"
          />
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
