"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { initAuth, isAuthenticated } from "../../../utils/auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component that initializes authentication state on app startup
 * and enforces route protection for pages that require login
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  // routes need to login 
  const protectedRoutes = ["/profile", "/orders", "/lending", "/borrowing", 
    "/cart", "/checkout",
    "/message", "/shipping", "/complain"
  ];

  // Special rule: only protect sub-routes under /books (e.g. /books/123)
  const isProtectedRoute = (pathname: string) => {
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
      return true;
    }
    // Protect /books/* but NOT /books itself
    if (pathname.startsWith("/books/") && pathname !== "/books") {
      return true;
    }
    return false;
  };

  useEffect(() => {
    const checkAuth = async () => {
      initAuth();

      if (isProtectedRoute(pathname)) {
        const authed = await isAuthenticated();
        if (!authed) {
          router.replace("/auth");
          return;
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [pathname, router]);


  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return <>{children}</>;
}
