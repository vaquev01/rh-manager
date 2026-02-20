"use client";

import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AuthProvider, useAuth } from "@/components/auth-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { PageSkeleton } from "@/components/loading-skeleton";
import { AppFrame } from "@/components/app-frame";
import { AppStateProvider } from "@/components/state-provider";
import { ToastProvider } from "@/components/toast";

function AuthGuardedShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  // Public routes — render directly without AppFrame
  const isPublic = pathname === "/landing" || pathname === "/login";
  if (isPublic) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  // Show loading skeleton while checking auth
  if (loading) {
    return <PageSkeleton />;
  }

  // If not logged in, redirect to landing
  if (!user) {
    router.replace("/landing");
    return <PageSkeleton />;
  }

  // Authenticated app routes
  return (
    <AppStateProvider>
      <ToastProvider>
        <ErrorBoundary>
          <AppFrame>{children}</AppFrame>
        </ErrorBoundary>
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
