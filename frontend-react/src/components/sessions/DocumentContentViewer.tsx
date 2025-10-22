import React from "react";
import { Box, Typography, Button } from "@mui/material";

interface DocumentContentViewerProps {
  content: string;
  onClose: () => void;
}

export const DocumentContentViewer: React.FC<DocumentContentViewerProps> = ({
  content,
  onClose,
}) => {
  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        bgcolor: "background.paper",
        borderRadius: 1,
      }}
    >
      <Typography variant="subtitle2">Document Text</Typography>
      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
        {content}
      </Typography>
      <Box sx={{ mt: 1 }}>
        <Button size="small" onClick={onClose}>
          Close
        </Button>
      </Box>
    </Box>
  );
};
