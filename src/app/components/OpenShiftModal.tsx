import { useState } from 'react';
import { DoorOpen, DollarSign, X, AlertTriangle, CheckCircle, Loader2, FileText } from 'lucide-react';
import apiClient from '../../api/axiosConfig';

interface OpenShiftModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function OpenShiftModal({ onClose, onSuccess }: OpenShiftModalProps) {
  const [startingCash, setStartingCash] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleOpenShift = async () => {
    if (!startingCash) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiClient.post('/shifts/open/', {
        starting_cash: parseFloat(startingCash),
        notes: notes || undefined,
      });

      setSuccess(response.data.message || 'تم فتح الوردية بنجاح');
      
      // Notify parent and close modal
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'حدث خطأ أثناء فتح الوردية';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DoorOpen size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">فتح وردية جديدة</h2>
                <p className="text-sm text-green-100">
                  {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Starting Cash Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              رصيد أول الوردية <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <DollarSign size={20} className="text-green-600" />
              </div>
              <input
                type="number"
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
                disabled={loading || !!success}
                className="w-full px-4 py-4 pr-12 border-2 border-green-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-2xl font-bold text-center disabled:bg-gray-100"
                placeholder="0.00"
                dir="ltr"
                min="0"
                step="0.01"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                ج.م
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              المبلغ الافتتاحي في الصندوق بداية الوردية
            </p>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              ملاحظات (اختياري)
            </label>
            <div className="relative">
              <div className="absolute right-4 top-3">
                <FileText size={20} className="text-gray-400" />
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading || !!success}
                className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none disabled:bg-gray-100"
                placeholder="أي ملاحظات حول الوردية..."
                rows={3}
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={16} className="text-blue-600" />
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">تنبيه مهم</p>
                <p className="text-blue-600">
                  لا يمكن فتح وردية جديدة إذا كانت هناك وردية مفتوحة بالفعل. 
                  يجب إغلاق الوردية الحالية أولاً.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 pt-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 px-4 rounded-xl transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              onClick={handleOpenShift}
              disabled={!startingCash || loading || !!success}
              className="flex-[2] bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  جاري الفتح...
                </>
              ) : (
                <>
                  <DoorOpen size={20} />
                  فتح الوردية
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
