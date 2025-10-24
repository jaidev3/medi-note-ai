import {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthHeaders,
  ApiError,
} from "./api-config";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: "PROFESSIONAL" | "PATIENT" | "ADMIN";
  professional_role?:
    | "AUDIOLOGISTS"
    | "HEARING_AID_SPECIALISTS"
    | "ENT_PHYSICIANS"
    | "CLINICAL_SUPPORT_STAFF";
  department?: string;
  employee_id?: string;
  phone_number?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfile {
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

export const authApi = {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      let errorMessage = error.detail || "Login failed";

      // Handle validation errors
      if (response.status === 422 && error.detail && typeof error.detail === 'object') {
        if (Array.isArray(error.detail)) {
          errorMessage = error.detail
            .map((err: any) => `${err.loc?.join('.')}: ${err.msg}`)
            .join(', ');
        } else {
          errorMessage = JSON.stringify(error.detail);
        }
      }

      throw new ApiError(errorMessage, response.status);
    }

    return response.json();
  },

  async register(userData: RegisterRequest): Promise<UserProfile> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      // Handle different error response formats
      let errorMessage = error.detail || "Registration failed";

      // If error has validation details (422), try to extract them
      if (response.status === 422 && error.detail && typeof error.detail === 'object') {
        // Handle FastAPI validation error format
        if (Array.isArray(error.detail)) {
          errorMessage = error.detail
            .map((err: any) => `${err.loc?.join('.')}: ${err.msg}`)
            .join(', ');
        } else {
          errorMessage = JSON.stringify(error.detail);
        }
      }

      throw new ApiError(errorMessage, response.status);
    }

    return response.json();
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      let errorMessage = error.detail || "Token refresh failed";

      if (response.status === 422 && error.detail && typeof error.detail === 'object') {
        if (Array.isArray(error.detail)) {
          errorMessage = error.detail
            .map((err: any) => `${err.loc?.join('.')}: ${err.msg}`)
            .join(', ');
        } else {
          errorMessage = JSON.stringify(error.detail);
        }
      }

      throw new ApiError(errorMessage, response.status);
    }

    return response.json();
  },

  async getCurrentUser(token: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.ME}`, {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      let errorMessage = error.detail || "Failed to get user info";

      if (response.status === 422 && error.detail && typeof error.detail === 'object') {
        if (Array.isArray(error.detail)) {
          errorMessage = error.detail
            .map((err: any) => `${err.loc?.join('.')}: ${err.msg}`)
            .join(', ');
        } else {
          errorMessage = JSON.stringify(error.detail);
        }
      }

      throw new ApiError(errorMessage, response.status);
    }

    return response.json();
  },

  async logout(token: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`,
      {
        method: "POST",
        headers: getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      let errorMessage = error.detail || "Logout failed";

      if (response.status === 422 && error.detail && typeof error.detail === 'object') {
        if (Array.isArray(error.detail)) {
          errorMessage = error.detail
            .map((err: any) => `${err.loc?.join('.')}: ${err.msg}`)
            .join(', ');
        } else {
          errorMessage = JSON.stringify(error.detail);
        }
      }

      throw new ApiError(errorMessage, response.status);
    }
  },
};
