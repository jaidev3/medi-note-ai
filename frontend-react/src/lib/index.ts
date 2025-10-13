export { authApi } from "./auth";
export { documentsApi } from "./documents";
export { patientsApi } from "./patients";
export { sessionsApi } from "./sessions";
export { soapApi } from "./soap";
export { ragApi } from "./rag";
export { usersApi } from "./users";
export { professionalsApi } from "./professionals";
export { API_BASE_URL, API_ENDPOINTS, ApiError } from "./api-config";

export type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserProfile,
} from "./auth";
export type {
  Document,
  DocumentUploadRequest,
  DocumentUploadResponse,
  DocumentMetadata,
  DocumentListResponse,
  DocumentContentResponse,
  DocumentProcessRequest,
  DocumentProcessResponse,
  DocumentPiiStatusResponse,
  DocumentDeleteOptions,
  DocumentDeleteResponse,
} from "./documents";
export type {
  PatientResponse,
  PatientCreateRequest,
  PatientUpdateRequest,
  PatientListResponse,
} from "./patients";
export type {
  SessionResponse,
  SessionCreateRequest,
  SessionUpdateRequest,
  SessionListResponse,
} from "./sessions";
export type {
  SOAPGenerationRequest,
  SOAPGenerationResponse,
  SOAPNoteResponse,
  SOAPNoteListResponse,
  SOAPNote,
  SOAPSection,
  SOAPNoteUpdateRequest,
  SOAPBatchApprovalPayload,
  SOAPPendingApprovalsParams,
  SOAPTriggerEmbeddingPayload,
  SOAPTriggerEmbeddingResponse,
} from "./soap";
export type {
  RAGQueryRequest,
  RAGQueryResponse,
  RAGChunk,
  RAGEmbeddingRequest,
  RAGEmbeddingResponse,
  RAGBatchEmbeddingRequest,
  RAGSimilaritySearchRequest,
  RAGSimilaritySearchResponse,
  RAGEmbeddingStatsResponse,
  RAGNotesNeedingEmbeddingRequest,
  RAGNotesNeedingEmbeddingResponse,
  RAGNoteNeedingEmbedding,
} from "./rag";
export type { UserStatsResponse, ProfessionalUpdateRequest } from "./users";
export type {
  ProfessionalResponse,
  ProfessionalListResponse,
} from "./professionals";
