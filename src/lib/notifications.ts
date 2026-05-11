import { toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-100",
  error: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100",
  warning: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100",
  info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100",
};

export const notify = {
  success: (title: string, options?: NotificationOptions) => {
    toast.success(title, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
      className: styles.success,
    });
  },

  error: (title: string, options?: NotificationOptions) => {
    toast.error(title, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
      className: styles.error,
    });
  },

  warning: (title: string, options?: NotificationOptions) => {
    toast.warning(title, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
      className: styles.warning,
    });
  },

  info: (title: string, options?: NotificationOptions) => {
    toast.info(title, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
      className: styles.info,
    });
  },

  // For promise-based notifications
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },

  // Dismiss all notifications
  dismiss: () => {
    toast.dismiss();
  },
};

// Helper function to format error messages
export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "حدث خطأ غير متوقع";
};

// Common notification messages in Arabic
export const messages = {
  auth: {
    sessionExpired: "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى",
    noPermission: "ليس لديك صلاحية لتنفيذ هذا الإجراء",
    unauthorized: "غير مصرح لك بهذه العملية",
  },
  cart: {
    empty: "السلة فارغة!",
    barcodeNotFound: (barcode: string) => `باركود غير موجود: ${barcode}`,
    enterInstallmentDownPayment: "برجاء إدخال المقدم (يمكن أن يكون صفر)",
    enterCustomerInfo: "يجب إدخال اسم ورقم هاتف العميل قبل إتمام البيع",
    invalidPhone: "رقم الهاتف غير صحيح (يجب أن يكون بين 10 و 15 رقم)",
    saleComplete: (invoiceNumber: string, amount: number, paymentMethod: string) =>
      `تم البيع! رقم الفاتورة: ${invoiceNumber}، الإجمالي: ${amount} ج.م، طريقة الدفع: ${paymentMethod}`,
  },
  inventory: {
    stockUpdated: (productName: string, newStock: number) =>
      `تم تحديث المخزون: ${productName}، الكمية الجديدة: ${newStock}`,
    stockUpdateFailed: "فشل تحديث المخزون",
    deleteConfirm: "هل أنت متأكد من حذف هذا المنتج؟",
    deleteSuccess: "تم الحذف بنجاح",
    deleteFailed: "حدث خطأ أثناء الحذف",
  },
  product: {
    saveSuccess: "تم حفظ المنتج في قاعدة البيانات بنجاح!",
    saveFailed: "فشل حفظ المنتج",
    serverError: "خطأ من السيرفر",
    checkServer: "تأكد من تشغيل سيرفر Django (المنفذ 8000)",
  },
  invoice: {
    emptyCart: "سلة البيع فارغة!",
    saveSuccess: "تم تسجيل الفاتورة بنجاح وتحديث الخزينة والمخزون!",
    serverError: "خطأ من السيرفر",
    connectionError: "فشل الاتصال بالسيرفر! تأكد من تشغيل Django على بورت 8000",
  },
  credit: {
    collectionFailed: "حدث خطأ أثناء التحصيل",
  },
  expense: {
    genericError: "حدث خطأ، يرجى المحاولة مرة أخرى",
  },
  hr: {
    attendanceSaved: "تم حفظ سجلات الحضور بنجاح",
    payrollCreated: "تم إنشاء مسير الرواتب بنجاح",
  },
  report: {
    creationFailed: (error?: string) =>
      error ? `خطأ في إنشاء التقرير: ${error}` : "فشل إنشاء التقرير",
    downloadFailed: "حدث خطأ أثناء تحميل PDF",
  },
};
