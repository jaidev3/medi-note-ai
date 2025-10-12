import {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthHeaders,
  ApiError,
} from "@/lib/api-config";

// Types
export interface ProfessionalResponse {
  id: string;
  name: string;
  email: string;
  role: string;
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

// API Functions
export const professionalsApi = {
  async listProfessionals(
    token: string,
    page = 1,
    pageSize = 20,
    search?: string
  ): Promise<ProfessionalListResponse> {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.USERS.PROFESSIONALS}`);
    url.searchParams.set("page", page.toString());
    url.searchParams.set("page_size", pageSize.toString());
    if (search) {
      url.searchParams.set("search", search);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to list professionals",
        response.status
      );
    }

    return response.json();
  },

  async getProfessional(
    professionalId: string,
    token: string
  ): Promise<ProfessionalResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.USERS.UPDATE_PROFESSIONAL(
        professionalId
      )}`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to get professional",
        response.status
      );
    }

    return response.json();
  },
};
