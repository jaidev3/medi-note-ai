import {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthHeaders,
  handleApiResponse,
} from "./api-config";

export interface SessionResponse {
  session_id: string;
  patient_id: string;
  professional_id?: string;
  visit_date: string;
  notes?: string;
  document_count: number;
  soap_note_count: number;
  created_at: string;
  updated_at: string;
}

export interface SessionCreateRequest {
  patient_id: string;
  professional_id?: string;
  visit_date: string;
  notes?: string;
}

export interface SessionUpdateRequest {
  professional_id?: string;
  visit_date?: string;
  notes?: string;
}

export interface SessionListResponse {
  sessions: SessionResponse[];
  total_count: number;
  page: number;
  page_size: number;
}

export const sessionsApi = {
  async listSessions(
    token: string,
    page: number = 1,
    pageSize: number = 20,
    patientId?: string,
    professionalId?: string
  ): Promise<SessionListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (patientId) {
      params.append("patient_id", patientId);
    }
    if (professionalId) {
      params.append("professional_id", professionalId);
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SESSIONS.LIST}?${params}`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    return handleApiResponse<SessionListResponse>(response);
  },

  async getSession(id: string, token: string): Promise<SessionResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SESSIONS.DETAIL(id)}`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    return handleApiResponse<SessionResponse>(response);
  },

  async createSession(
    data: SessionCreateRequest,
    token: string
  ): Promise<SessionResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SESSIONS.CREATE}`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );

    return handleApiResponse<SessionResponse>(response);
  },

  async updateSession(
    id: string,
    data: SessionUpdateRequest,
    token: string
  ): Promise<SessionResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SESSIONS.UPDATE(id)}`,
      {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );

    return handleApiResponse<SessionResponse>(response);
  },

  async deleteSession(id: string, token: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SESSIONS.DELETE(id)}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete session");
    }
  },
};
