import { useMutation } from "@tanstack/react-query";
import {
  ragApi,
  RAGQueryRequest,
  RAGEmbeddingRequest,
  RAGBatchEmbeddingRequest,
  RAGSimilaritySearchRequest,
  RAGEmbeddingStatsResponse,
  RAGNotesNeedingEmbeddingRequest,
  RAGNoteNeedingEmbedding,
  RAGEmbeddingResponse,
  RAGSimilaritySearchResponse,
} from "@/lib";

// Query knowledge base mutation
export const useQueryKnowledgeBase = () => {
  return useMutation({
    mutationFn: (data: RAGQueryRequest) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return ragApi.queryKnowledgeBase(data, token);
    },
  });
};

// Generate embeddings mutation
export const useGenerateEmbeddings = () => {
  return useMutation<RAGEmbeddingResponse, Error, RAGEmbeddingRequest>({
    mutationFn: (data: RAGEmbeddingRequest) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return ragApi.embedSOAPNote(data, token);
    },
  });
};

export const useBatchEmbedSOAPNotes = () => {
  return useMutation<RAGEmbeddingResponse, Error, RAGBatchEmbeddingRequest>({
    mutationFn: (data: RAGBatchEmbeddingRequest) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return ragApi.batchEmbedSOAPNotes(data, token);
    },
  });
};

export const useFindSimilarNotes = () => {
  return useMutation<
    RAGSimilaritySearchResponse,
    Error,
    { noteId: string; topK?: number }
  >({
    mutationFn: ({ noteId, topK = 5 }: { noteId: string; topK?: number }) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return ragApi.findSimilarNotes(noteId, token, topK);
    },
  });
};

export const useSearchRAGBySimilarity = () => {
  return useMutation<
    RAGSimilaritySearchResponse,
    Error,
    RAGSimilaritySearchRequest
  >({
    mutationFn: (data: RAGSimilaritySearchRequest) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return ragApi.searchBySimilarity(data, token);
    },
  });
};

export const useRagEmbeddingStats = () => {
  return useMutation<RAGEmbeddingStatsResponse, Error, { patientId?: string }>({
    mutationFn: (params = {}) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return ragApi.getEmbeddingStats(token, params.patientId);
    },
  });
};

export const useNotesNeedingEmbedding = () => {
  return useMutation<
    RAGNoteNeedingEmbedding[],
    Error,
    RAGNotesNeedingEmbeddingRequest
  >({
    mutationFn: (params: RAGNotesNeedingEmbeddingRequest) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return ragApi.getNotesNeedingEmbedding(token, params);
    },
  });
};

export const useEmbedApprovedNotes = () => {
  return useMutation<
    RAGEmbeddingResponse,
    Error,
    RAGNotesNeedingEmbeddingRequest & { force_reembed?: boolean }
  >({
    mutationFn: (
      params: RAGNotesNeedingEmbeddingRequest & { force_reembed?: boolean }
    ) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return ragApi.embedApprovedNotes(params, token);
    },
  });
};
