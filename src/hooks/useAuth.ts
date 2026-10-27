"use client";

import { useEffect, useState } from "react";

export type Role = "admin" | "editor" | "viewer";

interface AuthState {
  userId: string | null;
  email: string | null;
  role: Role;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    userId: null,
    email: null,
    role: "viewer",
    loading: true,
  });

  useEffect(() => {
    // Check auth status on mount
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/status");
        if (response.ok) {
          const data = await response.json();
          setAuthState({
            userId: data.userId,
            email: data.email,
            role: data.role || "viewer",
            loading: false,
          });
        } else {
          setAuthState((prev) => ({ ...prev, loading: false }));
        }
      } catch {
        setAuthState((prev) => ({ ...prev, loading: false }));
      }
    }
    checkAuth();
  }, []);

  const isAdmin = authState.role === "admin";
  const isEditor = authState.role === "editor" || isAdmin;

  return {
    userId: authState.userId,
    email: authState.email,
    role: authState.role,
    loading: authState.loading,
    isAdmin,
    isEditor,
    isStaff: isAdmin || isEditor,
  };
}
