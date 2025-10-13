import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsApi, Document, DocumentUploadRequest } from "@/lib";

// Upload document mutation with full parameters
export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: (data: DocumentUploadRequest) =>
      documentsApi.uploadDocument(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
};

// Simple upload mutation (for backward compatibility)
export const useSimpleUpload = () => {
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
