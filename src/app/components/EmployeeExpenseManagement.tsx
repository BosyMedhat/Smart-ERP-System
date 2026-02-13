import { useState } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  X,
  Calendar,
  FileText,
  Zap,
  Home as HomeIcon,
  Lightbulb,
  Wrench,
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  position: string;
  baseSalary: number;
  advances: number;
  incentives: number;
  netSalary: number;
  attendance: 'present' | 'absent';
}

interface Expense {
  id: string;
  type: string;
  amount: number;
  date: string;
  notes: string;
  category: 'rent' | 'electricity' | 'maintenance' | 'other';
}

type ModalType = 'advance' | 'incentive' | 'deduction' | 'expense' | null;

export function EmployeeExpenseManagement() {
  const [activeTab, setActiveTab] = useState<'employees' | 'expenses'>('employees');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: '',
    notes: '',
  });

  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      name: 'أحمد محمود السيد',
      position: 'مدير مبيعات',
      baseSalary: 12000,
      advances: 2000,
      incentives: 1500,
      netSalary: 11500,
      attendance: 'present',
    },
    {
      id: '2',
      name: 'فاطمة حسن علي',
      position: 'محاسبة رئيسية',
      baseSalary: 10000,
      advances: 0,
      incentives: 800,
      netSalary: 10800,
      attendance: 'present',
    },
    {
      id: '3',
      name: 'محمد عبد الله',
      position: 'موظف مخازن',
      baseSalary: 6000,
      advances: 1000,
      incentives: 0,
      netSalary: 5000,
      attendance: 'absent',
    },
    {
      id: '4',
      name: 'سارة أحمد',
      position: 'موظفة مبيعات',
      baseSalary: 7000,
      advances: 500,
      incentives: 1200,
      netSalary: 7700,
      attendance: 'present',
    },
  ]);

  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      type: 'إيجار المقر',
      amount: 15000,
      date: '2026-02-01',
      notes: 'إيجار شهر فبراير 2026',
      category: 'rent',
    },
    {
      id: '2',
      type: 'فاتورة الكهرباء',
      amount: 3500,
      date: '2026-02-03',
      notes: 'استهلاك شهر يناير',
      category: 'electricity',
    },
    {
      id: '3',
      type: 'صيانة أجهزة الحاسب',
      amount: 2800,
      date: '2026-02-04',
      notes: 'صيانة دورية وتحديث برامج',
      category: 'maintenance',
    },
    {
      id: '4',
      type: 'مصاريف إدارية متنوعة',
      amount: 1200,
      date: '2026-02-04',
      notes: 'قرطاسية ومستلزمات مكتبية',
      category: 'other',
    },
  ]);

  // Calculate totals
  const totalPayroll = employees.reduce((sum, emp) => sum + emp.netSalary, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const estimatedProfit = 85000 - totalPayroll - totalExpenses; // Assuming 85,000 revenue

  const openModal = (type: ModalType, employee?: Employee) => {
    setModalType(type);
    setSelectedEmployee(employee || null);
    setShowModal(true);
    setFormData({ category: '', amount: '', date: '', notes: '' });
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType(null);
    setSelectedEmployee(null);
    setFormData({ category: '', amount: '', date: '', notes: '' });
  };

  const handleSubmit = () => {
    // Here you would handle the actual submission
    console.log('Submitting:', { modalType, formData, selectedEmployee });
    closeModal();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rent':
        return <HomeIcon size={18} className="text-[#F59E0B]" />;
      case 'electricity':
        return <Zap size={18} className="text-yellow-500" />;
      case 'maintenance':
        return <Wrench size={18} className="text-blue-500" />;
      default:
        return <FileText size={18} className="text-gray-500" />;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1E293B] mb-2">إدارة الموظفين والمصروفات</h1>
        <p className="text-gray-600">تتبع شامل للرواتب والمصاريف التشغيلية</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        {/* Total Payroll */}
        
        <div className="bg-[#E0F2FE] rounded-xl shadow-sm border border-gray-200 p-6">
  <div className="flex items-center justify-between mb-4">
    <div className="w-14 h-14 bg-[#BFDBFE] rounded-lg flex items-center justify-center">
      <Users size={28} className="text-[#3B82F6]" />
    </div>
    <div className="text-sm text-gray-500">شهر فبراير</div>
  </div>
  <div className="text-base text-gray-600 mb-1">إجمالي الرواتب والتعويضات</div>
  <div className="text-4xl font-bold text-[#1E293B]">
    {totalPayroll.toLocaleString()} <span className="text-lg">ج.م</span>
  </div>
  <div className="mt-3 text-sm text-gray-500">{employees.length} موظف نشط</div>
</div>

        <div className="bg-[#FFF7ED] rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="w-14 h-14 bg-[#FFE7C0] rounded-lg flex items-center justify-center">
        <DollarSign size={28} className="text-[#F59E0B]" />
      </div>
      <div className="text-sm text-gray-500">حتى الآن</div>
    </div>
    <div className="text-base text-gray-600 mb-1">المصاريف التشغيلية</div>
    <div className="text-4xl font-bold text-[#1E293B]">
      {totalExpenses.toLocaleString()} <span className="text-lg">ج.م</span>
    </div>
    <div className="mt-3 text-sm text-gray-500">{expenses.length} عملية مصروف</div>
  </div>


        <div className="bg-[#ECFDF5] rounded-xl shadow-sm border border-[#10B981] p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="w-14 h-14 bg-[#A7F3D0] rounded-lg flex items-center justify-center shadow-lg">
        <TrendingUp size={28} className="text-[#10B981]" />
      </div>
      <div className="text-sm text-green-700 font-semibold">تقديري</div>
    </div>
    <div className="text-base text-green-700 mb-1 font-semibold">صافي الربح التقديري</div>
    <div className="text-4xl font-bold text-[#10B981]">
      {estimatedProfit.toLocaleString()} <span className="text-lg">ج.م</span>
    </div>
    <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
      <TrendingUp size={16} />
      <span>زيادة 12% عن الشهر السابق</span>
    </div>
      </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                activeTab === 'employees'
                  ? 'bg-[#1E293B] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users size={18} />
                <span>الموظفين</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                activeTab === 'expenses'
                  ? 'bg-[#1E293B] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <DollarSign size={18} />
                <span>المصاريف العامة</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'employees' ? (
            // Employees Table
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                      الحضور
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                      اسم الموظف
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                      الوظيفة
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                      الراتب الأساسي
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                      السلف/الخصومات
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                      الحوافز
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                      صافي الراتب
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              employee.attendance === 'present' ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          ></div>
                          <span className="text-xs text-gray-600">
                            {employee.attendance === 'present' ? 'حاضر' : 'غائب'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-gray-800">{employee.name}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-600">{employee.position}</td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-[#1E293B]">
                          {employee.baseSalary.toLocaleString()} ج.م
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-[#EF4444]">
                          {employee.advances > 0 ? `-${employee.advances.toLocaleString()}` : '0'}{' '}
                          ج.م
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-[#10B981]">
                          {employee.incentives > 0
                            ? `+${employee.incentives.toLocaleString()}`
                            : '0'}{' '}
                          ج.م
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-[#3B82F6] text-lg">
                          {employee.netSalary.toLocaleString()} ج.م
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openModal('advance', employee)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#EF4444] border border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <Plus size={14} />
                            سلفة
                          </button>
                          <button
                            onClick={() => openModal('incentive', employee)}
                            className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-[#10B981] border border-green-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <Plus size={14} />
                            حافز
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Expenses List
            <div className="space-y-4">
              <button
                onClick={() => openModal('expense')}
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
              >
                <Plus size={20} />
                إضافة مصروف جديد
              </button>

              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getCategoryIcon(expense.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-gray-800">{expense.type}</h3>
                            <span className="text-xl font-bold text-[#EF4444]">
                              {expense.amount.toLocaleString()} ج.م
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{expense.date}</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2">
                            <span className="font-semibold text-gray-700">ملاحظات: </span>
                            {expense.notes}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#1E293B]">
                {modalType === 'advance' && 'إضافة سلفة'}
                {modalType === 'incentive' && 'إضافة حافز'}
                {modalType === 'deduction' && 'إضافة خصم'}
                {modalType === 'expense' && 'إضافة مصروف جديد'}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {selectedEmployee && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="text-sm text-blue-700 font-semibold">{selectedEmployee.name}</div>
                  <div className="text-xs text-blue-600">{selectedEmployee.position}</div>
                </div>
              )}

              {modalType === 'expense' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    نوع المصروف
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="">اختر نوع المصروف</option>
                    <option value="rent">إيجار</option>
                    <option value="electricity">كهرباء</option>
                    <option value="maintenance">صيانة</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">المبلغ</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2.5 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    placeholder="0"
                    dir="ltr"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    ج.م
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">التاريخ</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-none"
                  placeholder="أدخل أي ملاحظات إضافية..."
                ></textarea>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
