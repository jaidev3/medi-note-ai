import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  soapApi,
  SOAPGenerationRequest,
  SOAPNoteUpdateRequest,
  SOAPNoteResponse,
  SOAPBatchApprovalPayload,
  SOAPPendingApprovalsParams,
  SOAPTriggerEmbeddingPayload,
  SOAPTriggerEmbeddingResponse,
} from "@/lib";

// Generate SOAP note mutation
export const useGenerateSOAPNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SOAPGenerationRequest) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return soapApi.generateSOAPNote(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["soapNotes"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
};

// List SOAP notes query
export const useListSOAPNotes = (
  sessionId: string,
  approvedOnly: boolean = false
) => {
  return useQuery<SOAPNoteResponse[]>({
    queryKey: ["soapNotes", sessionId, approvedOnly],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return soapApi.listSessionSOAPNotes(sessionId, token, approvedOnly);
    },
    enabled: !!localStorage.getItem("access_token") && !!sessionId,
  });
};

// Get SOAP note query
export const useGetSOAPNote = (id: string) => {
  return useQuery({
    queryKey: ["soapNote", id],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return soapApi.getSOAPNote(id, token);
    },
    enabled: !!localStorage.getItem("access_token") && !!id,
  });
};

// Update SOAP note mutation
export const useUpdateSOAPNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SOAPNoteUpdateRequest }) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return soapApi.updateSOAPNote(id, data, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["soapNotes"] });
      queryClient.invalidateQueries({ queryKey: ["soapNote", variables.id] });
    },
  });
};

// Extract PII mutation
export const useExtractPII = () => {
  return useMutation({
    mutationFn: (text: string) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return soapApi.extractPII(text, token);
    },
  });
};

// Extract NER mutation
export const useExtractNER = () => {
  return useMutation({
    mutationFn: (text: string) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return soapApi.extractNER(text, token);
    },
  });
};

export const useApproveSOAPNote = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SOAPNoteResponse,
    Error,
    { id: string; approved?: boolean }
  >({
    mutationFn: ({ id, approved = true }) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return soapApi.approveSOAPNote(id, token, approved);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["soapNotes"] });
      queryClient.invalidateQueries({ queryKey: ["soapNote", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["pendingSoapApprovals"] });
    },
  });
};

export const useBatchApproveSOAPNotes = () => {
  const queryClient = useQueryClient();

  return useMutation<SOAPNoteResponse[], Error, SOAPBatchApprovalPayload>({
    mutationFn: (payload) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return soapApi.batchApproveSOAPNotes(payload, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["soapNotes"] });
      queryClient.invalidateQueries({ queryKey: ["pendingSoapApprovals"] });
    },
  });
};

export const usePendingSOAPApprovals = (
  params: SOAPPendingApprovalsParams = {}
) => {
  return useQuery<SOAPNoteResponse[]>({
    queryKey: ["pendingSoapApprovals", params],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return soapApi.getPendingApprovals(token, params);
    },
    enabled: !!localStorage.getItem("access_token"),
    refetchInterval: 30_000,
  });
};

export const useTriggerSOAPEmbedding = () => {
  return useMutation<
    SOAPTriggerEmbeddingResponse,
    Error,
    SOAPTriggerEmbeddingPayload
  >({
    mutationFn: (payload) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return soapApi.triggerEmbeddingForApprovedNotes(payload, token);
    },
  });
};

export const useExportSOAPNotePdf = () => {
  return useMutation<Blob, Error, string>({
    mutationFn: (noteId: string) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return soapApi.exportSOAPNotePdf(noteId, token);
    },
  });
};
