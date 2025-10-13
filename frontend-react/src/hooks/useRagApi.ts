import { useMutation } from "@tanstack/react-query";
import { ragApi, RAGQueryRequest, EmbeddingGenerateRequest } from "@/lib";

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
  return useMutation({
    mutationFn: (data: EmbeddingGenerateRequest) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return ragApi.generateEmbeddings(data, token);
    },
  });
};
