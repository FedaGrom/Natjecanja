"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthContext: Auth state changed:', user?.email || 'No user');
      console.log('AuthContext: User object:', user);
      setUser(user);
      
      // Check if user is admin by looking in Firestore admins collection
      let userIsAdmin = false;
      if (user && user.uid) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            userIsAdmin = adminData.role === 'admin';
            console.log('AuthContext: Checking admin status in Firestore for UID:', user.uid, 'data:', adminData, 'result:', userIsAdmin);
          } else {
            console.log('AuthContext: No admin document found for UID:', user.uid);
          }
        } catch (error) {
          console.error('AuthContext: Error checking admin status:', error);
          userIsAdmin = false;
        }
      }
      
      console.log('AuthContext: Checking admin status for UID:', user?.uid, 'email:', user?.email, 'result:', userIsAdmin);
      setIsAdmin(userIsAdmin);
      
      setLoading(false);
      console.log('AuthContext: State updated - loading: false, user:', user?.email, 'isAdmin:', userIsAdmin);
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