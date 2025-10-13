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
  confidence: number;
  processing_time: number;
}

export interface RAGEmbeddingRequest {
  note_id: string;
  force_reembed?: boolean;
}

export interface RAGEmbeddingResponse {
  success: boolean;
  message: string;
  embedded_count: number;
  skipped_count: number;
  failed_count: number;
  embedded_notes?: string[];
  failed_notes?: Array<Record<string, any>>;
  processing_time: number;
}

export interface RAGBatchEmbeddingRequest {
  note_ids?: string[];
  session_ids?: string[];
  patient_ids?: string[];
  session_id?: string;
  patient_id?: string;
  force_reembed?: boolean;
  batch_size?: number;
  max_parallel?: number;
}

export interface RAGSimilaritySearchRequest {
  query_text: string;
  patient_id?: string;
  session_id?: string;
  top_k?: number;
  similarity_threshold?: number;
}

export interface RAGSimilaritySearchResponse {
  success: boolean;
  similar_notes: RAGChunk[];
  query_text: string;
  total_compared: number;
  processing_time: number;
  message: string;
}

export interface RAGEmbeddingStatsResponse {
  total_notes: number;
  embedded_notes: number;
  notes_pending_embedding: number;
  patients_tracked?: number;
  sessions_tracked?: number;
  last_embedding_run?: string;
  [key: string]: unknown;
}

export interface RAGNotesNeedingEmbeddingRequest {
  note_ids?: string[];
  session_id?: string;
  patient_id?: string;
}

export interface RAGNoteNeedingEmbedding {
  note_id: string;
  session_id?: string;
  patient_id?: string;
  created_at?: string;
  user_approved?: boolean;
  ai_approved?: boolean;
  embedding_status?: string;
  [key: string]: unknown;
}

export interface RAGNotesNeedingEmbeddingResponse
  extends Array<RAGNoteNeedingEmbedding> {}

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

  async embedSOAPNote(
    data: RAGEmbeddingRequest,
    token: string
  ): Promise<RAGEmbeddingResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RAG.EMBED}`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });

    return handleApiResponse<RAGEmbeddingResponse>(response);
  },

  async batchEmbedSOAPNotes(
    data: RAGBatchEmbeddingRequest,
    token: string
  ): Promise<RAGEmbeddingResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.RAG.BATCH_EMBED}`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );

    return handleApiResponse<RAGEmbeddingResponse>(response);
  },

  async findSimilarNotes(
    noteId: string,
    token: string,
    topK: number = 5
  ): Promise<RAGSimilaritySearchResponse> {
    const params = new URLSearchParams({ top_k: topK.toString() });

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.RAG.SIMILAR_NOTES(
        noteId
      )}?${params.toString()}`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    return handleApiResponse<RAGSimilaritySearchResponse>(response);
  },

  async searchBySimilarity(
    data: RAGSimilaritySearchRequest,
    token: string
  ): Promise<RAGSimilaritySearchResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.RAG.SEARCH_SIMILARITY}`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );

    return handleApiResponse<RAGSimilaritySearchResponse>(response);
  },

  async getEmbeddingStats(
    token: string,
    patientId?: string
  ): Promise<RAGEmbeddingStatsResponse> {
    const params = new URLSearchParams();
    if (patientId) {
      params.set("patient_id", patientId);
    }

    const query = params.toString();

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.RAG.STATS}${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    return handleApiResponse<RAGEmbeddingStatsResponse>(response);
  },

  async getNotesNeedingEmbedding(
    token: string,
    params: RAGNotesNeedingEmbeddingRequest = {}
  ): Promise<RAGNotesNeedingEmbeddingResponse> {
    const searchParams = new URLSearchParams();
    if (params.note_ids?.length) {
      params.note_ids.forEach((noteId) =>
        searchParams.append("note_ids", noteId)
      );
    }
    if (params.session_id) {
      searchParams.set("session_id", params.session_id);
    }
    if (params.patient_id) {
      searchParams.set("patient_id", params.patient_id);
    }

    const query = searchParams.toString();

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.RAG.NOTES_NEEDING_EMBEDDING}${
        query ? `?${query}` : ""
      }`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    return handleApiResponse<RAGNotesNeedingEmbeddingResponse>(response);
  },

  async embedApprovedNotes(
    data: RAGNotesNeedingEmbeddingRequest & { force_reembed?: boolean },
    token: string
  ): Promise<RAGEmbeddingResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.RAG.EMBED_APPROVED_NOTES}`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );

    return handleApiResponse<RAGEmbeddingResponse>(response);
  },
};
