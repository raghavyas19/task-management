import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import { ToastContainer } from './components/UI/Toast';
import Navbar from './components/Layout/Navbar';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import Dashboard from './components/Dashboard/Dashboard';
import UserManagement from './components/Users/UserManagement';
import LoadingSpinner from './components/UI/LoadingSpinner';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Show loading spinner during authentication check
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

  // Show authentication forms if user is not logged in
  if (!user) {
    if (currentPage === 'register') {
      return <RegisterForm onNavigate={setCurrentPage} />;
    }
    return <LoginForm onNavigate={setCurrentPage} />;
  }

  // Main application layout for authenticated users
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      
      <main className="pt-16">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'users' && user.role === 'admin' && <UserManagement />}
        
        {/* Fallback for invalid pages or unauthorized access */}
        {currentPage === 'users' && user.role !== 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-red-600 text-lg mb-4">Access Denied</div>
              <p className="text-gray-600">
                You don't have permission to access this page. Administrator access is required.
              </p>
              <button
                onClick={() => setCurrentPage('dashboard')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;