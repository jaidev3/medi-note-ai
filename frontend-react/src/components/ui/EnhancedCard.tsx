import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Typography,
  Box,
  Chip,
  Avatar,
  useTheme,
} from "@mui/material";
import { TrendingUp, TrendingDown, TrendingFlat } from "@mui/icons-material";

interface EnhancedCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  avatar?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  chip?: {
    label: string;
    color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  };
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info" | "default";
  elevation?: number;
  hover?: boolean;
  onClick?: () => void;
  className?: string;
}

const EnhancedCard: React.FC<EnhancedCardProps> = ({
  title,
  subtitle,
  children,
  actions,
  avatar,
  icon,
  trend,
  chip,
  color = "primary",
  elevation = 1,
  hover = true,
  onClick,
  className,
}) => {
  const theme = useTheme();

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp fontSize="small" />;
    if (value < 0) return <TrendingDown fontSize="small" />;
    return <TrendingFlat fontSize="small" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return theme.palette.success.main;
    if (value < 0) return theme.palette.error.main;
    return theme.palette.text.secondary;
  };

  const getColorGradient = (colorType: string) => {
    switch (colorType) {
      case "primary":
        return {
          bg: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          shadow: `${theme.palette.primary.main}40`,
          border: theme.palette.primary.main,
        };
      case "secondary":
        return {
          bg: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
          shadow: `${theme.palette.secondary.main}40`,
          border: theme.palette.secondary.main,
        };
      case "success":
        return {
          bg: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
          shadow: `${theme.palette.success.main}40`,
          border: theme.palette.success.main,
        };
      case "warning":
        return {
          bg: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
          shadow: `${theme.palette.warning.main}40`,
          border: theme.palette.warning.main,
        };
      case "error":
        return {
          bg: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
          shadow: `${theme.palette.error.main}40`,
          border: theme.palette.error.main,
        };
      case "info":
        return {
          bg: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
          shadow: `${theme.palette.info.main}40`,
          border: theme.palette.info.main,
        };
      default:
        return {
          bg: `linear-gradient(135deg, ${theme.palette.grey[600]} 0%, ${theme.palette.grey[800]} 100%)`,
          shadow: `${theme.palette.grey[600]}40`,
          border: theme.palette.grey[600],
        };
    }
  };

  return (
    <Card
      elevation={elevation}
      className={className}
      onClick={onClick}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s ease-in-out",
        cursor: onClick ? "pointer" : "default",
        borderRadius: 2,
        border: "1px solid",
        borderColor: theme.palette.grey[200],
        backgroundColor: theme.palette.background.paper,
        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
        ...(hover && {
          "&:hover": {
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            borderColor: theme.palette.grey[300],
          },
        }),
      }}
    >
      {(title || avatar || icon) && (
        <CardHeader
          avatar={
            avatar ? (
              avatar
            ) : icon ? (
              <Avatar
                sx={{
                  bgcolor: `${color}.main`,
                  color: "white",
                  width: 48,
                  height: 48,
                  fontSize: "1.5rem",
                }}
              >
                {icon}
              </Avatar>
            ) : undefined
          }
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography
                variant="h6"
                component="h2"
                fontWeight={600}
                color="text.primary"
              >
                {title}
              </Typography>
              {chip && (
                <Chip
                  label={chip.label}
                  size="small"
                  color={chip.color || "primary"}
                  variant="outlined"
                  sx={{
                    fontWeight: 500,
                    fontSize: "0.75rem",
                  }}
                />
              )}
            </Box>
          }
          subheader={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
              {trend && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      color: getTrendColor(trend.value),
                    }}
                  >
                    {getTrendIcon(trend.value)}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: getTrendColor(trend.value) }}
                  >
                    {Math.abs(trend.value)}%
                  </Typography>
                  {trend.label && (
                    <Typography variant="caption" color="text.secondary">
                      {trend.label}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          }
          sx={{ pb: 1 }}
        />
      )}
      <CardContent
        sx={{
          flexGrow: 1,
          pt: title ? 2 : 3,
          pb: 2,
          px: 3,
          "&:last-child": {
            paddingBottom: 2,
          },
        }}
      >
        {children}
      </CardContent>
      {actions && (
        <CardActions sx={{ pt: 0, px: 3, pb: 2, justifyContent: "flex-end" }}>
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

export default EnhancedCard;