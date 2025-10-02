import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, ApiError } from '@/lib/api-config'
import { SessionResponse, SessionListResponse } from './patients'

// Types
export interface SessionCreateRequest {
  patient_id: string
  professional_id?: string
  visit_date?: string
  notes?: string
}

export interface SessionUpdateRequest {
  notes?: string
  visit_date?: string
}

// API Functions
export const sessionsApi = {
  async createSession(sessionData: SessionCreateRequest, token: string): Promise<SessionResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SESSIONS.CREATE}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(sessionData),
    })

    if (!response.ok) {
      const error = await response.json()
      // Better error handling for validation errors
      if (response.status === 422) {
        throw new ApiError(error.detail || 'Validation error', response.status)
      }
      throw new ApiError(error.detail || 'Failed to create session', response.status)
    }

    return response.json()
  },

  async listSessions(
    token: string,
    page = 1,
    pageSize = 20,
    patientId?: string,
    professionalId?: string
  ): Promise<SessionListResponse> {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.SESSIONS.LIST}`)
    url.searchParams.set('page', page.toString())
    url.searchParams.set('page_size', pageSize.toString())
    if (patientId) {
      url.searchParams.set('patient_id', patientId)
    }
    if (professionalId) {
      url.searchParams.set('professional_id', professionalId)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to list sessions', response.status)
    }

    return response.json()
  },

  async getSession(sessionId: string, token: string): Promise<SessionResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SESSIONS.GET(sessionId)}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to get session', response.status)
    }

    return response.json()
  },

  async updateSession(
    sessionId: string,
    sessionData: SessionUpdateRequest,
    token: string
  ): Promise<SessionResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SESSIONS.UPDATE(sessionId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(sessionData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to update session', response.status)
    }

    return response.json()
  },

  async deleteSession(sessionId: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SESSIONS.DELETE(sessionId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to delete session', response.status)
    }
  },
}
