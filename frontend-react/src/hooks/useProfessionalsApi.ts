import { useQuery } from "@tanstack/react-query";
import { professionalsApi } from "@/lib";

// List professionals query
export const useListProfessionals = (
  page: number = 1,
  pageSize: number = 100
) => {
  const token = localStorage.getItem("access_token");

  return useQuery({
    queryKey: ["professionals", page, pageSize],
    queryFn: () => professionalsApi.listProfessionals(token!, page, pageSize),
    enabled: !!token,
  });
};

// Get professional query
export const useGetProfessional = (id: string) => {
  const token = localStorage.getItem("access_token");

  return useQuery({
    queryKey: ["professional", id],
    queryFn: () => professionalsApi.getProfessional(id, token!),
    enabled: !!token && !!id,
  });
};
