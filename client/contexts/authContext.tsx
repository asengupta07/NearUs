"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import Cookies from "js-cookie";
import { useRouter } from 'next/navigation';

interface AuthContextType {
  token: string | null;
  email: string | null;
  username: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, email: string, username: string) => void;
  logout: () => void;
  getToken: () => string | null;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = Boolean(token);

  // Get token utility function
  const getToken = useCallback((): string | null => {
    // First try from state
    if (token) return token;
    
    // Then try from cookie
    const cookieToken = Cookies.get("token");
    if (cookieToken) {
      setToken(cookieToken); // Update state if found in cookie
      return cookieToken;
    }
    
    return null;
  }, [token]);

  // Check authentication status
  const checkAuth = useCallback((): boolean => {
    const currentToken = getToken();
    if (!currentToken) {
      return false;
    }

    // You could add additional token validation here if needed
    // For example, check if token is expired using JWT decode
    
    return true;
  }, [getToken]);

  const login = useCallback((newToken: string, newEmail: string, newUsername: string) => {
    setToken(newToken);
    setEmail(newEmail);
    setUsername(newUsername);
    
    // Set cookies with secure flags
    Cookies.set("token", newToken, { 
      expires: 7, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    Cookies.set("email", newEmail, { 
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    Cookies.set("username", newUsername, { 
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    const pendingInviteCode = sessionStorage.getItem('pendingInviteCode');
    if (pendingInviteCode) {
      sessionStorage.removeItem('pendingInviteCode');
      router.push(`/join/${pendingInviteCode}`);
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  const logout = useCallback(() => {
    setToken(null);
    setEmail(null);
    setUsername(null);
    
    // Remove all auth-related cookies
    Cookies.remove("token");
    Cookies.remove("email");
    Cookies.remove("username");
    
    // Clear any other auth-related storage
    sessionStorage.removeItem('pendingInviteCode');
    
    router.push('/auth');
  }, [router]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const tokenFromCookie = Cookies.get("token");
        const emailFromCookie = Cookies.get("email");
        const usernameFromCookie = Cookies.get("username");

        if (tokenFromCookie && emailFromCookie && usernameFromCookie) {
          // You could add token validation here
          setToken(tokenFromCookie);
          setEmail(emailFromCookie);
          setUsername(usernameFromCookie);
        } else {
          // Clear partial auth state if any cookie is missing
          logout();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [logout]);

  // Add an effect to monitor cookie changes
  useEffect(() => {
    const checkCookies = () => {
      const cookieToken = Cookies.get("token");
      if (isAuthenticated && !cookieToken) {
        // Token was removed externally (e.g., expired or manually deleted)
        logout();
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkCookies, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider 
      value={{ 
        token, 
        email, 
        username, 
        isAuthenticated,
        isLoading,
        login, 
        logout,
        getToken,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};