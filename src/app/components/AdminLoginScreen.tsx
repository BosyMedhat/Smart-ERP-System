import { useState } from 'react';
import { Shield, User, Lock, Eye, EyeOff } from 'lucide-react';
import apiClient from '../../api/axiosConfig';
import { storeUser, ROLES } from '../../auth';
import { useTranslation } from 'react-i18next';

interface AdminLoginScreenProps {
  onLogin: (user: any) => void;
  onGoToEmployeeLogin: () => void;
}

export function AdminLoginScreen({ onLogin, onGoToEmployeeLogin }: AdminLoginScreenProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/login/', { username, password });
      const data = response.data;
      if (data.token) {
        // التحقق أن المستخدم مدير فقط
        if (data.role !== ROLES.MANAGER) {
          setError('هذه البوابة للمديرين فقط. يرجى استخدام بوابة الموظفين.');
          setLoading(false);
          return;
        }
        storeUser(data);
        onLogin(data);
      } else {
        setError(data.error || 'بيانات الدخول غير صحيحة');
      }
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">بوابة المدير</h1>
          <p className="text-blue-300 text-sm">Admin Portal — وصول كامل للنظام</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                اسم المستخدم
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pr-10 pl-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  placeholder="أدخل اسم المستخدم"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pr-10 pl-10 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  placeholder="أدخل كلمة المرور"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-white">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-sm text-center">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30">
              {loading ? 'جاري الدخول...' : 'دخول بوابة المدير'}
            </button>

          </form>

          {/* Switch to Employee */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-blue-300 text-sm mb-3">لست مديراً؟</p>
            <button
              onClick={onGoToEmployeeLogin}
              className="text-blue-400 hover:text-white text-sm font-medium underline underline-offset-4 transition-colors">
              الدخول كموظف ←
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-400/50 text-xs mt-6">
          Smart ERP System — Secured Admin Access
        </p>
      </div>
    </div>
  );
}
