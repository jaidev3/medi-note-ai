import { useMutation } from "@tanstack/react-query";
import { ragApi, RAGQueryRequest, EmbeddingGenerateRequest } from "@/lib";

// Query knowledge base mutation
export const useQueryKnowledgeBase = () => {
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: (data: RAGQueryRequest) =>
      ragApi.queryKnowledgeBase(data, token!),
  });
};

// Generate embeddings mutation
export const useGenerateEmbeddings = () => {
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: (data: EmbeddingGenerateRequest) =>
      ragApi.generateEmbeddings(data, token!),
  });
};
