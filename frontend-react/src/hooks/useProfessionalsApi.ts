import { useQuery } from "@tanstack/react-query";
import { professionalsApi } from "@/lib";

// List professionals query
export const useListProfessionals = (
  page: number = 1,
  pageSize: number = 100
) => {
  return useQuery({
    queryKey: ["professionals", page, pageSize],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return professionalsApi.listProfessionals(token, page, pageSize);
    },
    enabled: !!localStorage.getItem("access_token"),
  });
};

// Get professional query
export const useGetProfessional = (id: string) => {
  return useQuery({
    queryKey: ["professional", id],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return professionalsApi.getProfessional(id, token);
    },
    enabled: !!localStorage.getItem("access_token") && !!id,
  });
};
