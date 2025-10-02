import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, ApiError } from '@/lib/api-config'

// Types
export interface DocumentUploadRequest {
  session_id: string
  file: File
  description?: string
  upload_source?: string
  extract_text?: boolean
  generate_soap?: boolean
}

export interface DocumentProcessRequest {
  document_id: string
  extract_text?: boolean
  generate_soap?: boolean
  ocr_enabled?: boolean
  language?: string
}

export interface DocumentUploadResponse {
  success: boolean
  document_id?: string
  document_name: string
  file_size: number
  file_type: string
  s3_url?: string
  text_extracted: boolean
  extracted_text?: string
  word_count: number
  soap_note_id?: string
  soap_generated: boolean
  processing_time: number
  upload_time: number
  message: string
  warnings: string[]
}

export interface DocumentProcessResponse {
  success: boolean
  document_id: string
  extracted_text?: string
  page_count: number
  word_count: number
  soap_note_id?: string
  soap_generated: boolean
  soap_approved: boolean
  processing_time: number
  extraction_time: number
  soap_generation_time: number
  message: string
  warnings: string[]
}

export interface DocumentMetadataResponse {
  document_id: string
  session_id: string
  document_name: string
  file_size: number
  file_type: string
  s3_upload_link: string
  upload_status: string
  processed: boolean
  text_extracted: boolean
  soap_generated: boolean
  created_at: string
  updated_at: string
  processed_at?: string
}

export interface DocumentListResponse {
  documents: DocumentMetadataResponse[]
  total_count: number
  page: number
  page_size: number
  session_id?: string
}

export interface DocumentDeleteResponse {
  success: boolean
  document_id: string
  s3_deleted: boolean
  message: string
}

export interface DocumentContentResponse {
  document_id: string
  content: string
  content_type: string
  extracted: boolean
  message: string
}

// API Functions
export const documentsApi = {
  async uploadDocument(uploadData: DocumentUploadRequest, token: string): Promise<DocumentUploadResponse> {
    const formData = new FormData()
    formData.append('session_id', uploadData.session_id)
    formData.append('file', uploadData.file)
    formData.append('description', uploadData.description || '')
    formData.append('upload_source', uploadData.upload_source || 'web')
    formData.append('extract_text', uploadData.extract_text?.toString() || 'false')
    formData.append('generate_soap', uploadData.generate_soap?.toString() || 'false')

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.UPLOAD}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to upload document', response.status)
    }

    return response.json()
  },

  async processDocument(
    processData: DocumentProcessRequest,
    token: string
  ): Promise<DocumentProcessResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.PROCESS}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(processData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to process document', response.status)
    }

    return response.json()
  },

  async getDocumentMetadata(documentId: string, token: string): Promise<DocumentMetadataResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.GET(documentId)}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to get document metadata', response.status)
    }

    return response.json()
  },

  async deleteDocument(
    documentId: string,
    token: string,
    deleteFromS3 = true,
    reason?: string
  ): Promise<DocumentDeleteResponse> {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.DELETE(documentId)}`)
    url.searchParams.set('delete_from_s3', deleteFromS3.toString())
    if (reason) {
      url.searchParams.set('reason', reason)
    }

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to delete document', response.status)
    }

    return response.json()
  },

  async getDocumentContent(documentId: string, token: string): Promise<DocumentContentResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.CONTENT(documentId)}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to get document content', response.status)
    }

    return response.json()
  },

  async listSessionDocuments(
    sessionId: string,
    token: string,
    page = 1,
    pageSize = 20
  ): Promise<DocumentListResponse> {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.SESSION_DOCUMENTS(sessionId)}`)
    url.searchParams.set('page', page.toString())
    url.searchParams.set('page_size', pageSize.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to list session documents', response.status)
    }

    return response.json()
  },

  async listDocuments(token: string, page = 1, pageSize = 20): Promise<DocumentListResponse> {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.LIST}`)
    url.searchParams.set('page', page.toString())
    url.searchParams.set('page_size', pageSize.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to list documents', response.status)
    }

    return response.json()
  },
}
