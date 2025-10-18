"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/config";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('AuthContext: Auth state changed:', user?.email || 'No user');
      console.log('AuthContext: User object:', user);
      setUser(user);
      setIsAdmin(!!user); // All logged in users are admin for now
      setLoading(false);
      console.log('AuthContext: State updated - loading: false, user:', user?.email, 'isAdmin:', !!user);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    user,
    isAdmin,
    loading,
    logout,
  };

  console.log('AuthContext: Rendering with state:', { 
    user: user?.email || 'null', 
    isAdmin, 
    loading,
    hasUser: !!user 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  console.log('useAuth: context received:', context);
  if (!context) {
    console.error('useAuth: No context found! AuthProvider missing?');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  console.log('useAuth: returning context:', context);
  return context;
}