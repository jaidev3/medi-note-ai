import {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthHeaders,
  handleApiResponse,
} from "./api-config";

export interface RAGChunk {
  chunk_id: string;
  content: string;
  similarity_score: number;
  source_type: string;
  source_id: string;
  metadata?: Record<string, any>;
}

export interface RAGQueryRequest {
  query: string;
  patient_id?: string;
  session_id?: string;
  start_date?: string;
  end_date?: string;
  similarity_threshold?: number;
  top_k?: number;
  rerank_top_n?: number;
  include_sources?: boolean;
}

export interface RAGQueryResponse {
  success: boolean;
  message: string;
  answer: string;
  retrieved_chunks: RAGChunk[];
  total_chunks_found: number;
  confidence: string;
  processing_time: number;
}

export interface EmbeddingGenerateRequest {
  text: string;
  session_id?: string;
  document_id?: string;
}

export interface EmbeddingGenerateResponse {
  success: boolean;
  message: string;
  chunks_created: number;
  processing_time: number;
}

export const ragApi = {
  async queryKnowledgeBase(
    data: RAGQueryRequest,
    token: string
  ): Promise<RAGQueryResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RAG.QUERY}`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });

    return handleApiResponse<RAGQueryResponse>(response);
  },

  async generateEmbeddings(
    data: EmbeddingGenerateRequest,
    token: string
  ): Promise<EmbeddingGenerateResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RAG.EMBED}`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });

    return handleApiResponse<EmbeddingGenerateResponse>(response);
  },
};
