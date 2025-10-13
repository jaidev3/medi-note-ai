import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  CardActionArea,
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
      <CardActionArea
        onClick={onClick}
        sx={{
          display: "flex",
          alignItems: "stretch",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
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
        <CardActions sx={{ width: "100%", justifyContent: "flex-end" }}>
          <Button size="small" component="span">
            {cta}
          </Button>
        </CardActions>
      </CardActionArea>
    </Card>
  );
};

export default QuickActionCard;
