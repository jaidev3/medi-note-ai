import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  TextField,
  Pagination,
  Chip,
  Stack,
} from "@mui/material";
import { ArrowBack, Add, Search } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useListPatients } from "@/hooks/usePatientsApi";

const PAGE_SIZE = 20;

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading, error, refetch } = useListPatients(
    page,
    PAGE_SIZE,
    debouncedSearch
  );

  // Debounce search
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim() ? search.trim() : "");
      setPage(1); // Reset to first page on search
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const patients = useMemo(() => data?.patients ?? [], [data?.patients]);
  const totalCount = data?.total_count ?? 0;
  const totalPages = useMemo(
    () => (totalCount === 0 ? 1 : Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount]
  );

  const handleRetry = () => {
    refetch();
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
            Patients
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          gap={2}
          mb={3}
        >
          <Box>
            <Typography variant="h5" component="h1">
              Patient Records
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search, review, and update your patient roster.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              size="small"
              placeholder="Search by name or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: "action.active" }} />
                ),
              }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/patients/new")}
            >
              Add Patient
            </Button>
          </Stack>
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            }
          >
            Failed to load patients. {error.message}
          </Alert>
        ) : patients.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: "center" }}>
            <Stack spacing={2} alignItems="center">
              <Typography variant="h6">
                {debouncedSearch
                  ? "No patients match your search"
                  : "No patients yet"}
              </Typography>
              <Typography color="text.secondary">
                {debouncedSearch
                  ? "Try adjusting your search keywords."
                  : "Create your first patient to start managing visits."}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate("/patients/new")}
              >
                Add Patient
              </Button>
            </Stack>
          </Paper>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Last Visit</TableCell>
                    <TableCell>Total Visits</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow
                      key={patient.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <TableCell>{patient.name || "Unnamed"}</TableCell>
                      <TableCell>{patient.email || "—"}</TableCell>
                      <TableCell>{patient.phone || "—"}</TableCell>
                      <TableCell>
                        {patient.last_visit ? (
                          <Chip
                            label={new Date(
                              patient.last_visit
                            ).toLocaleDateString()}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          "Not recorded"
                        )}
                      </TableCell>
                      <TableCell>{patient.total_visits}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </div>
  );
};
