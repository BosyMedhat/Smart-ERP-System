"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { ReactNode, useState, useCallback } from "react";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

type ConfirmResolve = (value: boolean) => void;

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions;
  resolve: ConfirmResolve | null;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    options: { title: "" },
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [state.resolve]);

  const ConfirmDialogComponent = (
    <AlertDialog open={state.isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent className="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right text-lg font-bold">
            {state.options.title}
          </AlertDialogTitle>
          {state.options.description && (
            <AlertDialogDescription className="text-right text-base leading-relaxed">
              {state.options.description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              state.options.variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-[#0d9488] hover:bg-[#0f766d] text-white"
            }
          >
            {state.options.confirmLabel || "تأكيد"}
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={handleCancel}
            className="bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300"
          >
            {state.options.cancelLabel || "إلغاء"}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}

// Standalone ConfirmDialog for direct usage
interface StandaloneConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  variant = "default",
}: StandaloneConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rtl max-w-md">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-right text-xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-right text-base leading-relaxed text-gray-600 dark:text-gray-300">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-3 sm:justify-start mt-6">
          <AlertDialogAction
            onClick={onConfirm}
            className={
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-all"
                : "bg-[#0d9488] hover:bg-[#0f766d] text-white px-6 py-2 rounded-lg font-medium transition-all"
            }
          >
            {confirmLabel}
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300 px-6 py-2 rounded-lg font-medium transition-all"
          >
            {cancelLabel}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
