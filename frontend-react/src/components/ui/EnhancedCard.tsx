import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Typography,
  Box,
  IconButton,
  Chip,
  Avatar,
  useTheme,
} from "@mui/material";
import { MoreVert, TrendingUp, TrendingDown, TrendingFlat } from "@mui/icons-material";

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
        ...(hover && {
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: theme.shadows[4],
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
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                }}
              >
                {icon}
              </Avatar>
            ) : undefined
          }
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" component="h2" fontWeight={600}>
                {title}
              </Typography>
              {chip && (
                <Chip
                  label={chip.label}
                  size="small"
                  color={chip.color || "primary"}
                  variant="outlined"
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
          action={
            <IconButton size="small" onClick={(e) => e.stopPropagation()}>
              <MoreVert />
            </IconButton>
          }
          sx={{ pb: 1 }}
        />
      )}
      <CardContent sx={{ flexGrow: 1, pt: title ? 0 : 2 }}>
        {children}
      </CardContent>
      {actions && (
        <CardActions sx={{ pt: 0, justifyContent: "flex-end" }}>
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

export default EnhancedCard;