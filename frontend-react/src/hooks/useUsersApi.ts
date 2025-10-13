import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, ProfessionalUpdateRequest } from "@/lib";

// Get user stats query
export const useGetUserStats = () => {
  const token = localStorage.getItem("access_token");

  return useQuery({
    queryKey: ["userStats"],
    queryFn: () => usersApi.getUserStats(token!),
    enabled: !!token,
  });
};

// Update professional mutation
export const useUpdateProfessional = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ProfessionalUpdateRequest;
    }) => usersApi.updateProfessional(id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// Get user query
export const useGetUser = (id: string) => {
  const token = localStorage.getItem("access_token");

  return useQuery({
    queryKey: ["user", id],
    queryFn: () => usersApi.getUser(id, token!),
    enabled: !!token && !!id,
  });
};

// List users query
export const useListUsers = () => {
  const token = localStorage.getItem("access_token");

  return useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.listUsers(token!),
    enabled: !!token,
  });
};

// Delete user mutation
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
