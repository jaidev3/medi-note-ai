import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import Layout from "./layouts/Layout";

// Pages
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { DocumentUploadPage } from "./pages/documents/DocumentUploadPage";
import { PatientsPage } from "./pages/patients/PatientsPage";
import { NewPatientPage } from "./pages/patients/NewPatientPage";
import { PatientDetailPage } from "./pages/patients/PatientDetailPage";
import { SessionsPage } from "./pages/sessions/SessionsPage";
import { NewSessionPage } from "./pages/sessions/NewSessionPage";
import { SessionDetailPage } from "./pages/sessions/SessionDetailPage";
import { SOAPGeneratePage } from "./pages/soap/SOAPGeneratePage";
import { RAGQueryPage } from "./pages/rag/RAGQueryPage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/" element={
              <PublicRoute>
                <HomePage />
              </PublicRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <DocumentUploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <PatientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/new"
              element={
                <ProtectedRoute>
                  <NewPatientPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/:patientId"
              element={
                <ProtectedRoute>
                  <PatientDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sessions"
              element={
                <ProtectedRoute>
                  <SessionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sessions/new"
              element={
                <ProtectedRoute>
                  <NewSessionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sessions/:sessionId"
              element={
                <ProtectedRoute>
                  <SessionDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/soap"
              element={
                <ProtectedRoute>
                  <SOAPGeneratePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rag"
              element={
                <ProtectedRoute>
                  <RAGQueryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
