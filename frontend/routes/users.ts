import {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthHeaders,
  ApiError,
} from "@/lib/api-config";
import { UserProfile } from "./auth";

// Types
export interface ProfessionalUpdateRequest {
  name?: string;
  phone_number?: string;
  department?: string;
  employee_id?: string;
}

export interface UserStatsResponse {
  total_patients: number;
  total_sessions: number;
  total_soap_notes: number;
  total_documents: number;
  recent_sessions: number;
  recent_soap_notes: number;
  professional_id?: string;
  professional_sessions: number;
  professional_soap_notes: number;
}

// API Functions
export const usersApi = {
  async getCurrentProfessional(token: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.ME}`, {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to get professional info",
        response.status
      );
    }

    return response.json();
  },

  async updateProfessional(
    professionalId: string,
    updateData: ProfessionalUpdateRequest,
    token: string
  ): Promise<UserProfile> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.USERS.UPDATE_PROFESSIONAL(
        professionalId
      )}`,
      {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to update professional",
        response.status
      );
    }

    return response.json();
  },

  async getUserStats(
    token: string,
    professionalId?: string
  ): Promise<UserStatsResponse> {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.USERS.STATS}`);
    if (professionalId) {
      url.searchParams.set("professional_id", professionalId);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to get user stats",
        response.status
      );
    }

    return response.json();
  },
};
