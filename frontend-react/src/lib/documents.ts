import {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthHeaders,
  handleApiResponse,
} from "./api-config";

export interface Document {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
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
  message: string;
  document_id?: string;
  filename?: string;
  extracted_text?: string;
  soap_note_id?: string;
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

  async upload(file: File): Promise<Document> {
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

    return handleApiResponse<Document>(response);
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

  async delete(id: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.DELETE(id)}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete document");
    }
  },

  async download(id: string): Promise<Blob> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.DOWNLOAD(id)}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to download document");
    }

    return response.blob();
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
