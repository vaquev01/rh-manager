"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AuthProvider, useAuth } from "@/components/auth-context";
import { AppFrame } from "@/components/app-frame";
import { AppStateProvider } from "@/components/state-provider";
import { ToastProvider } from "@/components/toast";

function AuthGuardedShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Public routes — render directly without AppFrame
  const isPublic = pathname === "/landing" || pathname === "/login";
  if (isPublic) {
    return <>{children}</>;
  }

  // If not logged in, redirect to landing
  if (!user) {
    // We can't use router.push in render, so show landing redirect
    if (typeof window !== "undefined") {
      window.location.href = "/landing";
    }
    return null;
  }

  // Authenticated app routes
  return (
    <AppStateProvider>
      <ToastProvider>
        <AppFrame>{children}</AppFrame>
      </ToastProvider>
    </AppStateProvider>
  );
}

export function ClientShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuardedShell>{children}</AuthGuardedShell>
    </AuthProvider>
  );
}
