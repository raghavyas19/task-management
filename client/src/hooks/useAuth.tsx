
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // On mount, fetch latest user info if logged in
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const userId = parsedUser.userId || parsedUser.id;
          const res = await fetch(`${API_URL}/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const freshUser = await res.json();
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          } else {
            // If user not found or token invalid, logout
            logout();
          }
        } catch (err) {
          // On error, logout
          console.error('[useAuth] Error fetching user:', err);
          logout();
        }
      }
    };
    fetchCurrentUser();
    // eslint-disable-next-line
  }, []);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      if (data?.error === 'Invalid credentials.' || data?.error === 'User not found.') {
        return { success: false, error: 'User not registered.' };
      }
      return { success: false, error: data?.error || 'Login failed.' };
    } catch {
      setIsLoading(false);
      return { success: false, error: 'Login failed.' };
    }
  };

  const register = async (email: string, password: string, role: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      if (res.ok) {
        await login(email, password);
        setIsLoading(false);
        return { success: true };
      }
      const data = await res.json();
      setIsLoading(false);
      return { success: false, error: data?.error || 'Registration failed.' };
    } catch {
      setIsLoading(false);
      return { success: false, error: 'Registration failed.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};