import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
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
import { Add, Search } from "@mui/icons-material";
// Layout provides the shared Navbar
import { useListPatients } from "@/hooks/usePatientsApi";
import { AddPatientModal } from "@/components/modals/AddPatientModal";

const PAGE_SIZE = 20;

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);

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
    <div className="min-h-screen" style={{ backgroundColor: "#f5f7fb" }}>
      <Container maxWidth="lg" sx={{ mt: 5, mb: 4 }}>
        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          gap={3}
          mb={4}
        >
          <Box>
            <Typography variant="h4" component="h1" fontWeight={800}>
              Patient Records
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Search, review, and update your patient roster.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              size="small"
              placeholder="Search by name or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: "white",
                  "&:hover fieldset": { borderColor: "#667eea" },
                },
              }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: "#667eea" }} />,
              }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setIsAddPatientModalOpen(true)}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                fontWeight: 700,
                textTransform: "none",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 24px rgba(102, 126, 234, 0.4)",
                },
                transition: "all 0.3s ease",
              }}
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
          <Paper
            sx={{
              p: 5,
              textAlign: "center",
              borderRadius: 3,
              border: "1px solid #e8ebf8",
              backgroundColor: "white",
            }}
          >
            <Stack spacing={2} alignItems="center">
              <Typography variant="h6" fontWeight={700}>
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
                onClick={() => setIsAddPatientModalOpen(true)}
                sx={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  fontWeight: 700,
                  textTransform: "none",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 24px rgba(102, 126, 234, 0.4)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Add Patient
              </Button>
            </Stack>
          </Paper>
        ) : (
          <>
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 3,
                border: "1px solid #e8ebf8",
                boxShadow: "0 4px 20px rgba(102, 126, 234, 0.08)",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f8f9ff" }}>
                    <TableCell sx={{ fontWeight: 700, color: "#667eea" }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#667eea" }}>
                      Email
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#667eea" }}>
                      Phone
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#667eea" }}>
                      Last Visit
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#667eea" }}>
                      Total Visits
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow
                      key={patient.id}
                      hover
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "rgba(102, 126, 234, 0.04)",
                        },
                        transition: "background-color 0.2s ease",
                      }}
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>
                        {patient.name || "Unnamed"}
                      </TableCell>
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
                            sx={{
                              borderColor: "#667eea",
                              color: "#667eea",
                            }}
                          />
                        ) : (
                          "Not recorded"
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {patient.total_visits}
                      </TableCell>
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

      <AddPatientModal
        open={isAddPatientModalOpen}
        onClose={() => setIsAddPatientModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
