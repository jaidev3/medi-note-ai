import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { patientsApi, PatientCreateRequest, PatientUpdateRequest } from "@/lib";

// List patients query
export const useListPatients = (
  page: number = 1,
  pageSize: number = 20,
  search?: string
) => {
  const token = localStorage.getItem("access_token");

  return useQuery({
    queryKey: ["patients", page, pageSize, search],
    queryFn: () => patientsApi.listPatients(token!, page, pageSize, search),
    enabled: !!token,
  });
};

// Get patient query
export const useGetPatient = (id: string) => {
  const token = localStorage.getItem("access_token");

  return useQuery({
    queryKey: ["patient", id],
    queryFn: () => patientsApi.getPatient(id, token!),
    enabled: !!token && !!id,
  });
};

// Get patient visits query
export const useGetPatientVisits = (
  id: string,
  page: number = 1,
  pageSize: number = 50
) => {
  const token = localStorage.getItem("access_token");

  return useQuery({
    queryKey: ["patientVisits", id, page, pageSize],
    queryFn: () => patientsApi.getPatientVisits(id, token!, page, pageSize),
    enabled: !!token && !!id,
  });
};

// Create patient mutation
export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: (data: PatientCreateRequest) =>
      patientsApi.createPatient(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
};

// Update patient mutation
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PatientUpdateRequest }) =>
      patientsApi.updatePatient(id, data, token!),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient", variables.id] });
    },
  });
};

// Delete patient mutation
export const useDeletePatient = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: (id: string) => patientsApi.deletePatient(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
};
