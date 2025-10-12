export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    LOGOUT: "/auth/logout",
  },
  USERS: {
    LIST: "/users",
    DETAIL: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },
  DOCUMENTS: {
    UPLOAD: "/documents/upload",
    LIST: "/documents",
    DETAIL: (id: string) => `/documents/${id}`,
    DELETE: (id: string) => `/documents/${id}`,
    DOWNLOAD: (id: string) => `/documents/${id}/download`,
  },
  PATIENTS: {
    LIST: "/patients",
    CREATE: "/patients",
    DETAIL: (id: string) => `/patients/${id}`,
    UPDATE: (id: string) => `/patients/${id}`,
    DELETE: (id: string) => `/patients/${id}`,
  },
  SESSIONS: {
    LIST: "/sessions",
    CREATE: "/sessions",
    DETAIL: (id: string) => `/sessions/${id}`,
    UPDATE: (id: string) => `/sessions/${id}`,
    DELETE: (id: string) => `/sessions/${id}`,
  },
  SOAP: {
    GENERATE: "/ai/soap/generate",
    LIST: "/soap",
    DETAIL: (id: string) => `/soap/${id}`,
    UPDATE: (id: string) => `/soap/${id}`,
    DELETE: (id: string) => `/soap/${id}`,
    EXTRACT_PII: "/ai/pii/extract",
    EXTRACT_NER: "/ai/ner/extract",
  },
  RAG: {
    QUERY: "/rag/query",
    EMBED: "/ai/embeddings/generate",
  },
};

export class ApiError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function getAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const authToken = token || localStorage.getItem("access_token");
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  return headers;
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "An error occurred" }));
    throw new ApiError(error.detail || "An error occurred", response.status);
  }
  return response.json();
}
