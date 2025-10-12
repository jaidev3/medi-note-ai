// API Configuration
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// API Endpoints
export const API_ENDPOINTS = {
  // Health
  HEALTH: "/health",
  ROOT: "/",

  // Authentication
  AUTH: {
    LOGIN: "/auth/login",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
  },

  // Users
  USERS: {
    PROFESSIONALS: "/users/professionals",
    UPDATE_PROFESSIONAL: (id: string) => `/users/professionals/${id}`,
    STATS: "/users/stats",
  },

  // Patients
  PATIENTS: {
    CREATE: "/patients",
    LIST: "/patients",
    GET: (id: string) => `/patients/${id}`,
    UPDATE: (id: string) => `/patients/${id}`,
    VISITS: (id: string) => `/patients/${id}/visits`,
  },

  // Sessions
  SESSIONS: {
    CREATE: "/sessions",
    LIST: "/sessions",
    GET: (id: string) => `/sessions/${id}`,
    UPDATE: (id: string) => `/sessions/${id}`,
    DELETE: (id: string) => `/sessions/${id}`,
  },

  // Documents
  DOCUMENTS: {
    UPLOAD: "/documents/upload",
    PROCESS: "/documents/process",
    LIST: "/documents",
    GET: (id: string) => `/documents/${id}`,
    DELETE: (id: string) => `/documents/${id}`,
    CONTENT: (id: string) => `/documents/${id}/content`,
    SESSION_DOCUMENTS: (sessionId: string) =>
      `/documents/sessions/${sessionId}/documents`,
  },

  // SOAP Notes
  SOAP: {
    GENERATE: "/soap/generate",
    GET: (id: string) => `/soap/notes/${id}`,
    UPDATE: (id: string) => `/soap/notes/${id}`,
    APPROVE: (id: string) => `/soap/notes/${id}/approve`,
    SESSION_NOTES: (sessionId: string) =>
      `/soap/sessions/${sessionId}/soap-notes`,
    PENDING_APPROVALS: "/soap/pending-approvals",
  },

  // RAG Queries
  RAG: {
    QUERY: "/rag/query",
    EMBED: "/rag/embed",
    BATCH_EMBED: "/rag/batch-embed",
    SIMILAR: (noteId: string) => `/rag/similar/${noteId}`,
    SEARCH_SIMILARITY: "/rag/search-similarity",
    STATS: "/rag/stats",
  },

  // Professionals
  // NOTE: Professional endpoints are available under USERS.PROFESSIONALS and
  // USERS.UPDATE_PROFESSIONAL to align with backend routing.
} as const;

// Request headers helper
export const getAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// API Response types
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total_count: number;
  page: number;
  page_size: number;
}

// Error handling
export class ApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

// Simple function to check if error indicates token expiration
export const isTokenExpiredError = (error: any): boolean => {
  return (
    error?.status === 401 ||
    error?.statusCode === 401 ||
    (error?.message && error.message.toLowerCase().includes("unauthorized"))
  );
};

// Simple function to handle token expiration
export const handleTokenExpiration = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};
