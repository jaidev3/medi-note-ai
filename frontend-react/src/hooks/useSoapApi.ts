import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { soapApi, SOAPGenerationRequest, SOAPNoteUpdateRequest } from "@/lib";

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
  page: number = 1,
  pageSize: number = 20,
  sessionId?: string
) => {
  return useQuery({
    queryKey: ["soapNotes", page, pageSize, sessionId],
    queryFn: () => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return soapApi.listSOAPNotes(token, page, pageSize, sessionId);
    },
    enabled: !!localStorage.getItem("access_token"),
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

// Delete SOAP note mutation
export const useDeleteSOAPNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      return soapApi.deleteSOAPNote(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["soapNotes"] });
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
