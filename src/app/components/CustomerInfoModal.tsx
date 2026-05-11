import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import apiClient from '../../api/axiosConfig';

export interface CustomerData {
  name: string;
  phone: string;
  email: string;
  customerId: number | null;
}

interface SearchResult {
  id: number;
  name: string;
  phone: string;
  email: string | null;
}

interface CustomerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: CustomerData) => void;
  paymentType: string;
  totalAmount: number;
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  cash: 'دفع نقدي / إلكتروني',
  vodafone_cash: 'دفع نقدي / إلكتروني',
  instapay: 'دفع نقدي / إلكتروني',
  card: 'دفع نقدي / إلكتروني',
  credit: 'بيع آجل',
  installment: 'بيع بالتقسيط',
};

export default function CustomerInfoModal({
  isOpen,
  onClose,
  onConfirm,
  paymentType,
  totalAmount,
}: CustomerInfoModalProps) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; name?: string }>({});

  const phoneRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  // Auto-focus phone on open and reset state
  useEffect(() => {
    if (isOpen) {
      setPhone('');
      setName('');
      setEmail('');
      setCustomerId(null);
      setSearchResults([]);
      setShowDropdown(false);
      setErrors({});
      const t = setTimeout(() => phoneRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handlePhoneChange = useCallback((value: string) => {
    setPhone(value);
    setCustomerId(null);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    const digits = value.replace(/\D/g, '');
    if (digits.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/customers/search/?phone=${digits}`);
        setSearchResults(res.data);
        setShowDropdown(res.data.length > 0);
      } catch {
        setSearchResults([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, []);

  const handleSelectCustomer = (customer: SearchResult) => {
    setPhone(customer.phone);
    setName(customer.name);
    setEmail(customer.email ?? '');
    setCustomerId(customer.id);
    setShowDropdown(false);
    setSearchResults([]);
    setErrors({});
    nameRef.current?.focus();
  };

  const handleConfirm = () => {
    const newErrors: { phone?: string; name?: string } = {};
    const digits = phone.replace(/\D/g, '');

    if (!digits || digits.length < 10 || digits.length > 15) {
      newErrors.phone = 'رقم الهاتف يجب أن يكون بين 10 و 15 رقم';
    }
    if (name.trim().length < 2) {
      newErrors.name = 'اسم العميل يجب أن يكون حرفين على الأقل';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onConfirm({ name: name.trim(), phone: digits, email: email.trim(), customerId });
    onClose();
  };

  // Focus trap + ESC
  const handleOverlayKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;

    const focusable = [phoneRef, nameRef, emailRef, confirmRef, cancelRef]
      .map((r) => r.current)
      .filter((el): el is HTMLInputElement | HTMLButtonElement => el !== null);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const phoneDigits = phone.replace(/\D/g, '');
  const isNewCustomer =
    phoneDigits.length >= 10 &&
    searchResults.length === 0 &&
    !isSearching &&
    customerId === null;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        onKeyDown={handleOverlayKeyDown}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 relative"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-label="بيانات العميل"
          style={{ animation: 'customerModalIn 0.18s ease-out' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">بيانات العميل</h2>
            <p className="text-sm text-blue-600 font-medium mt-1">
              {PAYMENT_TYPE_LABELS[paymentType] ?? 'دفع نقدي / إلكتروني'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              الإجمالي:{' '}
              <span className="font-bold text-gray-800">
                {totalAmount.toFixed(2)} ج.م
              </span>
            </p>
          </div>

          {/* Phone field */}
          <div className="mb-4 relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              رقم الهاتف *
            </label>
            <div className="relative">
              <input
                ref={phoneRef}
                type="tel"
                dir="ltr"
                placeholder="01xxxxxxxxx"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  errors.phone
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-400'
                }`}
              />
              {isSearching && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                </div>
              )}
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
            )}
            {isNewCustomer && (
              <p className="mt-1 text-xs text-green-600 font-medium">
                عميل جديد — سيتم إنشاؤه تلقائياً
              </p>
            )}
            {/* Search results dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-10 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg w-full max-h-48 overflow-y-auto">
                {searchResults.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className="w-full text-right px-4 py-2.5 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <span className="font-semibold text-gray-800">{c.name}</span>
                    <span className="text-gray-500 mx-1">—</span>
                    <span className="text-gray-600 text-xs" dir="ltr">
                      {c.phone}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Name field */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              اسم العميل *
            </label>
            <input
              ref={nameRef}
              type="text"
              placeholder="الاسم الكامل"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') emailRef.current?.focus();
              }}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.name
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-200 focus:border-blue-400'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email field */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              البريد الإلكتروني (اختياري)
            </label>
            <input
              ref={emailRef}
              type="email"
              dir="ltr"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Confirm button */}
          <button
            ref={confirmRef}
            onClick={handleConfirm}
            disabled={isSearching}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إتمام البيع ✓
          </button>

          {/* Cancel button */}
          <button
            ref={cancelRef}
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-2 mt-2 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
      <style>{`
        @keyframes customerModalIn {
          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </>
  );
}
