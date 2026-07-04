// Protected Route Component
// Wrapper untuk routes yang butuh member authentication

import { Redirect, useLocation } from "wouter";
import { useMemberAuth } from "@/contexts/MemberAuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useMemberAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect ke login page, simpan current location untuk redirect back setelah login
    return <Redirect to="/member/login" />;
  }

  return <>{children}</>;
}
