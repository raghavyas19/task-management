import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import { ToastContainer } from './components/UI/Toast';
import Navbar from './components/Layout/Navbar';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import Dashboard from './components/Dashboard/Dashboard';
import UserManagement from './components/Users/UserManagement';
import LoadingSpinner from './components/UI/LoadingSpinner';


import { useNavigate } from 'react-router-dom';

const AuthRoutes: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth?.user;

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Routes>
      <Route path="login" element={<LoginForm onNavigate={(page) => {
        if (page === 'register') navigate('/auth/register');
        else navigate('/dashboard');
      }} />} />
      <Route path="register" element={<RegisterForm onNavigate={(page) => {
        if (page === 'login') navigate('/auth/login');
        else navigate('/dashboard');
      }} />} />
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
};

// Protected route wrapper
const ProtectedRoute: React.FC<{ adminOnly?: boolean }> = ({ adminOnly = false }) => {
  const auth = useAuth();
  const user = auth?.user;
  const isLoading = auth?.isLoading ?? false;
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // If not logged in, prevent access to protected routes
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-red-600 text-lg mb-4">Access Denied</div>
          <p className="text-gray-600">
            You don't have permission to access this page. Administrator access is required.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Auth routes */}
            <Route path="/auth/*" element={<AuthRoutes />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/dashboard"
                element={
                  <>
                    <Navbar />
                    <main className="pt-16">
                      <Dashboard />
                    </main>
                  </>
                }
              />
            </Route>
            <Route element={<ProtectedRoute adminOnly />}> 
              <Route
                path="/users"
                element={
                  <>
                    <Navbar />
                    <main className="pt-16">
                      <UserManagement />
                    </main>
                  </>
                }
              />
            </Route>
            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <ToastContainer />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;