import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, ApiError } from '@/lib/api-config'

// Types
export interface PatientCreateRequest {
  name: string
  email?: string
  phone?: string
  address?: string
}

export interface PatientUpdateRequest {
  name?: string
  email?: string
  phone?: string
  address?: string
}

export interface PatientResponse {
  id: string
  name?: string
  email?: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
  total_visits: number
  last_visit?: string
}

export interface PatientListResponse {
  patients: PatientResponse[]
  total_count: number
  page: number
  page_size: number
}

export interface SessionResponse {
  session_id: string
  patient_id: string
  professional_id?: string
  visit_date: string
  notes?: string
  document_count: number
  soap_note_count: number
  created_at: string
  updated_at: string
}

export interface SessionListResponse {
  sessions: SessionResponse[]
  total_count: number
  page: number
  page_size: number
  patient_id?: string
}

// API Functions
export const patientsApi = {
  async createPatient(patientData: PatientCreateRequest, token: string): Promise<PatientResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PATIENTS.CREATE}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(patientData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to create patient', response.status)
    }

    return response.json()
  },

  async listPatients(
    token: string,
    page = 1,
    pageSize = 20,
    search?: string
  ): Promise<PatientListResponse> {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.PATIENTS.LIST}`)
    url.searchParams.set('page', page.toString())
    url.searchParams.set('page_size', pageSize.toString())
    if (search) {
      url.searchParams.set('search', search)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to list patients', response.status)
    }

    return response.json()
  },

  async getPatient(patientId: string, token: string): Promise<PatientResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PATIENTS.GET(patientId)}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to get patient', response.status)
    }

    return response.json()
  },

  async updatePatient(
    patientId: string,
    patientData: PatientUpdateRequest,
    token: string
  ): Promise<PatientResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PATIENTS.UPDATE(patientId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(patientData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to update patient', response.status)
    }

    return response.json()
  },

  async getPatientVisits(
    patientId: string,
    token: string,
    page = 1,
    pageSize = 20
  ): Promise<SessionListResponse> {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.PATIENTS.VISITS(patientId)}`)
    url.searchParams.set('page', page.toString())
    url.searchParams.set('page_size', pageSize.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to get patient visits', response.status)
    }

    return response.json()
  },
}
