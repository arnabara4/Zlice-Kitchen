"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  type: "super_admin" | "canteen" | "delivery";
  canteen_id?: string;
  logo_url?: string | null;
  home_cook?: string | null;
  is_verified?: boolean;
  verification_status?: "not_started" | "pending" | "under_review" | "verified" | "rejected";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    type: "super_admin" | "canteen",
  ) => Promise<void>;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
  isCanteen: boolean;
  isKitchen: boolean;
  isHomeKitchen: boolean;
  isVerified: boolean;
  isUnderReview: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Use ref for router to prevent login/logout from being recreated on every navigation
  const routerRef = useRef(router);
  routerRef.current = router;

  // Prevent double auth checks
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);

        // Auto-redirect if user status changes while on the verification pages
        if (data.user && data.user.type === "canteen") {
          const path = window.location.pathname;
          const isActuallyVerified = data.user.verification_status === "verified";
          
          console.log(`[AuthContext] Path: ${path}, Status: ${data.user.verification_status}, Verified: ${isActuallyVerified}`);
          
          if (isActuallyVerified && path === "/verification") {
            console.log("[AuthContext] Redirecting verified user to dashboard");
            routerRef.current.push("/dashboard");
          }
          // Removed mandatory redirect for unverified users to allow dashboard access
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Stable login handler — uses routerRef to avoid depending on router
  const login = useCallback(
    async (
      email: string,
      password: string,
      type: "super_admin" | "canteen",
    ) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include", // ✅ CRITICAL: Send and receive cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, type }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      const data = await response.json();
      setUser(data.user);

      if (data.user.type === "super_admin") {
        routerRef.current.push("/admin/canteens");
      } else {
        routerRef.current.push("/dashboard");
      }
    },
    [],
  ); // No deps — uses routerRef

  // Stable logout handler
  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    setUser(null);
    window.location.href = "/login";
  }, []);

  // Memoize context value — derive booleans inline to simplify deps
  const contextValue = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isSuperAdmin: user?.type === "super_admin",
      isCanteen: user?.type === "canteen",
      isKitchen: user?.type === "canteen" && user?.home_cook !== null && user?.home_cook !== undefined,
      isHomeKitchen: user?.type === "canteen" && user?.home_cook !== null && user?.home_cook !== undefined,
      isVerified: user?.type !== "canteen" || user?.verification_status === "verified",
      isUnderReview: user?.type === "canteen" && user?.verification_status !== "verified",
    }),
    [user, loading, login, logout],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
