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
    SESSION: (sessionId: string) =>
      `/documents/sessions/${sessionId}/documents`,
    CONTENT: (id: string) => `/documents/${id}/content`,
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
    GENERATE: "/soap/generate",
    LIST: "/soap/notes",
    DETAIL: (id: string) => `/soap/notes/${id}`,
    UPDATE: (id: string) => `/soap/notes/${id}`,
    DELETE: (id: string) => `/soap/notes/${id}`,
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

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ refresh_token: refreshToken }),
            }
          );

          if (refreshResponse.ok) {
            const tokenData = await refreshResponse.json();
            localStorage.setItem("access_token", tokenData.access_token);
            localStorage.setItem("refresh_token", tokenData.refresh_token);

            // Retry the original request with new token
            const retryResponse = await fetch(response.url, {
              ...response,
              headers: {
                ...response.headers,
                Authorization: `Bearer ${tokenData.access_token}`,
              },
            });

            if (retryResponse.ok) {
              return retryResponse.json();
            }
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
        }
      }

      // If refresh failed or no refresh token, clear and redirect
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";

      throw new ApiError(
        error.detail || "Unauthorized - please login again",
        response.status
      );
    }

    throw new ApiError(error.detail || "An error occurred", response.status);
  }
  return response.json();
}
