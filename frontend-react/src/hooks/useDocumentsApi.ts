import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  documentsApi,
  Document,
  DocumentUploadRequest,
  DocumentListResponse,
  DocumentContentResponse,
} from "@/lib";

// Upload document mutation with full parameters
export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DocumentUploadRequest) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return documentsApi.uploadDocument(data, token);
    },
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

// List documents for a specific session
export const useSessionDocuments = (
  sessionId: string,
  page: number = 1,
  pageSize: number = 20
) => {
  return useQuery<DocumentListResponse>({
    queryKey: ["sessionDocuments", sessionId, page, pageSize],
    enabled: !!sessionId,
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return documentsApi.listBySession(sessionId, token, page, pageSize);
    },
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

// Fetch document content/extracted text on demand
export const useDocumentContent = () => {
  return useMutation<DocumentContentResponse, Error, string>({
    mutationFn: (id: string) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return documentsApi.getContent(id, token);
    },
  });
};
