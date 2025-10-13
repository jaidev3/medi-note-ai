import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, SessionCreateRequest, SessionUpdateRequest } from "@/lib";

// List sessions query
export const useListSessions = (
  page: number = 1,
  pageSize: number = 20,
  patientId?: string,
  professionalId?: string
) => {
  return useQuery({
    queryKey: ["sessions", page, pageSize, patientId, professionalId],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return sessionsApi.listSessions(
        token,
        page,
        pageSize,
        patientId,
        professionalId
      );
    },
    enabled: !!localStorage.getItem("access_token"),
  });
};

// Get session query
export const useGetSession = (id: string) => {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return sessionsApi.getSession(id, token);
    },
    enabled: !!localStorage.getItem("access_token") && !!id,
  });
};

// Create session mutation
export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SessionCreateRequest) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return sessionsApi.createSession(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
};

// Update session mutation
export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SessionUpdateRequest }) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return sessionsApi.updateSession(id, data, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session", variables.id] });
    },
  });
};

// Delete session mutation
export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return sessionsApi.deleteSession(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
};
