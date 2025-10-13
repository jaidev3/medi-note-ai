import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
} from "@mui/material";

interface QuickActionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  cta?: string;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  onClick,
  cta = "Open",
}) => {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {icon && (
          <Box color="primary.main" mb={2}>
            {icon}
          </Box>
        )}
        <Typography variant="h6" component="h3" gutterBottom>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </CardContent>
      <CardActions>
        <Button size="small" onClick={onClick}>
          {cta}
        </Button>
      </CardActions>
    </Card>
  );
};

export default QuickActionCard;
