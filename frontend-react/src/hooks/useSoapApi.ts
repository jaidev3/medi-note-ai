import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { soapApi, SOAPGenerationRequest } from "@/lib";

// Generate SOAP note mutation
export const useGenerateSOAPNote = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: (data: SOAPGenerationRequest) =>
      soapApi.generateSOAPNote(data, token!),
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
  const token = localStorage.getItem("access_token");

  return useQuery({
    queryKey: ["soapNotes", page, pageSize, sessionId],
    queryFn: () => soapApi.listSOAPNotes(token!, page, pageSize, sessionId),
    enabled: !!token,
  });
};

// Get SOAP note query
export const useGetSOAPNote = (id: string) => {
  const token = localStorage.getItem("access_token");

  return useQuery({
    queryKey: ["soapNote", id],
    queryFn: () => soapApi.getSOAPNote(id, token!),
    enabled: !!token && !!id,
  });
};

// Update SOAP note mutation
export const useUpdateSOAPNote = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      soapApi.updateSOAPNote(id, data, token!),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["soapNotes"] });
      queryClient.invalidateQueries({ queryKey: ["soapNote", variables.id] });
    },
  });
};

// Delete SOAP note mutation
export const useDeleteSOAPNote = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: (id: string) => soapApi.deleteSOAPNote(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["soapNotes"] });
    },
  });
};

// Extract PII mutation
export const useExtractPII = () => {
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: (text: string) => soapApi.extractPII(text, token!),
  });
};

// Extract NER mutation
export const useExtractNER = () => {
  const token = localStorage.getItem("access_token");

  return useMutation({
    mutationFn: (text: string) => soapApi.extractNER(text, token!),
  });
};
