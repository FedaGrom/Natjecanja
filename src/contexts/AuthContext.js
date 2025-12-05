"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to refresh admin status
  const refreshAdminStatus = useCallback(async (currentUser = user) => {
    if (!currentUser || !currentUser.uid) {
      setIsAdmin(false);
      return;
    }

    try {
      const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        const userIsAdmin = adminData.role === 'admin';
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthContext: Refreshed admin status for UID:', currentUser.uid, 'result:', userIsAdmin);
        }
        setIsAdmin(userIsAdmin);
        return userIsAdmin;
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthContext: No admin document found for UID:', currentUser.uid);
        }
        setIsAdmin(false);
        return false;
      }
    } catch (error) {
      console.error('AuthContext: Error refreshing admin status:', error);
      setIsAdmin(false);
      return false;
    }
  }, [user]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('AuthContext: Setting up auth listener');
    }
    let adminUnsubscribe = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthContext: Auth state changed:', user?.email || 'No user');
      }
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
              if (process.env.NODE_ENV === 'development') {
                console.log('AuthContext: Admin status updated via listener:', userIsAdmin);
              }
              setIsAdmin(userIsAdmin);
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.log('AuthContext: Admin document does not exist');
              }
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
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthContext: State updated - loading: false, user:', user?.email);
      }
    });

    return () => {
      unsubscribe();
      if (adminUnsubscribe) {
        adminUnsubscribe();
      }
    };
  }, []);

  const value = {
    user,
    isAdmin,
    loading,
    logout,
    refreshAdminStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}