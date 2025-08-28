"use client";

import { useEffect } from "react";
import { initAuth } from "../../../utils/auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component that initializes authentication state on app startup
 * This component should wrap the entire app to ensure auth tokens are restored from storage
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    // Initialize authentication state from localStorage on app startup
    // This restores the user's session if they have a valid token
    initAuth();
  }, []);

  return <>{children}</>;
}
