"use client";

import { Toaster } from "@/app/components/ui/sonner";
import { ReactNode } from "react";

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          style: {
            direction: "rtl",
            fontFamily: "system-ui, -apple-system, sans-serif",
          },
        }}
      />
    </>
  );
}
