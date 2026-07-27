import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicPage } from './pages/PublicPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { WakasekDashboard } from './pages/WakasekDashboard';
import { KepalaSekolahDashboard } from './pages/KepalaSekolahDashboard';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<PublicPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wakasek"
                element={
                  <ProtectedRoute allowedRoles={['WAKASEK', 'ADMIN']}>
                    <WakasekDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/kepala-sekolah"
                element={
                  <ProtectedRoute allowedRoles={['KEPALA_SEKOLAH', 'ADMIN']}>
                    <KepalaSekolahDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
