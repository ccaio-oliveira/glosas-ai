import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Claims from "./pages/Claims";
import Settings from "./pages/Settings";
import PayersAdmin from "./pages/PayersAdmin";
import UploadTiss from "./pages/UploadTiss";
import Denials from "./pages/Denials";
import DenialDetail from "./pages/DenialDetail";
import SuperAdminRoute from "./components/SuperAdminRoute";
import ErrorLogs from './pages/admin/ErrorLogs';

const queryClient = new QueryClient();

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={user.role === 'super_admin' ? '/admin/errors' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/claims" element={
              <ProtectedRoute>
                <Claims />
              </ProtectedRoute>
            } />
            <Route path="/payers" element={
              <ProtectedRoute>
                <PayersAdmin />
              </ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute>
                <UploadTiss />
              </ProtectedRoute>
            } />
            <Route path="/denials" element={
              <ProtectedRoute>
                <Denials />
              </ProtectedRoute>
            } />
            <Route path="/denials/:id" element={
              <ProtectedRoute>
                <DenialDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/errors" element={
              <SuperAdminRoute> 
                <ErrorLogs />
              </SuperAdminRoute>
            } />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}