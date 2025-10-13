import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, ProfessionalUpdateRequest } from "@/lib";

// Get user stats query
export const useGetUserStats = () => {
  return useQuery({
    queryKey: ["userStats"],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return usersApi.getUserStats(token);
    },
    enabled: !!localStorage.getItem("access_token"),
  });
};

// Update professional mutation
export const useUpdateProfessional = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ProfessionalUpdateRequest;
    }) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return usersApi.updateProfessional(id, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// Get user query
export const useGetUser = (id: string) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return usersApi.getUser(id, token);
    },
    enabled: !!localStorage.getItem("access_token") && !!id,
  });
};

// List users query
export const useListUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return usersApi.listUsers(token);
    },
    enabled: !!localStorage.getItem("access_token"),
  });
};

// Delete user mutation
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return usersApi.deleteUser(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
