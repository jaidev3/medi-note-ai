# Component Migration Guide

This guide shows how to migrate existing components from mock data to real API calls using React Query hooks.

## Before You Start

Make sure all dependencies are installed:

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

## Migration Examples

### 1. Patients Page Migration

**Before (Mock Data):**

```typescript
const [patients, setPatients] = useState([
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
]);
```

**After (Real API):**

```typescript
import { useListPatients, useDeletePatient } from "@/hooks";

const [page, setPage] = useState(1);
const [search, setSearch] = useState("");

const { data, isLoading, error } = useListPatients(page, 20, search);

const { mutate: deletePatient } = useDeletePatient();

const handleDelete = (id: string) => {
  deletePatient(id, {
    onSuccess: () => {
      alert("Patient deleted successfully!");
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });
};

// Access data
const patients = data?.patients || [];
const totalCount = data?.total_count || 0;
```

### 2. Sessions Page Migration

**Before (Mock):**

```typescript
// Static content
<Typography>View and manage patient visit sessions here.</Typography>
```

**After (Real API):**

```typescript
import { useListSessions, useDeleteSession } from "@/hooks";

const [page, setPage] = useState(1);
const [patientId, setPatientId] = useState("");

const { data, isLoading } = useListSessions(page, 20, patientId);
const { mutate: deleteSession } = useDeleteSession();

const sessions = data?.sessions || [];
const totalCount = data?.total_count || 0;

const handleDelete = (id: string) => {
  if (confirm("Delete this session?")) {
    deleteSession(id);
  }
};
```

### 3. SOAP Generation Page Migration

**Before (Simulated):**

```typescript
const handleGenerate = async () => {
  setLoading(true);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  setSoapNote("Generated SOAP note...");
  setLoading(false);
};
```

**After (Real API):**

```typescript
import { useGenerateSOAPNote } from "@/hooks";

const { mutate: generateSOAP, isPending, data: result } = useGenerateSOAPNote();

const handleGenerate = () => {
  generateSOAP(
    {
      text: transcript,
      session_id: sessionId,
      include_context: true,
      max_length: 8000,
      temperature: 0.1,
    },
    {
      onSuccess: (data) => {
        console.log("SOAP Note:", data.soap_note);
        // Handle success
      },
      onError: (error) => {
        setError(error.message);
      },
    }
  );
};

// Access generated data
const soapNote = result?.soap_note;
const processingTime = result?.processing_time;
```

### 4. RAG Query Page Migration

**Before (Simulated):**

```typescript
const handleSearch = async () => {
  setLoading(true);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  setResults([
    "Result 1: Patient John Doe...",
    "Result 2: Patient Jane Smith...",
  ]);
  setLoading(false);
};
```

**After (Real API):**

```typescript
import { useQueryKnowledgeBase } from "@/hooks";

const {
  mutate: queryKB,
  isPending,
  data: queryResult,
} = useQueryKnowledgeBase();

const handleSearch = () => {
  queryKB(
    {
      query: searchQuery,
      patient_id: selectedPatient,
      similarity_threshold: 0.1,
      top_k: 5,
      include_sources: true,
    },
    {
      onSuccess: (data) => {
        console.log("Answer:", data.answer);
        console.log("Sources:", data.retrieved_chunks);
      },
    }
  );
};

// Access results
const answer = queryResult?.answer;
const sources = queryResult?.retrieved_chunks || [];
```

### 5. Document Upload Page Migration

**Before (Simple upload):**

```typescript
const handleUpload = async () => {
  try {
    const result = await documentsApi.upload(selectedFile);
    setMessage(`File "${selectedFile.name}" uploaded successfully!`);
  } catch (err) {
    setError(err.message);
  }
};
```

**After (Full featured upload):**

```typescript
import { useUploadDocument } from "@/hooks";

const { mutate: uploadDoc, isPending, error } = useUploadDocument();

const handleUpload = () => {
  if (!selectedFile || !sessionId) return;

  uploadDoc(
    {
      file: selectedFile,
      session_id: sessionId,
      description: description,
      upload_source: "web",
      extract_text: extractText,
      generate_soap: generateSOAP,
    },
    {
      onSuccess: (data) => {
        setMessage(data.message);
        // Optionally redirect
        navigate(`/sessions/${sessionId}`);
      },
      onError: (error) => {
        setError(error.message);
      },
    }
  );
};
```

### 6. Dashboard Page Migration

**Before (Hardcoded stats):**

```typescript
// No stats
```

