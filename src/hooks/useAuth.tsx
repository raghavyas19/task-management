import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, User } from '../types';
import { mockUsers } from '../utils/constants';

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, role: 'user' | 'admin') => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('authUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock authentication
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser && password.length >= 6) {
      const authUser: AuthUser = {
        ...foundUser,
        token: `mock-token-${foundUser.id}`
      };
      
      setUser(authUser);
      localStorage.setItem('authUser', JSON.stringify(authUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const register = async (email: string, password: string, role: 'user' | 'admin'): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check if email already exists
    if (mockUsers.some(u => u.email === email)) {
      setIsLoading(false);
      return false;
    }
    
    // Mock registration
    if (password.length >= 6 && email.includes('@')) {
      const newUser: User = {
        id: String(Date.now()),
        email,
        role,
        createdAt: new Date().toISOString()
      };
      
      const authUser: AuthUser = {
        ...newUser,
        token: `mock-token-${newUser.id}`
      };
      
      // In real app, would add to backend
      mockUsers.push(newUser);
      
      setUser(authUser);
      localStorage.setItem('authUser', JSON.stringify(authUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};