import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, ApiError } from '@/lib/api-config'

// Types
export interface SOAPSection {
  section_type: string
  content: string
  confidence: number
  word_count: number
}

export interface SOAPNote {
  subjective: SOAPSection
  objective: SOAPSection
  assessment: SOAPSection
  plan: SOAPSection
  generated_at: string
  model_version: string
  total_confidence: number
}

export interface Entity {
  type: string
  value: string
  confidence: number
  start_pos: number
  end_pos: number
}

export interface NEROutput {
  entities: Entity[]
  total_entities: number
  processing_time: number
}

export interface SOAPGenerationRequest {
  text: string
  session_id: string
  document_id: string
  professional_id?: string
  include_context?: boolean
  max_length?: number
  temperature?: number
}

export interface SOAPGenerationResponse {
  success: boolean
  soap_note?: SOAPNote
  context_data?: NEROutput
  ai_approved: boolean
  note_id?: string
  processing_time: number
  regeneration_count: number
  validation_feedback: string
  message: string
}

export interface SOAPNoteResponse {
  note_id: string
  session_id: string
  document_id: string
  professional_id?: string
  ai_approved: boolean
  user_approved: boolean
  status: string
  content: Record<string, any>
  context_data?: Record<string, any>
  sections?: SOAPSection[]
  notes?: string
  created_at: string
  updated_at: string
  soap_note?: SOAPNote
}

export interface SOAPNoteUpdate {
  content?: Record<string, any>
  modification_reason?: string
  user_approved?: boolean
}

// API Functions
export const soapApi = {
  async generateSOAPNote(
    generationData: SOAPGenerationRequest,
    token: string
  ): Promise<SOAPGenerationResponse> {
    console.log('SOAP API: Making request to:', `${API_BASE_URL}${API_ENDPOINTS.SOAP.GENERATE}`)
    console.log('SOAP API: Request data:', generationData)
    console.log('SOAP API: Headers:', getAuthHeaders(token))
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SOAP.GENERATE}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(generationData),
    })

    console.log('SOAP API: Response status:', response.status)
    console.log('SOAP API: Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const error = await response.json()
      console.log('SOAP API: Error response:', error)
      throw new ApiError(error.detail || 'Failed to generate SOAP note', response.status)
    }

    const responseData = await response.json()
    console.log('SOAP API: Success response:', responseData)
    return responseData
  },

  async getSOAPNote(noteId: string, token: string): Promise<SOAPNoteResponse> {
    console.log('API: Fetching SOAP note with ID:', noteId)
    console.log('API: Using endpoint:', `${API_BASE_URL}${API_ENDPOINTS.SOAP.GET(noteId)}`)
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SOAP.GET(noteId)}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    console.log('API: Response status:', response.status)
    console.log('API: Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const error = await response.json()
      console.error('API: Error response:', error)
      throw new ApiError(error.detail || 'Failed to get SOAP note', response.status)
    }

    const responseData = await response.json()
    console.log('API: Response data:', JSON.stringify(responseData, null, 2))
    return responseData
  },

  async updateSOAPNote(
    noteId: string,
    updateData: SOAPNoteUpdate,
    token: string
  ): Promise<SOAPNoteResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SOAP.UPDATE(noteId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to update SOAP note', response.status)
    }

    return response.json()
  },

  async approveSOAPNote(
    noteId: string,
    approved: boolean,
    token: string
  ): Promise<SOAPNoteResponse> {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.SOAP.APPROVE(noteId)}`)
    url.searchParams.set('approved', approved.toString())

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to approve SOAP note', response.status)
    }

    return response.json()
  },

  async listSessionSOAPNotes(
    sessionId: string,
    token: string,
    approvedOnly = false
  ): Promise<SOAPNoteResponse[]> {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.SOAP.SESSION_NOTES(sessionId)}`)
    url.searchParams.set('approved_only', approvedOnly.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to list session SOAP notes', response.status)
    }

    return response.json()
  },

  async getPendingApprovals(
    token: string,
    professionalId?: string,
    limit = 50
  ): Promise<SOAPNoteResponse[]> {
    const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.SOAP.PENDING_APPROVALS}`)
    if (professionalId) {
      url.searchParams.set('professional_id', professionalId)
    }
    url.searchParams.set('limit', limit.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ApiError(error.detail || 'Failed to get pending approvals', response.status)
    }

    return response.json()
  },

  async exportSOAPNotePDF(noteId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/soap/notes/${noteId}/export-pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `SOAP_Note_${noteId}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting SOAP note PDF:', error);
      throw error;
    }
  },
};
