import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, ApiError } from '@/lib/api-config'

// Types
export interface RAGChunk {
  chunk_id: string
  content: string
  metadata: Record<string, any>
  similarity_score: number
  rerank_score?: number
  patient_id?: string
  session_id?: string
  note_id?: string
  visit_date?: string
}

export interface RAGQueryRequest {
  query: string
  patient_id?: string
  session_id?: string
  professional_id?: string
  start_date?: string
  end_date?: string
  top_k?: number
  rerank_top_n?: number
  similarity_threshold?: number
  include_sources?: boolean
  max_response_length?: number
}

export interface RAGQueryResponse {
  success: boolean
  answer: string
  retrieved_chunks: RAGChunk[]
  sources: string[]
  confidence: number
  total_chunks_found: number
  processing_time: number
  embedding_time: number
  retrieval_time: number
  rerank_time: number
  generation_time: number
  message: string
  warnings: string[]
}

export interface EmbeddingRequest {
  note_id: string
  force_reembed?: boolean
}

export interface EmbeddingResponse {
  success: boolean
  embedded_count: number
  skipped_count: number
  failed_count: number
  processing_time: number
  embedded_notes: string[]
  failed_notes: Record<string, any>[]
  message: string
}

export interface BatchEmbeddingRequest {
  note_ids: string[]
  session_id?: string
  patient_id?: string
  force_reembed?: boolean
  batch_size?: number
  max_parallel?: number
}

export interface BatchEmbeddingResponse {
  success: boolean
  embedded_count: number
  skipped_count: number
  failed_count: number
  processing_time: number
  embedded_notes: string[]
  failed_notes: Record<string, any>[]
  message: string
}

export interface SimilaritySearchRequest {
  query_text: string
  patient_id?: string
  session_id?: string
  top_k?: number
  similarity_threshold?: number
}

export interface SimilaritySearchResponse {
  success: boolean
  similar_notes: RAGChunk[]
  query_text: string
  total_compared: number
  processing_time: number
  message: string
}

// API Functions
export const ragApi = {
  async queryKnowledgeBase(
    queryData: RAGQueryRequest,
    token: string
  ): Promise<RAGQueryResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RAG.QUERY}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(queryData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to query knowledge base', response.status)
    }

    return response.json()
  },

  async embedSOAPNote(
    embeddingData: EmbeddingRequest,
    token: string
  ): Promise<EmbeddingResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RAG.EMBED}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(embeddingData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to embed SOAP note', response.status)
    }

    return response.json()
  },

  async batchEmbedSOAPNotes(
    batchData: BatchEmbeddingRequest,
    token: string
  ): Promise<BatchEmbeddingResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RAG.BATCH_EMBED}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(batchData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to batch embed SOAP notes', response.status)
    }

    return response.json()
  },

  async findSimilarNotes(
    noteId: string,
    token: string,
    topK = 5
  ): Promise<SimilaritySearchResponse> {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.RAG.SIMILAR(noteId)}`)
    url.searchParams.set('top_k', topK.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to find similar notes', response.status)
    }

    return response.json()
  },

  async searchByTextSimilarity(
    searchData: SimilaritySearchRequest,
    token: string
  ): Promise<SimilaritySearchResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RAG.SEARCH_SIMILARITY}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(searchData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to search by text similarity', response.status)
    }

    return response.json()
  },

  async getEmbeddingStats(token: string, patientId?: string): Promise<any> {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.RAG.STATS}`)
    if (patientId) {
      url.searchParams.set('patient_id', patientId)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to get embedding stats', response.status)
    }

    return response.json()
  },
}
