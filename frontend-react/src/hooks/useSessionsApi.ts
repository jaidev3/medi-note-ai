import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, SessionCreateRequest, SessionUpdateRequest } from "@/lib";

// List sessions query
export const useListSessions = (
  page: number = 1,
  pageSize: number = 20,
  patientId?: string,
  professionalId?: string
) => {
  const token = localStorage.getItem("access_token");

  return useQuery({
    queryKey: ["sessions", page, pageSize, patientId, professionalId],
    queryFn: () =>
      sessionsApi.listSessions(
        token!,
        page,
        pageSize,
        patientId,
        professionalId
      ),
    enabled: !!token,
  });
};

// Get session query
export const useGetSession = (id: string) => {
  const token = localStorage.getItem("access_token");

  return useQuery({
    queryKey: ["session", id],
    queryFn: () => sessionsApi.getSession(id, token!),
    enabled: !!token && !!id,
  });
};

// Create session mutation
export const useCreateSession = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: (data: SessionCreateRequest) =>
      sessionsApi.createSession(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
};

// Update session mutation
export const useUpdateSession = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SessionUpdateRequest }) =>
      sessionsApi.updateSession(id, data, token!),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session", variables.id] });
    },
  });
};

// Delete session mutation
export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: (id: string) => sessionsApi.deleteSession(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
};
