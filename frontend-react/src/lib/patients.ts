import {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthHeaders,
  handleApiResponse,
} from "./api-config";
import type { SessionListResponse } from "./sessions";

export interface PatientResponse {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  medical_history?: string;
  total_visits: number;
  last_visit?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientCreateRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  medical_history?: string;
}

export interface PatientUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  medical_history?: string;
}

export interface PatientListResponse {
  patients: PatientResponse[];
  total_count: number;
  page: number;
  page_size: number;
}

export const patientsApi = {
  async listPatients(
    token: string,
    page: number = 1,
    pageSize: number = 20,
    search?: string
  ): Promise<PatientListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (search) {
      params.append("search", search);
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.PATIENTS.LIST}?${params}`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    return handleApiResponse<PatientListResponse>(response);
  },

  async getPatient(id: string, token: string): Promise<PatientResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.PATIENTS.DETAIL(id)}`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    return handleApiResponse<PatientResponse>(response);
  },

  async createPatient(
    data: PatientCreateRequest,
    token: string
  ): Promise<PatientResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.PATIENTS.CREATE}`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );

    return handleApiResponse<PatientResponse>(response);
  },

  async updatePatient(
    id: string,
    data: PatientUpdateRequest,
    token: string
  ): Promise<PatientResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.PATIENTS.UPDATE(id)}`,
      {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );

    return handleApiResponse<PatientResponse>(response);
  },

  async deletePatient(id: string, token: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.PATIENTS.DELETE(id)}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete patient");
    }
  },

  async getPatientVisits(
    id: string,
    token: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<SessionListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      patient_id: id,
    });

    const response = await fetch(`${API_BASE_URL}/sessions?${params}`, {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    return handleApiResponse<SessionListResponse>(response);
  },
};
