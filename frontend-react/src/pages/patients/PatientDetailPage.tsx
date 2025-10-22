import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Box, CircularProgress, Alert, Stack } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetPatient,
  useGetPatientVisits,
  useUpdatePatient,
  useDeletePatient,
} from "@/hooks/usePatientsApi";
import { SessionResponse } from "@/lib";
import {
  PatientInfoForm,
  PatientOverview,
  VisitHistorySection,
} from "@/components/patients";

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not available";
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

export const PatientDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  useAuth();

  const {
    data: patient,
    isLoading: patientLoading,
    error: patientError,
  } = useGetPatient(patientId ?? "");
  const updatePatientMutation = useUpdatePatient();
  const deletePatientMutation = useDeletePatient();

  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [visitsPage, setVisitsPage] = useState(1);

  const {
    data: visitsData,
    isLoading: visitsLoading,
    error: visitsError,
  } = useGetPatientVisits(patientId ?? "", visitsPage, 10);

  useEffect(() => {
    setVisitsPage(1);
  }, [patientId]);

  useEffect(() => {
    if (patient) {
      setFormState({
        name: patient.name ?? "",
        email: patient.email ?? "",
        phone: patient.phone ?? "",
        address: patient.address ?? "",
      });
      setIsDirty(false);
    }
  }, [patient]);

  const visits = useMemo<SessionResponse[]>(
    () => visitsData?.sessions ?? [],
    [visitsData]
  );
  const visitTotalPages = useMemo(() => {
    if (!visitsData?.total_count) return 1;
    return Math.max(
      1,
      Math.ceil(visitsData.total_count / (visitsData.page_size || 10))
    );
  }, [visitsData]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
    setIsDirty(true);
    setFeedback(null);
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patientId) return;

    try {
      const payload = {
        name: formState.name.trim() || undefined,
        email: formState.email.trim() || undefined,
        phone: formState.phone.trim() || undefined,
        address: formState.address.trim() || undefined,
      };

      await updatePatientMutation.mutateAsync({ id: patientId, data: payload });
      setFeedback({ type: "success", message: "Patient details updated." });
      setIsDirty(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update patient.";
      setFeedback({ type: "error", message });
    }
  };

  const handleDelete = async () => {
    if (!patientId) return;
    const confirmed = window.confirm(
      "Delete this patient and all associated sessions? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await deletePatientMutation.mutateAsync(patientId);
      navigate("/patients");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete patient.";
      setFeedback({ type: "error", message });
    }
  };

  const handleViewSession = (sessionId: string) => {
    navigate(`/sessions/${sessionId}`);
  };

  return (
    <div>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {patientLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : patientError ? (
          <Alert severity="error">Failed to load patient details.</Alert>
        ) : !patient ? (
          <Alert severity="warning">Patient not found.</Alert>
        ) : (
          <Stack spacing={3}>
            {feedback && (
              <Alert severity={feedback.type}>{feedback.message}</Alert>
            )}

            <PatientInfoForm
              formState={formState}
              isDirty={isDirty}
              isUpdating={updatePatientMutation.isPending}
              isDeleting={deletePatientMutation.isPending}
              onInputChange={handleChange}
              onSubmit={handleUpdate}
              onDelete={handleDelete}
            />

            <PatientOverview
              patient={patient}
              formatDateTime={formatDateTime}
            />

            <VisitHistorySection
              patient={patient}
              visits={visits}
              isLoading={visitsLoading}
              error={visitsError}
              currentPage={visitsPage}
              totalPages={visitTotalPages}
              formatDateTime={formatDateTime}
              onPageChange={setVisitsPage}
              onViewSession={handleViewSession}
            />
          </Stack>
        )}
      </Container>
    </div>
  );
};
