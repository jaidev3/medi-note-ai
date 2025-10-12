import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsApi, Document } from "@/lib";

// Upload document mutation
export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => documentsApi.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};

// List documents query
export const useDocuments = () => {
  return useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: () => documentsApi.list(),
  });
};

// Get single document query
export const useDocument = (id: string) => {
  return useQuery<Document>({
    queryKey: ["documents", id],
    queryFn: () => documentsApi.get(id),
    enabled: !!id,
  });
};

// Delete document mutation
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};

// Download document mutation
export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: (id: string) => documentsApi.download(id),
  });
};
