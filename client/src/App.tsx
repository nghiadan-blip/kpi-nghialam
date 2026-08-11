import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Evaluations } from './pages/Evaluations';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <Tasks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/evaluations"
                element={
                  <ProtectedRoute>
                    <Evaluations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
            © 2026 UBND Xã Nghĩa Lâm — Khung Đánh giá & Xếp loại Cán bộ Công chức theo NĐ 335/2025/NĐ-CP.
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