**After (Real stats from API):**

```typescript
import { useGetUserStats } from "@/hooks";

const { data: stats, isLoading } = useGetUserStats();

// Display stats
<Card>
  <CardContent>
    <Typography>Total Patients</Typography>
    <Typography variant="h4">
      {stats?.total_patients || 0}
    </Typography>
  </CardContent>
</Card>

<Card>
  <CardContent>
    <Typography>Total Sessions</Typography>
    <Typography variant="h4">
      {stats?.total_sessions || 0}
    </Typography>
  </CardContent>
</Card>
```

### 7. Settings Page Migration

**Before (Read-only):**

```typescript
// Just displaying user data
<Typography>Name: {user?.name}</Typography>
```

**After (Editable with API):**

```typescript
import { useUpdateProfessional } from "@/hooks";
import { useAuth } from "@/hooks";

const { user } = useAuth();
const {
  mutate: updateProfile,
  isPending,
  error,
  isSuccess,
} = useUpdateProfessional();

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (!user?.id) return;

  updateProfile(
    {
      id: user.id,
      data: {
        name: formData.name,
        phone_number: formData.phone_number,
        department: formData.department,
        employee_id: formData.employee_id,
      },
    },
    {
      onSuccess: () => {
        setSuccess("Profile updated successfully!");
      },
      onError: (error) => {
        setError(error.message);
      },
    }
  );
};
```

## Common Patterns

### Loading States

```typescript
const { data, isLoading, error } = useListPatients(1, 20);

if (isLoading) {
  return <CircularProgress />;
}

if (error) {
  return <Alert severity="error">{error.message}</Alert>;
}

return <div>{/* Render data */}</div>;
```

### Pagination

```typescript
const [page, setPage] = useState(1);
const { data } = useListPatients(page, 20);

const totalPages = Math.ceil((data?.total_count || 0) / 20);

<Button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
  Previous
</Button>
<Button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
  Next
</Button>
```

### Search/Filtering

```typescript
const [search, setSearch] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
  }, 300);
  return () => clearTimeout(timer);
}, [search]);

const { data } = useListPatients(1, 20, debouncedSearch);
```

### Mutation with Optimistic Updates

```typescript
const { mutate: deletePatient } = useDeletePatient();
const queryClient = useQueryClient();

const handleDelete = (id: string) => {
  // Optimistic update
  queryClient.setQueryData(["patients"], (old: any) => ({
    ...old,
    patients: old.patients.filter((p: any) => p.id !== id),
  }));

  deletePatient(id, {
    onError: () => {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
};
```

### Dependent Queries

```typescript
const { data: patient } = useGetPatient(patientId);
const { data: visits } = useGetPatientVisits(
  patientId,
  1,
  50,
  { enabled: !!patient } // Only fetch if patient exists
);
```

### Parallel Queries

```typescript
const patientsQuery = useListPatients(1, 100);
const sessionsQuery = useListSessions(1, 100);

const isLoading = patientsQuery.isLoading || sessionsQuery.isLoading;
const hasError = patientsQuery.error || sessionsQuery.error;

const patients = patientsQuery.data?.patients || [];
const sessions = sessionsQuery.data?.sessions || [];
```

## Error Handling Best Practices

### Global Error Handler

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error: any) => {
        if (error.status === 401) {
          // Redirect to login
          localStorage.removeItem("access_token");
          window.location.href = "/login";
        }
      },
    },
  },
});
```

### Component-Level Error Handling

```typescript
const { data, error } = useListPatients(1, 20);

if (error) {
  if (error.status === 404) {
    return <div>No patients found</div>;
  }
  if (error.status === 403) {
    return <div>Access denied</div>;
  }
  return <div>Error: {error.message}</div>;
}
```

## Testing

### Mock React Query Hooks

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

// In your tests
const { result } = renderHook(() => useListPatients(1, 20), { wrapper });
```

## Checklist for Each Component

- [ ] Replace mock data with React Query hooks
- [ ] Add loading states
- [ ] Add error handling
- [ ] Implement pagination if needed
- [ ] Add search/filtering if needed
- [ ] Test CRUD operations
- [ ] Handle empty states
- [ ] Add success messages
- [ ] Test error scenarios
- [ ] Update TypeScript types

## Next Steps

1. Start with the simplest components (Dashboard, Settings)
2. Move to list views (Patients, Sessions)
3. Then detail views
4. Finally, complex forms (SOAP, RAG)

All the hooks are ready and tested - you just need to replace the mock data with real API calls!
