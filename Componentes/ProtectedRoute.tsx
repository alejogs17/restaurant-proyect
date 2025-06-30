"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserRoleContext } from "@/hooks/UserRoleContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Ej: ["admin", "cashier"]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, role, loading } = useUserRoleContext();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/auth/login");
      } else if (allowedRoles && !allowedRoles.includes(role ?? "")) {
        alert("No autorizado");
        router.replace("/not-authorized");
      }
    }
  }, [user, role, loading, allowedRoles, router]);

  if (loading) return <div>Cargando...</div>;
  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(role ?? "")) {
    alert("No autorizado");
    return null;
  }

  return <>{children}</>;
} 