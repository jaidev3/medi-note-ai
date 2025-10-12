export { authApi } from "./auth";
export { documentsApi } from "./documents";
export { API_BASE_URL, API_ENDPOINTS, ApiError } from "./api-config";

export type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserProfile,
} from "./auth";
export type { Document } from "./documents";
