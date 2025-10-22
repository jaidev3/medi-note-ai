import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Chip,
  Avatar,
  IconButton,
} from "@mui/material";
import {
  Add,
  Event,
  Person,
  Description,
  Folder,
  Delete,
  Visibility,
  Edit,
  ArrowBack,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useListSessions, useDeleteSession } from "../../hooks/useSessionsApi";
import { useListPatients } from "../../hooks/usePatientsApi";
import { AddSessionModal } from "../../components/modals/AddSessionModal";
import { EnhancedCard, EnhancedButton, EnhancedDataTable } from "../../components/ui";
import { EmptyState } from "../../components/EmptyState";

const PAGE_SIZE = 10;

export const EnhancedSessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  useAuth();
  
  const [page, setPage] = useState(1);
  const [patientFilter, setPatientFilter] = useState<string>("");
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [orderBy, setOrderBy] = useState("visit_date");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading, error } = useListSessions(
    page,
    PAGE_SIZE,
    patientFilter || undefined,
    undefined
  );
  const { data: patientsData } = useListPatients(1, 100); // Get patients for filter
  const deleteSessionMutation = useDeleteSession();

  const sessions = data?.sessions || [];
  const totalCount = data?.total_count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const patients = patientsData?.patients || [];
  
  const patientNameMap = useMemo(() => {
    const entries = new Map<string, string>();
    patients.forEach((patient) => entries.set(patient.id, patient.name));
    return entries;
  }, [patients]);

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      try {
        await deleteSessionMutation.mutateAsync(sessionId);
      } catch (err) {
        console.error("Failed to delete session:", err);
      }
    }
  };

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const columns = [
    {
      id: "session_id",
      label: "Session ID",
      minWidth: 120,
      sortable: true,
      mobile: true,
      format: (value: string) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.secondary.main,
              width: 32,
              height: 32,
              fontSize: "0.75rem",
            }}
          >
            {value?.slice(0, 2).toUpperCase()}
          </Avatar>
          <Typography variant="body2" fontWeight={600} fontFamily="monospace">
            {value?.slice(0, 12)}...
          </Typography>
        </Box>
      ),
    },
    {
      id: "patient_id",
      label: "Patient",
      minWidth: 150,
      sortable: true,
      mobile: true,
      format: (value: string) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Person fontSize="small" color="action" />
          <Typography variant="body2">
            {patientNameMap.get(value) || value}
          </Typography>
        </Box>
      ),
    },
    {
      id: "visit_date",
      label: "Visit Date",
      minWidth: 150,
      sortable: true,
      mobile: true,
      format: (value: string) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Event fontSize="small" color="action" />
          <Typography variant="body2">
            {formatDate(value)}
          </Typography>
        </Box>
      ),
    },
    {
      id: "document_count",
      label: "Documents",
      minWidth: 100,
      sortable: true,
      mobile: true,
      align: "center" as const,
      format: (value: number) => (
        <Chip
          icon={<Folder fontSize="small" />}
          label={value}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      id: "soap_note_count",
      label: "SOAP Notes",
      minWidth: 100,
      sortable: true,
      mobile: true,
      align: "center" as const,
      format: (value: number) => (
        <Chip
          icon={<Description fontSize="small" />}
          label={value}
          size="small"
          color="success"
          variant="outlined"
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
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
          flexDirection: { xs: "column", md: "row" },
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
              Patient Visit Sessions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track patient visits and sessions.
            </Typography>
          </Box>
        </Box>
        <EnhancedButton
          startIcon={<Add />}
          onClick={() => setIsAddSessionModalOpen(true)}
          gradient
          sx={{ minWidth: { xs: "100%", md: "auto" } }}
        >
          New Session
        </EnhancedButton>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 4 }}>
        <FormControl size="medium" sx={{ minWidth: { xs: "100%", md: 250 } }}>
          <InputLabel>Filter by Patient</InputLabel>
          <Select
            value={patientFilter}
            onChange={(e) => {
              setPatientFilter(e.target.value);
              setPage(1);
            }}
            label="Filter by Patient"
          >
            <MenuItem value="">All Patients</MenuItem>
            {patients.map((patient) => (
              <MenuItem key={patient.id} value={patient.id}>
                {patient.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          Failed to load sessions: {error.message}
        </Alert>
      ) : sessions.length === 0 ? (
        <EnhancedCard>
          <Box sx={{ textAlign: "center", py: 6 }}>
            <EmptyState
              title={
                patientFilter
                  ? "No sessions found for this patient"
                  : "No sessions yet. Create your first session!"
              }
            />
            <Box sx={{ mt: 3 }}>
              <EnhancedButton
                startIcon={<Add />}
                onClick={() => setIsAddSessionModalOpen(true)}
                gradient
              >
                Create Session
              </EnhancedButton>
            </Box>
          </Box>
        </EnhancedCard>
      ) : (
        <EnhancedCard>
          <EnhancedDataTable
            columns={columns}
            rows={sessions}
            page={page - 1} // Material-UI uses 0-based indexing
            rowsPerPage={PAGE_SIZE}
            totalRows={totalCount}
            onPageChange={(_, newPage) => setPage(newPage + 1)}
            onRowsPerPageChange={(event) => {
              setPage(1);
              // Handle rows per page change if needed
            }}
            onRowClick={(row) => navigate(`/sessions/${row.session_id}`)}
            onDelete={(row) => handleDeleteSession(row.session_id)}
            orderBy={orderBy}
            order={order}
            onRequestSort={handleRequestSort}
            emptyMessage="No sessions found"
          />
        </EnhancedCard>
      )}

      {/* Add Session Modal */}
      <AddSessionModal
        open={isAddSessionModalOpen}
        onClose={() => setIsAddSessionModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </Container>
  );
};

export default EnhancedSessionsPage;