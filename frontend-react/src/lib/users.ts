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

  async listUsers(token: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.LIST}`, {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    return handleApiResponse<any>(response);
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
