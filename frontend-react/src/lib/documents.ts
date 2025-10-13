import {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthHeaders,
  handleApiResponse,
} from "./api-config";

export interface Document {
  id: string;
  document_id?: string;
  document_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  upload_status: string;
  processed: boolean;
  text_extracted: boolean;
  soap_generated: boolean;
  session_id: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentMetadata {
  document_id: string;
  session_id: string;
  document_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  upload_status: string;
  processed: boolean;
  text_extracted: boolean;
  soap_generated: boolean;
  created_at: string;
  updated_at: string;
  processed_at?: string | null;
}

export interface DocumentListResponse {
  documents: DocumentMetadata[];
  total_count: number;
  page: number;
  page_size: number;
  session_id?: string;
}

export interface DocumentContentResponse {
  document_id: string;
  content: string;
  content_type: string;
  extracted: boolean;
  word_count: number;
  processing_status: string;
  message?: string;
}

export interface DocumentUploadRequest {
  session_id: string;
  file: File;
  description?: string;
  upload_source?: string;
  extract_text?: boolean;
  generate_soap?: boolean;
}

export interface DocumentUploadResponse {
  success: boolean;
  document_id?: string;
  document_name: string;
  file_size: number;
  file_type: string;
  file_path?: string | null;
  text_extracted: boolean;
  extracted_text?: string | null;
  word_count: number;
  soap_note_id?: string | null;
  soap_generated: boolean;
  pii_masked: boolean;
  pii_entities_found: number;
  processing_time: number;
  upload_time: number;
  message: string;
  warnings: string[];
}

export interface DocumentProcessRequest {
  document_id: string;
  extract_text?: boolean;
  generate_soap?: boolean;
  ocr_enabled?: boolean;
  language?: string;
}

export interface DocumentProcessResponse {
  success: boolean;
  document_id: string;
  extracted_text?: string | null;
  page_count: number;
  word_count: number;
  soap_note_id?: string | null;
  soap_generated: boolean;
  soap_approved: boolean;
  processing_time: number;
  extraction_time: number;
  soap_generation_time: number;
  pii_masked: boolean;
  pii_entities_found: number;
  message: string;
  warnings: string[];
}

export interface DocumentPiiStatusResponse {
  document_id: string;
  document_name: string;
  text_extracted: boolean;
  pii_processing_status: string;
  pii_masked: boolean;
  pii_entities_found: number | string;
  processing_timestamp?: string | null;
  pii_processing_note?: string;
}

export interface DocumentDeleteResponse {
  success: boolean;
  document_id: string;
  file_deleted: boolean;
  message: string;
}

export interface DocumentDeleteOptions {
  delete_file?: boolean;
  reason?: string;
}

export const documentsApi = {
  async uploadDocument(
    data: DocumentUploadRequest,
    token: string
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("session_id", data.session_id);
    if (data.description) {
      formData.append("description", data.description);
    }
    if (data.upload_source) {
      formData.append("upload_source", data.upload_source);
    }
    if (data.extract_text !== undefined) {
      formData.append("extract_text", data.extract_text.toString());
    }
    if (data.generate_soap !== undefined) {
      formData.append("generate_soap", data.generate_soap.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.UPLOAD}`,
      {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      }
    );

    return handleApiResponse<DocumentUploadResponse>(response);
  },

  async upload(file: File): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.UPLOAD}`,
      {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      }
    );

    return handleApiResponse<DocumentUploadResponse>(response);
  },

  async list(): Promise<Document[]> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.LIST}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    return handleApiResponse<Document[]>(response);
  },

  async get(id: string): Promise<Document> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.DETAIL(id)}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    return handleApiResponse<Document>(response);
  },

  async getMetadata(id: string, token?: string): Promise<DocumentMetadata> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.DETAIL(id)}`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    return handleApiResponse<DocumentMetadata>(response);
  },

  async getPiiStatus(
    id: string,
    token?: string
  ): Promise<DocumentPiiStatusResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.PII_STATUS(id)}`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    return handleApiResponse<DocumentPiiStatusResponse>(response);
  },

  async processDocument(
    data: DocumentProcessRequest,
    token: string
  ): Promise<DocumentProcessResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.PROCESS}`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          extract_text: true,
          generate_soap: true,
          ocr_enabled: true,
          language: "en",
          ...data,
        }),
      }
    );

    return handleApiResponse<DocumentProcessResponse>(response);
  },

  async delete(
    id: string,
    options: DocumentDeleteOptions = {},
    token?: string
  ): Promise<DocumentDeleteResponse> {
    const params = new URLSearchParams();
    if (options.delete_file !== undefined) {
      params.append("delete_file", String(options.delete_file));
    }
    if (options.reason) {
      params.append("reason", options.reason);
    }

    const query = params.toString();
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.DELETE(id)}${
        query ? `?${query}` : ""
      }`,
      {
        method: "DELETE",
        headers: getAuthHeaders(token),
      }
    );

    return handleApiResponse<DocumentDeleteResponse>(response);
  },

  async listBySession(
    sessionId: string,
    token: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<DocumentListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.SESSION(sessionId)}?${params}`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    return handleApiResponse<DocumentListResponse>(response);
  },

  async getContent(
    id: string,
    token: string
  ): Promise<DocumentContentResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.CONTENT(id)}`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    return handleApiResponse<DocumentContentResponse>(response);
  },
};
