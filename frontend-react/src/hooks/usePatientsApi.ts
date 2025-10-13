import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  patientsApi,
  PatientCreateRequest,
  PatientListResponse,
  PatientResponse,
  PatientUpdateRequest,
  SessionListResponse,
} from "@/lib";

// List patients query
export const useListPatients = (
  page: number = 1,
  pageSize: number = 20,
  search?: string
) => {
  return useQuery<PatientListResponse>({
    queryKey: ["patients", page, pageSize, search],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return patientsApi.listPatients(token, page, pageSize, search);
    },
    enabled: !!localStorage.getItem("access_token"),
  });
};

// Get patient query
export const useGetPatient = (id: string) => {
  return useQuery<PatientResponse>({
    queryKey: ["patient", id],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return patientsApi.getPatient(id, token);
    },
    enabled: !!localStorage.getItem("access_token") && !!id,
  });
};

// Get patient visits query
export const useGetPatientVisits = (
  id: string,
  page: number = 1,
  pageSize: number = 50
) => {
  return useQuery<SessionListResponse>({
    queryKey: ["patientVisits", id, page, pageSize],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return patientsApi.getPatientVisits(id, token, page, pageSize);
    },
    enabled: !!localStorage.getItem("access_token") && !!id,
  });
};

// Create patient mutation
export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PatientCreateRequest) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return patientsApi.createPatient(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
};

// Update patient mutation
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PatientUpdateRequest }) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return patientsApi.updatePatient(id, data, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient", variables.id] });
    },
  });
};

// Delete patient mutation
export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return patientsApi.deletePatient(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
};
