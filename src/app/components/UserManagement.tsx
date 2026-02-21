import { useState } from 'react';
import { Users, Plus, X, CheckCircle, UserPlus, Shield } from 'lucide-react';

interface User {
  id: string;
  name: string;
  role: string;
  permissions: {
    sales: string[];
    inventory: string[];
    reports: string[];
    settings: string[];
  };
}

const permissionCategories = {
  sales: {
    title: 'المبيعات',
    color: '#3B82F6',
    permissions: [
      { id: 'add_invoice', label: 'إضافة فاتورة' },
      { id: 'edit_price', label: 'تعديل سعر' },
      { id: 'apply_discount', label: 'عمل خصم' },
      { id: 'returns', label: 'مرتجع' },
    ],
  },
  inventory: {
    title: 'المخازن',
    color: '#F59E0B',
    permissions: [
      { id: 'add_product', label: 'إضافة منتج' },
      { id: 'inventory_count', label: 'جرد المخزن' },
      { id: 'view_cost_price', label: 'رؤية أسعار التكلفة' },
      { id: 'manage_suppliers', label: 'إدارة الموردين' },
    ],
  },
  reports: {
    title: 'التقارير',
    color: '#10B981',
    permissions: [
      { id: 'profit_report', label: 'تقرير الأرباح' },
      { id: 'daily_sales', label: 'تقرير المبيعات اليومي' },
      { id: 'inventory_report', label: 'تقرير المخزون' },
      { id: 'employee_report', label: 'تقرير الموظفين' },
    ],
  },
  settings: {
    title: 'الإعدادات',
    color: '#8B5CF6',
    permissions: [
      { id: 'user_management', label: 'إدارة المستخدمين' },
      { id: 'backup', label: 'النسخ الاحتياطي' },
      { id: 'system_settings', label: 'إعدادات النظام' },
      { id: 'module_control', label: 'التحكم في الموديولات' },
    ],
  },
};

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'أحمد محمود',
      role: 'كاشير',
      permissions: {
        sales: ['add_invoice', 'returns'],
        inventory: [],
        reports: ['daily_sales'],
        settings: [],
      },
    },
    {
      id: '2',
      name: 'فاطمة حسن',
      role: 'محاسبة',
      permissions: {
        sales: ['add_invoice', 'edit_price', 'apply_discount', 'returns'],
        inventory: ['add_product', 'inventory_count'],
        reports: ['profit_report', 'daily_sales', 'inventory_report'],
        settings: [],
      },
    },
    {
      id: '3',
      name: 'محمد علي',
      role: 'مدير مخازن',
      permissions: {
        sales: [],
        inventory: ['add_product', 'inventory_count', 'view_cost_price', 'manage_suppliers'],
        reports: ['inventory_report'],
        settings: [],
      },
    },
  ]);

  const [selectedUser, setSelectedUser] = useState<User | null>(users[0]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const togglePermission = (category: keyof User['permissions'], permissionId: string) => {
    if (!selectedUser) return;

    const updatedPermissions = { ...selectedUser.permissions };
    if (updatedPermissions[category].includes(permissionId)) {
      updatedPermissions[category] = updatedPermissions[category].filter(
        (p) => p !== permissionId
      );
    } else {
      updatedPermissions[category] = [...updatedPermissions[category], permissionId];
    }

    const updatedUser = { ...selectedUser, permissions: updatedPermissions };
    setSelectedUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const hasPermission = (category: keyof User['permissions'], permissionId: string): boolean => {
    if (!selectedUser) return false;
    return selectedUser.permissions[category].includes(permissionId);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E293B] mb-2">إدارة المستخدمين والصلاحيات</h1>
          <p className="text-gray-600">تحكم كامل في صلاحيات المستخدمين لكل موديول</p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg"
        >
          <Plus size={20} />
          إضافة مستخدم جديد
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* User List (Right Side) */}
        <div className="col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-[#3B82F6]" />
            <h2 className="text-xl font-bold text-[#1E293B]">قائمة المستخدمين</h2>
          </div>

          <div className="space-y-3">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full text-right p-4 rounded-xl border-2 transition-all ${
                  selectedUser?.id === user.id
                    ? 'border-[#3B82F6] bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                      selectedUser?.id === user.id ? 'bg-[#3B82F6]' : 'bg-gray-400'
                    }`}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.role}</div>
                  </div>
                  {selectedUser?.id === user.id && (
                    <CheckCircle size={20} className="text-[#3B82F6]" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permission Grid (Left Side) */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {selectedUser ? (
            <>
              {/* User Info Header */}
              <div className="bg-gradient-to-r from-[#3B82F6] to-[#1E293B] rounded-xl p-6 mb-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#3B82F6] font-bold text-2xl">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
                    <p className="text-blue-200">{selectedUser.role}</p>
                  </div>
                </div>
              </div>

              {/* Permission Categories */}
              <div className="space-y-6">
                {(Object.keys(permissionCategories) as Array<keyof typeof permissionCategories>).map(
                  (categoryKey) => {
                    const category = permissionCategories[categoryKey];
                    return (
                      <div key={categoryKey} className="border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <Shield size={18} style={{ color: category.color }} />
                          </div>
                          <h3 className="text-lg font-bold text-[#1E293B]">{category.title}</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {category.permissions.map((permission) => (
                            <label
                              key={permission.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                hasPermission(
                                  categoryKey as keyof User['permissions'],
                                  permission.id
                                )
                                  ? 'border-[#10B981] bg-green-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={hasPermission(
                                  categoryKey as keyof User['permissions'],
                                  permission.id
                                )}
                                onChange={() =>
                                  togglePermission(
                                    categoryKey as keyof User['permissions'],
                                    permission.id
                                  )
                                }
                                className="w-5 h-5 text-[#10B981] rounded focus:ring-2 focus:ring-[#10B981]"
                              />
                              <span className="text-sm font-semibold text-gray-800">
                                {permission.label}
                              </span>
                              {hasPermission(
                                categoryKey as keyof User['permissions'],
                                permission.id
                              ) && <CheckCircle size={16} className="text-[#10B981] mr-auto" />}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Save Button */}
              <div className="mt-6 flex justify-end gap-3">
                <button className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors">
                  إعادة تعيين
                </button>
                <button className="px-8 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg">
                  <CheckCircle size={20} />
                  حفظ الصلاحيات
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Users size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">اختر مستخدماً لتعديل صلاحياته</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#1E293B]">إضافة مستخدم جديد</h2>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  placeholder="أدخل اسم المستخدم"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الوظيفة</label>
                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]">
                  <option value="">اختر الوظيفة</option>
                  <option value="cashier">كاشير</option>
                  <option value="accountant">محاسب</option>
                  <option value="warehouse">أمين مخزن</option>
                  <option value="manager">مدير</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  placeholder="أدخل كلمة المرور"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg">
                <UserPlus size={20} />
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
