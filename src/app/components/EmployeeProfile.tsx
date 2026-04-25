import { useState, useEffect } from 'react';
import { LogOut, User, Mail, Calendar, Shield } from 'lucide-react';
import apiClient from '../../api/axiosConfig';

interface UserData {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  date_joined?: string;
  sidebar_permissions?: string[];
  permissions?: Record<string, string[]>;
}

interface EmployeeProfileProps {
  onLogout?: () => void;
}

export function EmployeeProfile({ onLogout }: EmployeeProfileProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('erp_user');
    if (!savedUser) {
      setError('لم يتم العثور على بيانات المستخدم');
      setLoading(false);
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    const userId = parsedUser.id || parsedUser.user_id;

    if (!userId) {
      setUserData(parsedUser);
      setLoading(false);
      return;
    }

    // Fetch full user data from API
    apiClient.get(`/users/${userId}/`)
      .then(response => {
        setUserData(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching user data:', err);
        setUserData(parsedUser);
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('erp_user');
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  const getDisplayName = () => {
    if (!userData) return 'المستخدم';
    const first = userData.first_name || '';
    const last = userData.last_name || '';
    if (first || last) {
      return `${first} ${last}`.trim();
    }
    return userData.username || 'المستخدم';
  };

  const getRoleDisplay = () => {
    const role = userData?.role || 'كاشير';
    const roleMap: Record<string, string> = {
      'admin': 'مدير',
      'manager': 'مشرف',
      'cashier': 'كاشير',
      'مدير': 'مدير',
      'مشرف': 'مشرف',
      'كاشير': 'كاشير',
    };
    return roleMap[role] || role;
  };

  const getPermissions = (): string[] => {
    if (userData?.sidebar_permissions) {
      return userData.sidebar_permissions;
    }
    if (userData?.permissions) {
      return Object.keys(userData.permissions);
    }
    return [];
  };

  const getPermissionBadgeColor = (perm: string): string => {
    const colors: Record<string, string> = {
      'dashboard': 'bg-blue-500',
      'pos': 'bg-green-500',
      'inventory': 'bg-orange-500',
      'sales': 'bg-purple-500',
      'installments': 'bg-pink-500',
      'representatives': 'bg-indigo-500',
      'quotations': 'bg-teal-500',
      'employees': 'bg-yellow-500',
      'ai': 'bg-cyan-500',
      'automation': 'bg-lime-500',
      'users': 'bg-red-500',
      'settings': 'bg-gray-500',
      'reports': 'bg-emerald-500',
    };
    return colors[perm] || 'bg-slate-500';
  };

  const getInitial = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-slate-400">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  const permissions = getPermissions();

  return (
    <div className="flex-1 bg-slate-900 p-6 overflow-auto">
      <div className="max-w-lg mx-auto mt-10">
        {/* Profile Card */}
        <div className="bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header / Avatar Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center">
            <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 mb-4 shadow-lg">
              {getInitial()}
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {getDisplayName()}
            </h1>
            <p className="text-blue-200">@{userData?.username}</p>
            <div className="mt-3 inline-block px-4 py-1 bg-white/20 rounded-full">
              <span className="text-white text-sm font-medium">
                الدور: {getRoleDisplay()}
              </span>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-6 space-y-4">
            {/* Email & Date Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Mail size={16} />
                  <span className="text-xs">البريد الإلكتروني</span>
                </div>
                <p className="text-white text-sm truncate">
                  {userData?.email || 'غير متوفر'}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Calendar size={16} />
                  <span className="text-xs">تاريخ الانضمام</span>
                </div>
                <p className="text-white text-sm">
                  {userData?.date_joined 
                    ? new Date(userData.date_joined).toLocaleDateString('ar-EG')
                    : 'غير متوفر'}
                </p>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-3">
                <Shield size={16} />
                <span className="text-sm">الصلاحيات</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {permissions.length > 0 ? (
                  permissions.map((perm, index) => (
                    <span
                      key={index}
                      className={`${getPermissionBadgeColor(perm)} text-white text-xs px-3 py-1 rounded-full`}
                    >
                      {perm}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">لا توجد صلاحيات محددة</span>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
