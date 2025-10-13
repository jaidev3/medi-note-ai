import { API_BASE_URL, getAuthHeaders, handleApiResponse } from "./api-config";

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
}

export interface ProfessionalListResponse {
  professionals: ProfessionalResponse[];
  total_count: number;
  page: number;
  page_size: number;
}

export const professionalsApi = {
  async listProfessionals(
    token: string,
    page: number = 1,
    pageSize: number = 100
  ): Promise<ProfessionalListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/professionals?${params}`, {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    return handleApiResponse<ProfessionalListResponse>(response);
  },

  async getProfessional(
    id: string,
    token: string
  ): Promise<ProfessionalResponse> {
    const response = await fetch(`${API_BASE_URL}/professionals/${id}`, {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    return handleApiResponse<ProfessionalResponse>(response);
  },
};
