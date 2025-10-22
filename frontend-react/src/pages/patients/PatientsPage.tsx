import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  useTheme,
  useMediaQuery,
  Grid,
  Chip,
  Avatar,
  IconButton,
} from "@mui/material";
import {
  Add,
  Search,
  Person,
  Email,
  Phone,
  CalendarToday,
  Visibility,
  Edit,
  Delete,
  ArrowBack,
} from "@mui/icons-material";
import { useListPatients } from "../../hooks/usePatientsApi";
import { AddPatientModal } from "../../components/modals/AddPatientModal";
import { EnhancedCard, EnhancedButton, EnhancedDataTable } from "../../components/ui";
import { EmptyState } from "../../components/EmptyState";

const PAGE_SIZE = 10;

export const EnhancedPatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [orderBy, setOrderBy] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

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

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const formatLastVisit = (date: string) => {
    if (!date) return "Not recorded";
    return new Date(date).toLocaleDateString();
  };

  const columns = [
    {
      id: "name",
      label: "Name",
      minWidth: 150,
      sortable: true,
      mobile: true,
      format: (value: string) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 40,
              height: 40,
            }}
          >
            {value?.charAt(0)?.toUpperCase() || <Person />}
          </Avatar>
          <Typography variant="body2" fontWeight={600}>
            {value || "Unnamed"}
          </Typography>
        </Box>
      ),
    },
    {
      id: "email",
      label: "Email",
      minWidth: 200,
      sortable: true,
      mobile: true,
      format: (value: string) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Email fontSize="small" color="action" />
          <Typography variant="body2">
            {value || "—"}
          </Typography>
        </Box>
      ),
    },
    {
      id: "phone",
      label: "Phone",
      minWidth: 150,
      sortable: true,
      mobile: true,
      format: (value: string) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Phone fontSize="small" color="action" />
          <Typography variant="body2">
            {value || "—"}
          </Typography>
        </Box>
      ),
    },
    {
      id: "last_visit",
      label: "Last Visit",
      minWidth: 120,
      sortable: true,
      mobile: true,
      format: (value: string) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarToday fontSize="small" color="action" />
          {value ? (
            <Chip
              label={new Date(value).toLocaleDateString()}
              size="small"
              variant="outlined"
              color="primary"
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              Not recorded
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: "total_visits",
      label: "Total Visits",
      minWidth: 100,
      sortable: true,
      mobile: true,
      format: (value: number) => (
        <Chip
          label={value}
          size="small"
          color="secondary"
          variant="filled"
        />
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          gap: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexGrow: 1 }}>
          <IconButton onClick={() => navigate("/dashboard")}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography
              variant="h3"
              component="h1"
              fontWeight={700}
              gutterBottom
              sx={{ fontSize: { xs: "2rem", md: "2.5rem" } }}
            >
              Patient Records
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Search, review, and update your patient roster.
            </Typography>
          </Box>
        </Box>
        <EnhancedButton
          startIcon={<Add />}
          onClick={() => setIsAddPatientModalOpen(true)}
          gradient
          sx={{ minWidth: { xs: "100%", md: "auto" } }}
        >
          Add Patient
        </EnhancedButton>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          size="medium"
          placeholder="Search by name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          variant="outlined"
          InputProps={{
            startAdornment: <Search sx={{ mr: 2, color: "action.active" }} />,
          }}
          sx={{
            maxWidth: { xs: "100%", md: 400 },
          }}
        />
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          action={
            <EnhancedButton
              color="inherit"
              size="small"
              onClick={handleRetry}
            >
              Retry
            </EnhancedButton>
          }
          sx={{ mb: 4 }}
        >
          Failed to load patients. {error.message}
        </Alert>
      ) : patients.length === 0 ? (
        <EnhancedCard>
          <Box sx={{ textAlign: "center", py: 6 }}>
            <EmptyState
              title={debouncedSearch ? "No patients match your search" : "No patients yet"}
              description={
                debouncedSearch
                  ? "Try adjusting your search keywords."
                  : "Create your first patient to start managing visits."
              }
            />
            <Box sx={{ mt: 3 }}>
              <EnhancedButton
                startIcon={<Add />}
                onClick={() => setIsAddPatientModalOpen(true)}
                gradient
              >
                Add Patient
              </EnhancedButton>
            </Box>
          </Box>
        </EnhancedCard>
      ) : (
        <EnhancedCard>
          <EnhancedDataTable
            columns={columns}
            rows={patients}
            page={page - 1} // Material-UI uses 0-based indexing
            rowsPerPage={PAGE_SIZE}
            totalRows={totalCount}
            onPageChange={(_, newPage) => setPage(newPage + 1)}
            onRowsPerPageChange={(event) => {
              setPage(1);
              // Handle rows per page change if needed
            }}
            onRowClick={(row) => navigate(`/patients/${row.id}`)}
            orderBy={orderBy}
            order={order}
            onRequestSort={handleRequestSort}
            emptyMessage="No patients found"
          />
        </EnhancedCard>
      )}

      {/* Add Patient Modal */}
      <AddPatientModal
        open={isAddPatientModalOpen}
        onClose={() => setIsAddPatientModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </Container>
  );
};

export default EnhancedPatientsPage;