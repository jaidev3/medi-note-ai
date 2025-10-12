import {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthHeaders,
  ApiError,
} from "@/lib/api-config";

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  // backend expects enum values; use these exact strings when sending registration
  role:
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

// API Functions
export const authApi = {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.detail || "Login failed", response.status);
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
      const error = await response.json();
      throw new ApiError(
        error.detail || "Registration failed",
        response.status
      );
    }

    return response.json();
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}?refresh_token=${refreshToken}`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Token refresh failed",
        response.status
      );
    }

    return response.json();
  },

  async getCurrentUser(token: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.ME}`, {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(
        error.detail || "Failed to get user info",
        response.status
      );
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
      const error = await response.json();
      throw new ApiError(error.detail || "Logout failed", response.status);
    }
  },
};
