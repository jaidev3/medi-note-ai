import React, { forwardRef } from "react";
import {
  Button,
  ButtonProps,
  CircularProgress,
  Box,
  useTheme,
} from "@mui/material";

interface EnhancedButtonProps extends Omit<ButtonProps, "startIcon" | "endIcon"> {
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  variant?: "text" | "outlined" | "contained";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  animation?: boolean;
  gradient?: boolean;
}

const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      children,
      loading = false,
      startIcon,
      endIcon,
      variant = "contained",
      size = "medium",
      fullWidth = false,
      animation = true,
      gradient = false,
      disabled,
      sx,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();

    const getVariantStyles = () => {
      if (gradient) {
        return {
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: "#ffffff",
          "&:hover": {
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
          },
          "&:disabled": {
            background: theme.palette.action.disabled,
            color: theme.palette.action.disabled,
          },
        };
      }
      return {};
    };

    const buttonContent = (
      <>
        {loading && (
          <CircularProgress
            size={size === "small" ? 16 : size === "large" ? 24 : 20}
            color="inherit"
            sx={{ mr: 1 }}
          />
        )}
        {!loading && startIcon && <Box sx={{ mr: 1 }}>{startIcon}</Box>}
        {children}
        {!loading && endIcon && <Box sx={{ ml: 1 }}>{endIcon}</Box>}
      </>
    );

    const buttonSx = {
      ...getVariantStyles(),
      fontWeight: 600,
      textTransform: "none" as const,
      borderRadius: theme.shape.borderRadius,
      transition: "all 0.2s ease-in-out",
      position: "relative" as const,
      overflow: "hidden",
      "&:active": {
        transform: "scale(0.98)",
      },
      "&.Mui-disabled": {
        opacity: 0.6,
      },
      ...sx,
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled || loading}
        sx={buttonSx}
        {...props}
      >
        {buttonContent}
      </Button>
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";

export default EnhancedButton;