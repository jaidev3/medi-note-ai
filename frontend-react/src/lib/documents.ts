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

export const documentsApi = {
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
};
