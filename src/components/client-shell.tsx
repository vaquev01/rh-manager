"use client";

import { ReactNode } from "react";

import { AppFrame } from "@/components/app-frame";
import { AppStateProvider } from "@/components/state-provider";
import { ToastProvider } from "@/components/toast";

export function ClientShell({ children }: { children: ReactNode }) {
  return (
    <AppStateProvider>
      <ToastProvider>
        <AppFrame>{children}</AppFrame>
      </ToastProvider>
    </AppStateProvider>
  );
}
