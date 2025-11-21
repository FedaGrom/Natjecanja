"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to refresh admin status
  const refreshAdminStatus = async (currentUser = user) => {
    if (!currentUser || !currentUser.uid) {
      setIsAdmin(false);
      return;
    }

    try {
      const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        const userIsAdmin = adminData.role === 'admin';
        console.log('AuthContext: Refreshed admin status for UID:', currentUser.uid, 'result:', userIsAdmin);
        setIsAdmin(userIsAdmin);
        return userIsAdmin;
      } else {
        console.log('AuthContext: No admin document found for UID:', currentUser.uid);
        setIsAdmin(false);
        return false;
      }
    } catch (error) {
      console.error('AuthContext: Error refreshing admin status:', error);
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth listener');
    let adminUnsubscribe = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthContext: Auth state changed:', user?.email || 'No user');
      setUser(user);
      
      // Clean up previous admin listener
      if (adminUnsubscribe) {
        adminUnsubscribe();
        adminUnsubscribe = null;
      }
      
      if (user && user.uid) {
        // Set up real-time listener for admin status
        adminUnsubscribe = onSnapshot(
          doc(db, 'admins', user.uid),
          (doc) => {
            if (doc.exists()) {
              const adminData = doc.data();
              const userIsAdmin = adminData.role === 'admin';
              console.log('AuthContext: Admin status updated via listener:', userIsAdmin);
              setIsAdmin(userIsAdmin);
            } else {
              console.log('AuthContext: Admin document does not exist');
              setIsAdmin(false);
            }
          },
          (error) => {
            console.error('AuthContext: Error in admin listener:', error);
            setIsAdmin(false);
          }
        );
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
      console.log('AuthContext: State updated - loading: false, user:', user?.email);
    });

    return () => {
      unsubscribe();
      if (adminUnsubscribe) {
        adminUnsubscribe();
      }
    };
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
    refreshAdminStatus, // Export this function so it can be called from other components
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