import { useState } from 'react';
import { Shield, DollarSign, X, CheckCircle, LogIn } from 'lucide-react';
import apiClient from '../../api/axiosConfig';

interface ShiftOpeningModalProps {
  onShiftStarted: (shiftData: any) => void;
}

export function ShiftOpeningModal({ onShiftStarted }: ShiftOpeningModalProps) {
  const [startingCash, setStartingCash] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // دالة لبدء الوردية وإرسال البيانات للباك إند
  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // إرسال طلب لفتح وردية جديدة بـ الرصيد الافتتاحي
      const response = await apiClient.post('shifts/', {
        starting_cash: parseFloat(startingCash) || 0,
      });

      if (response.status === 201) {
        // نجاح العملية، نمرر بيانات الوردية للـ App.tsx
        onShiftStarted(response.data);
      }
    } catch (err: any) {
      console.error("Shift opening error:", err);
      setError(err.response?.data?.error || 'فشل فتح الوردية، تأكد من اتصال السيرفر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header - واجهة المودال */}
        <div className="bg-gradient-to-r from-[#1E293B] to-[#334155] p-6 text-white relative">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <Shield size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold">بدء وردية جديدة</h2>
            <p className="text-blue-200 text-sm">برجاء إدخال العجز/الزيادة أو الرصيد الافتتاحي</p>
          </div>
        </div>

        {/* Body - محتوى المودال */}
        <div className="p-8">
          <form onSubmit={handleStartShift} className="space-y-6">
            
            {/* حقل إدخال الرصيد الافتتاحي */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 text-right">
                النقدية الافتتاحية (العهدة)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={startingCash}
                  onChange={(e) => setStartingCash(e.target.value)}
                  className="w-full px-5 py-4 pr-12 text-2xl font-bold bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-center"
                  placeholder="0.00"
                  required
                  autoFocus
                />
                <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500" size={24} />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-r-4 border-red-500 rounded-lg flex items-center gap-3 animate-shake">
                <span className="text-red-700 text-sm font-bold">{error}</span>
              </div>
            )}

            {/* أزرار التحكم */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={22} />
                    تأكيد وفتح الوردية
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer - ملاحظة أمان */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <LogIn size={12} />
            سيتم تسجيل وقت البدء والموظف الحالي تلقائياً
          </p>
        </div>
      </div>
    </div>
  );
}
