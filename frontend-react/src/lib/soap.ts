import {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthHeaders,
  handleApiResponse,
} from "./api-config";

export interface SOAPSection {
  content: string;
  confidence: number;
  word_count: number;
}

export interface SOAPNote {
  subjective: SOAPSection;
  objective: SOAPSection;
  assessment: SOAPSection;
  plan: SOAPSection;
  generated_at?: string;
  model_version?: string;
  total_confidence?: number;
}

export interface NERContextData {
  total_entities: number;
  processing_time: number;
  entities?: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
}

export interface SOAPGenerationRequest {
  text: string;
  session_id: string;
  document_id?: string | null;
  professional_id?: string | null;
  include_context?: boolean;
  max_length?: number;
  temperature?: number;
  enable_pii_masking?: boolean;
  preserve_medical_context?: boolean;
}

export interface SOAPGenerationResponse {
  success: boolean;
  message: string;
  soap_note?: SOAPNote | null;
  note_id?: string;
  processing_time: number;
  ai_approved: boolean;
  regeneration_count: number;
  context_data?: NERContextData;
  validation_feedback?: string;
  pii_masked?: boolean;
  pii_entities_found?: number;
  original_text_preserved?: boolean;
}

export interface SOAPNoteResponse {
  note_id: string;
  session_id: string;
  document_id?: string | null;
  professional_id?: string | null;
  ai_approved: boolean;
  user_approved: boolean;
  content: Record<string, any>;
  context_data?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  soap_note?: SOAPNote;
}

export interface SOAPNoteListResponse {
  soap_notes: SOAPNoteResponse[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface SOAPNoteUpdateRequest {
  content: Record<string, any>;
}

export const soapApi = {
  async generateSOAPNote(
    data: SOAPGenerationRequest,
    token: string
  ): Promise<SOAPGenerationResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SOAP.GENERATE}`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );

    return handleApiResponse<SOAPGenerationResponse>(response);
  },

  async listSOAPNotes(
    token: string,
    page: number = 1,
    pageSize: number = 20,
    sessionId?: string
  ): Promise<SOAPNoteListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (sessionId) {
      params.append("session_id", sessionId);
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SOAP.LIST}?${params}`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    return handleApiResponse<SOAPNoteListResponse>(response);
  },

  async getSOAPNote(id: string, token: string): Promise<SOAPNoteResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SOAP.DETAIL(id)}`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
      }
    );

    return handleApiResponse<SOAPNoteResponse>(response);
  },

  async updateSOAPNote(
    id: string,
    data: SOAPNoteUpdateRequest,
    token: string
  ): Promise<SOAPNoteResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SOAP.UPDATE(id)}`,
      {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      }
    );

    return handleApiResponse<SOAPNoteResponse>(response);
  },

  async deleteSOAPNote(id: string, token: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SOAP.DELETE(id)}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete SOAP note");
    }
  },

  async extractPII(text: string, token: string): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SOAP.EXTRACT_PII}`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ text }),
      }
    );

    return handleApiResponse<any>(response);
  },

  async extractNER(text: string, token: string): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SOAP.EXTRACT_NER}`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ text }),
      }
    );

    return handleApiResponse<any>(response);
  },
};
