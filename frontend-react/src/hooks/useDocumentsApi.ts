import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  documentsApi,
  Document,
  DocumentUploadRequest,
  DocumentListResponse,
  DocumentContentResponse,
  DocumentMetadata,
  DocumentProcessRequest,
  DocumentProcessResponse,
  DocumentPiiStatusResponse,
  DocumentDeleteOptions,
  DocumentDeleteResponse,
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

export const useDocumentMetadata = (id: string) => {
  return useQuery<DocumentMetadata>({
    queryKey: ["documentMetadata", id],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return documentsApi.getMetadata(id, token);
    },
    enabled: !!id && !!localStorage.getItem("access_token"),
  });
};

export const useDocumentPiiStatus = (id: string) => {
  return useQuery<DocumentPiiStatusResponse>({
    queryKey: ["documentPiiStatus", id],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return documentsApi.getPiiStatus(id, token);
    },
    enabled: !!id && !!localStorage.getItem("access_token"),
    refetchInterval: 10_000,
  });
};

// Delete document mutation
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation<
    DocumentDeleteResponse,
    Error,
    { id: string; options?: DocumentDeleteOptions }
  >({
    mutationFn: ({
      id,
      options,
    }: {
      id: string;
      options?: DocumentDeleteOptions;
    }) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return documentsApi.delete(id, options, token);
    },
    onSuccess: (_result: DocumentDeleteResponse) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["sessionDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["documentMetadata"] });
    },
  });
};

export const useProcessDocument = () => {
  const queryClient = useQueryClient();

  return useMutation<
    DocumentProcessResponse,
    Error,
    { id: string; data?: DocumentProcessRequest }
  >({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data?: DocumentProcessRequest;
    }) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return documentsApi.processDocument(
        {
          document_id: id,
          ...data,
        },
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentMetadata"] });
      queryClient.invalidateQueries({ queryKey: ["documentPiiStatus"] });
      queryClient.invalidateQueries({ queryKey: ["sessionDocuments"] });
    },
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
