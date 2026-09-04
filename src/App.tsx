import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ManagerJoinPage } from './pages/ManagerJoinPage';
import { DashboardPage } from './pages/DashboardPage';
import { RafflesListPage } from './pages/RafflesListPage';
import { CreateRafflePage } from './pages/CreateRafflePage';
import { RaffleDetailPage } from './pages/RaffleDetailPage';
import { TicketDesignerPage } from './pages/TicketDesignerPage';
import { GenerateTicketsPage } from './pages/GenerateTicketsPage';
import { PrintSetsPage } from './pages/PrintSetsPage';
import { PrintSetDetailPage } from './pages/PrintSetDetailPage';
import { PrintPreviewPage } from './pages/PrintPreviewPage';
import { BookletsPage } from './pages/BookletsPage';
import { BookletDetailPage } from './pages/BookletDetailPage';
import { TicketsPage } from './pages/TicketsPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { ScanPage } from './pages/ScanPage';
import { SalesPage } from './pages/SalesPage';
import { SettingsPage } from './pages/SettingsPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8F7] flex items-center justify-center text-xs font-semibold text-neutral-400">
        Loading RafflePro session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If page is admin-only but current user is a manager, redirect to manager page
  if (adminOnly && user?.role === 'manager') {
    const managerTarget = user.raffleId ? `/raffles/${user.raffleId}/generate` : '/scan';
    return <Navigate to={managerTarget} replace />;
  }

  return <>{children}</>;
};

// Root index redirect based on role
const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'manager') {
    return <Navigate to={user.raffleId ? `/raffles/${user.raffleId}/generate` : '/scan'} replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

// Public Route Guard (redirects if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) {
    if (user?.role === 'manager') {
      return <Navigate to={user.raffleId ? `/raffles/${user.raffleId}/generate` : '/scan'} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Shareable Event Link / Manager Email-Only Login */}
            <Route path="/join/:raffleId" element={<ManagerJoinPage />} />
            <Route path="/join" element={<ManagerJoinPage />} />

            {/* Standalone Full-screen Protected Routes */}
            <Route
              path="/print-sets/:setId/preview"
              element={
                <ProtectedRoute>
                  <PrintPreviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/raffles/:raffleId/design"
              element={
                <ProtectedRoute adminOnly>
                  <TicketDesignerPage />
                </ProtectedRoute>
              }
            />

            {/* Main Application Layout Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RootRedirect />} />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute adminOnly>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="raffles" element={<RootRedirect />} />
              <Route
                path="raffles/create"
                element={
                  <ProtectedRoute adminOnly>
                    <CreateRafflePage />
                  </ProtectedRoute>
                }
              />
              <Route path="raffles/:raffleId" element={<RaffleDetailPage />} />
              <Route path="raffles/:raffleId/generate" element={<GenerateTicketsPage />} />
              <Route path="print-sets" element={<PrintSetsPage />} />
              <Route path="print-sets/:setId" element={<PrintSetDetailPage />} />
              <Route path="booklets" element={<BookletsPage />} />
              <Route path="booklets/:bookletId" element={<BookletDetailPage />} />
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
              <Route path="scan" element={<ScanPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route
                path="settings"
                element={
                  <ProtectedRoute adminOnly>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback Catch-all */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

