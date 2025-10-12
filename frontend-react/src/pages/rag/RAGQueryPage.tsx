import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Paper,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { ArrowBack, Search } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";

export const RAGQueryPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a query");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setResults([
        "Result 1: Patient John Doe had a hearing test on 2025-01-15...",
        "Result 2: Patient Jane Smith reported tinnitus symptoms...",
        "Result 3: Follow-up appointment scheduled for...",
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2 }}>
            Query Documents
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Search Patient Documents
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box display="flex" gap={2} sx={{ mt: 3 }}>
            <TextField
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about patient records..."
              variant="outlined"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Search />}
            >
              Search
            </Button>
          </Box>

          {results.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Search Results
              </Typography>
              <List>
                {results.map((result, index) => (
                  <ListItem key={index} divider>
                    <ListItemText primary={result} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      </Container>
    </div>
  );
};
