import { useState, useEffect } from 'react';
import { Shield, DollarSign, CreditCard, Wallet, X, AlertTriangle, CheckCircle, Printer, Loader2 } from 'lucide-react';
import apiClient from '../../api/axiosConfig';

interface ShiftClosingModalProps {
  onClose: () => void;
}

interface ShiftData {
  id: number;
  shift_date: string;
  start_time: string;
  starting_cash: number;
  expected_cash: number | null;
  total_sales: number;
  status: 'open' | 'closed';
}

export function ShiftClosingModal({ onClose }: ShiftClosingModalProps) {
  const [actualAmount, setActualAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingShift, setFetchingShift] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [shift, setShift] = useState<ShiftData | null>(null);

  // Fetch current open shift on mount
  useEffect(() => {
    const fetchCurrentShift = async () => {
      try {
        setFetchingShift(true);
        const response = await apiClient.get('/shifts/current/');
        setShift(response.data);
        setError('');
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('لا توجد وردية مفتوحة. يرجى فتح وردية جديدة أولاً.');
        } else {
          setError('فشل في جلب بيانات الوردية. استخدام بيانات تجريبية.');
        }
      } finally {
        setFetchingShift(false);
      }
    };

    fetchCurrentShift();
  }, []);

  // Calculate expected amount from shift data or use mock data
  const startingCash = shift?.starting_cash || 0;
  const totalSales = shift?.total_sales || 0;
  
  // NOTE: These are mock calculations since real financial summary API doesn't exist yet
  // TODO: Replace with real API data when available
  const shiftData = {
    collections: {
      cash: totalSales * 0.6, // Approximate cash portion (60%)
      visa: totalSales * 0.3, // Approximate card portion (30%)
      installments: totalSales * 0.1, // Approximate installments (10%)
    },
    payments: {
      cashDisbursement: 0, // TODO: Get from Treasury API
      shiftExpenses: 0, // TODO: Get from Expenses API
    },
  };

  // Mark data as mock/temporary
  const isUsingMockData = !shift || shiftData.payments.cashDisbursement === 0;

  const totalCollections =
    shiftData.collections.cash +
    shiftData.collections.visa +
    shiftData.collections.installments;
  const totalPayments = shiftData.payments.cashDisbursement + shiftData.payments.shiftExpenses;
  const expectedAmount = shift && (shift.expected_cash || 0) > 0 
    ? shift.expected_cash 
    : (startingCash + totalCollections - totalPayments);

  const actualAmountNumber = parseFloat(actualAmount) || 0;
  const difference = actualAmountNumber - (expectedAmount || 0);
  const hasDiscrepancy = actualAmountNumber > 0 && difference !== 0;

  // Handle shift close
  const handleCloseShift = async () => {
    if (!shift || !actualAmount) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiClient.post(`/shifts/${shift.id}/close/`, {
        actual_cash: parseFloat(actualAmount),
        notes: notes || undefined,
      });

      setSuccess(response.data.message || 'تم إغلاق الوردية بنجاح');
      
      // Wait a moment then close modal
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'حدث خطأ أثناء إغلاق الوردية';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingShift) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex items-center gap-3">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-lg font-semibold">جاري تحميل بيانات الوردية...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#1E293B] to-[#334155] text-white p-6 rounded-t-2xl border-b-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Shield size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">تقرير غلق الوردية</h2>
                <p className="text-sm text-gray-300">
                  {shift ? `وردية يوم ${new Date(shift.shift_date).toLocaleDateString('ar-EG')}` : 'بيانات تجريبية'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle size={20} />
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle size={20} />
              <span className="font-semibold">{success}</span>
            </div>
          </div>
        )}

        {/* Mock Data Warning */}
        {isUsingMockData && (
          <div className="mx-6 mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700 text-sm">
              <AlertTriangle size={16} />
              <span>⚠️ البيانات المالية التالية تقريبية - سيتم دمج البيانات الحقيقية لاحقاً</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Financial Breakdown - Collections */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-5">
            <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-green-600" />
              المقبوضات
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Wallet size={20} className="text-green-600" />
                  </div>
                  <span className="font-bold text-gray-800">كاش</span>
                </div>
                <span className="text-xl font-bold text-green-700">
                  {shiftData.collections.cash.toLocaleString()} ج.م
                </span>
              </div>

              <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-blue-600" />
                  </div>
                  <span className="font-bold text-gray-800">فيزا</span>
                </div>
                <span className="text-xl font-bold text-blue-700">
                  {shiftData.collections.visa.toLocaleString()} ج.م
                </span>
              </div>

              <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-emerald-600" />
                  </div>
                  <span className="font-bold text-gray-800">أقساط محصلة</span>
                </div>
                <span className="text-xl font-bold text-emerald-700">
                  {shiftData.collections.installments.toLocaleString()} ج.م
                </span>
              </div>

              <div className="flex items-center justify-between bg-green-600 rounded-lg p-4 mt-4">
                <span className="font-bold text-white text-lg">إجمالي المقبوضات</span>
                <span className="text-2xl font-bold text-white">
                  {totalCollections.toLocaleString()} ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown - Payments */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200 p-5">
            <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-red-600" />
              المدفوعات
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Wallet size={20} className="text-red-600" />
                  </div>
                  <span className="font-bold text-gray-800">إذن صرف نقدية</span>
                </div>
                <span className="text-xl font-bold text-red-700">
                  {shiftData.payments.cashDisbursement.toLocaleString()} ج.م
                </span>
              </div>

              <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <DollarSign size={20} className="text-orange-600" />
                  </div>
                  <span className="font-bold text-gray-800">مصروفات وردية</span>
                </div>
                <span className="text-xl font-bold text-orange-700">
                  {shiftData.payments.shiftExpenses.toLocaleString()} ج.م
                </span>
              </div>

              <div className="flex items-center justify-between bg-red-600 rounded-lg p-4 mt-4">
                <span className="font-bold text-white text-lg">إجمالي المدفوعات</span>
                <span className="text-2xl font-bold text-white">
                  {totalPayments.toLocaleString()} ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Reconciliation Section */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border-2 border-slate-300 p-5">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-slate-600" />
              المطابقة
            </h3>

            <div className="space-y-4">
              {/* Expected Amount */}
              <div className="bg-white rounded-lg p-4 border-2 border-slate-300">
                <div className="text-sm text-gray-600 mb-1">المبلغ المفترض وجوده</div>
                <div className="text-3xl font-bold text-[#1E293B]">
                  {(expectedAmount || 0).toLocaleString()} <span className="text-lg">ج.م</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  (رصيد أول الوردية: {startingCash.toLocaleString()} ج.م + المقبوضات - المدفوعات)
                </div>
              </div>

              {/* Actual Amount Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  المبلغ الفعلي المستلم <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={actualAmount}
                    onChange={(e) => setActualAmount(e.target.value)}
                    disabled={loading || !!success}
                    className="w-full px-4 py-4 pl-12 border-2 border-[#3B82F6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-2xl font-bold disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="أدخل المبلغ الفعلي"
                    dir="ltr"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    ج.م
                  </span>
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading || !!success}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] resize-none disabled:bg-gray-100"
                  placeholder="أي ملاحظات حول الوردية..."
                  rows={2}
                />
              </div>

              {/* Difference Display */}
              {actualAmountNumber > 0 && (
                <div
                  className={`rounded-xl p-4 border-2 ${
                    difference === 0
                      ? 'bg-green-50 border-green-500'
                      : difference > 0
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {difference === 0 ? (
                        <CheckCircle size={24} className="text-green-600" />
                      ) : (
                        <AlertTriangle size={24} className={difference > 0 ? 'text-blue-600' : 'text-red-600'} />
                      )}
                      <span
                        className={`font-bold ${
                          difference === 0
                            ? 'text-green-900'
                            : difference > 0
                            ? 'text-blue-900'
                            : 'text-red-900'
                        }`}
                      >
                        {difference === 0 ? 'متطابق تماماً' : difference > 0 ? 'زيادة' : 'عجز'}
                      </span>
                    </div>
                    <span
                      className={`text-2xl font-bold ${
                        difference === 0
                          ? 'text-green-700'
                          : difference > 0
                          ? 'text-blue-700'
                          : 'text-red-700'
                      }`}
                    >
                      {difference !== 0 && (difference > 0 ? '+' : '')}
                      {difference !== 0 && `${Math.abs(difference).toLocaleString()} ج.م`}
                      {difference === 0 && '✓'}
                    </span>
                  </div>
                  {hasDiscrepancy && (
                    <div className="mt-2 text-xs text-gray-600">
                      يرجى مراجعة الحسابات وتوضيح سبب {difference > 0 ? 'الزيادة' : 'العجز'} في الملاحظات
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t-2 border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 px-4 rounded-xl transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              onClick={handleCloseShift}
              disabled={!actualAmount || loading || !!success || !shift}
              className="flex-[2] bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  جاري الإغلاق...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  تأكيد غلق الوردية وطباعة التقرير
                  <Printer size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
