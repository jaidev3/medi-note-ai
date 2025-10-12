import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, LoginRequest, RegisterRequest } from "@/lib";

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
};

// Register mutation
export const useRegister = () => {
  return useMutation({
    mutationFn: (userData: RegisterRequest) => authApi.register(userData),
  });
};

// Get current user query
export const useCurrentUser = (token?: string) => {
  return useQuery({
    queryKey: ["currentUser", token],
    queryFn: () => authApi.getCurrentUser(token!),
    enabled: !!token,
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => authApi.logout(token),
    onSuccess: () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      queryClient.clear();
    },
  });
};

// Refresh token mutation
export const useRefreshToken = () => {
  return useMutation({
    mutationFn: (refreshToken: string) => authApi.refreshToken(refreshToken),
    onSuccess: (data) => {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
    },
  });
};
