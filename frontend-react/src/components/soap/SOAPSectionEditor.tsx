import React from "react";
import { Box, Typography, TextField, Stack, Chip } from "@mui/material";

interface SOAPSection {
  content: string;
  confidence?: number;
  word_count?: number;
}

type SOAPSectionKey = "subjective" | "objective" | "assessment" | "plan";

interface SOAPSectionEditorProps {
  sectionKey: SOAPSectionKey;
  label: string;
  section: SOAPSection;
  onSectionChange: (key: SOAPSectionKey, value: string) => void;
}

export const SOAPSectionEditor: React.FC<SOAPSectionEditorProps> = ({
  sectionKey,
  label,
  section,
  onSectionChange,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" fontWeight="bold">
        {label}
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={5}
        value={section?.content || ""}
        onChange={(e) => onSectionChange(sectionKey, e.target.value)}
        sx={{ mt: 1 }}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        {typeof section?.confidence === "number" && (
          <Chip
            label={`Confidence: ${(section.confidence * 100).toFixed(1)}%`}
            size="small"
          />
        )}
        {typeof section?.word_count === "number" && (
          <Chip label={`Words: ${section.word_count}`} size="small" />
        )}
      </Stack>
    </Box>
  );
};
