import {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthHeaders,
  handleApiResponse,
} from "./api-config";

export interface UserStatsResponse {
  total_patients: number;
  total_sessions: number;
  total_soap_notes: number;
  total_documents: number;
  recent_sessions: number;
  recent_soap_notes: number;
}

export interface ProfessionalUpdateRequest {
  name?: string;
  phone_number?: string;
  department?: string;
  employee_id?: string;
}

export interface ProfessionalResponse {
  id: string;
  name: string;
  email: string;
  role: "AUDIOLOGISTS" | "HEARING_AID_SPECIALISTS" | "ENT_PHYSICIANS" | "CLINICAL_SUPPORT_STAFF";
  department?: string;
  employee_id?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
  total_sessions: number;
  total_soap_notes: number;
}

export interface ProfessionalListResponse {
  professionals: ProfessionalResponse[];
  total_count: number;
  page: number;
  page_size: number;
}

export const usersApi = {
  async getUserStats(token: string): Promise<UserStatsResponse> {
    const response = await fetch(`${API_BASE_URL}/users/stats`, {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    return handleApiResponse<UserStatsResponse>(response);
  },

  async updateProfessional(
    id: string,
    data: ProfessionalUpdateRequest,
    token: string
  ): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.USERS.UPDATE(id)}`,
      {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );

    return handleApiResponse<any>(response);
  },

  async getUser(id: string, token: string): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.USERS.DETAIL(id)}`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    return handleApiResponse<any>(response);
  },

  async listUsers(token: string, page: number = 1, page_size: number = 100, search?: string): Promise<ProfessionalListResponse> {
    let url = `${API_BASE_URL}/users/professionals?page=${page}&page_size=${page_size}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    return handleApiResponse<ProfessionalListResponse>(response);
  },

  async deleteUser(id: string, token: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.USERS.DELETE(id)}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete user");
    }
  },
};
