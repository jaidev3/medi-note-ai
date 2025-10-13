# Quick Reference: React Query Hooks

## 📚 All Available Hooks

### 🔐 Authentication

```typescript
useLogin(); // Login user
useRegister(); // Register new user
useLogout(); // Logout user
useCurrentUser(token); // Get current user profile
useRefreshToken(); // Refresh access token
```

### 👥 Patients

```typescript
useListPatients(page, pageSize, search); // List all patients
useGetPatient(id); // Get single patient
useGetPatientVisits(id, page, pageSize); // Get patient's visits
useCreatePatient(); // Create new patient
useUpdatePatient(); // Update patient
useDeletePatient(); // Delete patient
```

### 📅 Sessions

```typescript
useListSessions(page, pageSize, patientId, professionalId); // List sessions
useGetSession(id); // Get single session
useCreateSession(); // Create session
useUpdateSession(); // Update session
useDeleteSession(); // Delete session
```

### 📝 SOAP Notes

```typescript
useGenerateSOAPNote(); // Generate SOAP note from text
useListSOAPNotes(page, pageSize, sessionId); // List SOAP notes
useGetSOAPNote(id); // Get single SOAP note
useUpdateSOAPNote(); // Update SOAP note
useDeleteSOAPNote(); // Delete SOAP note
useExtractPII(); // Extract PII from text
useExtractNER(); // Extract medical entities
```

### 🔍 RAG (Knowledge Base)

```typescript
useQueryKnowledgeBase(); // Query patient records
useGenerateEmbeddings(); // Generate embeddings for text
```

### 📄 Documents

```typescript
useUploadDocument(); // Upload document with full params
useSimpleUpload(); // Simple file upload
useDocuments(); // List all documents
useDocument(id); // Get single document
useDeleteDocument(); // Delete document
useDownloadDocument(); // Download document
```

### 👤 Users & Professionals

```typescript
useGetUserStats(); // Get user statistics
useUpdateProfessional(); // Update profile
useGetUser(id); // Get single user
useListUsers(); // List all users
useDeleteUser(); // Delete user
useListProfessionals(page, pageSize); // List professionals
useGetProfessional(id); // Get single professional
```

## 🎯 Common Usage Patterns

### Query Pattern (GET)

```typescript
const { data, isLoading, error, refetch } = useHookName();

if (isLoading) return <Loading />;
if (error) return <Error message={error.message} />;
return <div>{data}</div>;
```

### Mutation Pattern (POST, PUT, DELETE)

```typescript
const { mutate, isPending, error } = useHookName();

const handleAction = () => {
  mutate(data, {
    onSuccess: (result) => {
      console.log("Success!", result);
    },
    onError: (error) => {
      console.error("Error!", error);
    },
  });
};
```

## 🔄 Auto-Invalidation Rules

| Action          | Invalidates              |
| --------------- | ------------------------ |
| Create Patient  | `patients`               |
| Update Patient  | `patients`, `patient:id` |
| Delete Patient  | `patients`               |
| Create Session  | `sessions`, `patients`   |
| Update Session  | `sessions`, `session:id` |
| Delete Session  | `sessions`               |
| Generate SOAP   | `soapNotes`, `sessions`  |
| Upload Document | `documents`, `sessions`  |
| Update Profile  | `currentUser`, `users`   |

## 💡 Tips

1. **Always handle loading and error states**

   ```typescript
   if (isLoading) return <Spinner />;
   if (error) return <ErrorAlert />;
   ```

2. **Use enabled option for conditional queries**

   ```typescript
   useGetPatient(id, { enabled: !!id });
   ```

3. **Debounce search inputs**

   ```typescript
   const [search, setSearch] = useState("");
   const debouncedSearch = useDebounce(search, 300);
   useListPatients(1, 20, debouncedSearch);
   ```

4. **Access token from localStorage**

   ```typescript
   const token = localStorage.getItem("access_token");
   ```

5. **Check mutation status**
   ```typescript
   const { isPending, isSuccess, isError } = useMutation();
   ```

## 🚨 Common Gotchas

❌ **Don't do this:**

```typescript
// Missing error handling
const { data } = useListPatients(1, 20);
return <div>{data.patients}</div>; // Can crash!
```

✅ **Do this:**

```typescript
const { data, isLoading, error } = useListPatients(1, 20);
if (isLoading) return <Loading />;
if (error) return <Error />;
return <div>{data?.patients || []}</div>;
```

❌ **Don't do this:**

```typescript
// Forgetting to check enabled
useGetPatient(""); // Runs with empty ID!
```

✅ **Do this:**

```typescript
useGetPatient(id, { enabled: !!id });
```

## 📖 More Resources

- [React Query Docs](https://tanstack.com/query/latest)
- [API_IMPLEMENTATION.md](./API_IMPLEMENTATION.md)
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
