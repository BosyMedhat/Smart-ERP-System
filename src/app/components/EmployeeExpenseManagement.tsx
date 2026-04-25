import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import {
  Users, DollarSign, TrendingUp, Plus, X, Calendar, FileText, Zap,
  Home as HomeIcon, Lightbulb, Wrench, UserPlus
} from 'lucide-react';

// تعريف الأنواع (Interfaces) بشكل كامل
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

type ModalType = 'advance' | 'incentive' | 'deduction' | 'expense' | 'addEmployee' | null;

export function EmployeeExpenseManagement() {
  const [activeTab, setActiveTab] = useState<'employees' | 'expenses'>('employees');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    baseSalary: '',
    category: '',
    amount: '',
    date: '',
    notes: '',
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState('');

  const [expenses, setExpenses] = useState<Expense[]>([]);

  // دالة لجلب البيانات من السيرفر
  const fetchData = async () => {
    try {
      setError('');
      const empRes = await apiClient.get('/employees/');
      const expRes = await apiClient.get('/expenses/');
      setEmployees(empRes.data);
      setExpenses(expRes.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        setError('ليس لديك صلاحية لتنفيذ هذا الإجراء');
      } else if (error.response?.status === 403) {
        setError('غير مصرح لك بهذه العملية');
      } else {
        setError('حدث خطأ، يرجى المحاولة مرة أخرى');
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setModalType(null);
    setSelectedEmployee(null);
    setFormData({ name: '', position: '', baseSalary: '', category: '', amount: '', date: '', notes: '' });
  };

  const openModal = (type: ModalType, employee?: Employee) => {
    setModalType(type);
    setSelectedEmployee(employee || null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (modalType === 'addEmployee') {
        const newEmpPayload = {
          name: formData.name,
          position: formData.position,
          baseSalary: parseFloat(formData.baseSalary),
          advances: 0,
          incentives: 0,
          attendance: 'present'
        };
        const res = await apiClient.post('/employees/', newEmpPayload);
        setEmployees(prev => [...prev, res.data]);
      } 
      else if (selectedEmployee && (modalType === 'incentive' || modalType === 'advance')) {
        const amountVal = parseFloat(formData.amount);
        const payload = {
          incentives: modalType === 'incentive' ? Number(selectedEmployee.incentives) + amountVal : selectedEmployee.incentives,
          advances: modalType === 'advance' ? Number(selectedEmployee.advances) + amountVal : selectedEmployee.advances,
        };
        await apiClient.patch(`/employees/${selectedEmployee.id}/`, payload);
        fetchData();
      } 
      else if (modalType === 'expense') {
        const newExpPayload = {
          type: formData.category === 'rent' ? 'إيجار' : formData.category === 'electricity' ? 'كهرباء' : 'أخرى',
          amount: parseFloat(formData.amount),
          date: formData.date || new Date().toISOString().split('T')[0],
          notes: formData.notes,
          category: formData.category
        };
        await apiClient.post('/expenses/', newExpPayload);
        fetchData();
      }
      closeModal();
    } catch (error: any) {
      if (error.response?.status === 401) {
        alert('ليس لديك صلاحية لتنفيذ هذا الإجراء');
      } else if (error.response?.status === 403) {
        alert('غير مصرح لك بهذه العملية');
      } else {
        alert('حدث خطأ، يرجى المحاولة مرة أخرى');
      }
      closeModal();
    }
  };

  const totalPayroll = employees.reduce((sum, emp) => sum + Number(emp.netSalary || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const estimatedProfit = 85000 - totalPayroll - totalExpenses;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rent': return <HomeIcon size={18} className="text-[#F59E0B]" />;
      case 'electricity': return <Zap size={18} className="text-yellow-500" />;
      case 'maintenance': return <Wrench size={18} className="text-blue-500" />;
      default: return <FileText size={18} className="text-gray-500" />;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6 text-right" dir="rtl">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 font-bold">
          {error}
        </div>
      )}

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1E293B] mb-2 font-sans">إدارة الموظفين والمصروفات</h1>
          <p className="text-gray-600 font-sans">تتبع شامل للرواتب والمصاريف التشغيلية</p>
        </div>
        <button onClick={() => openModal('addEmployee')} className="px-6 py-3 bg-[#1E293B] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg">
          <UserPlus size={20} /> إضافة موظف جديد
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#E0F2FE] rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-[#BFDBFE] rounded-lg flex items-center justify-center"><Users size={28} className="text-[#3B82F6]" /></div>
          </div>
          <div className="text-base text-gray-600 mb-1 font-bold font-sans">إجمالي الرواتب</div>
          <div className="text-4xl font-bold text-[#1E293B] font-sans">{totalPayroll.toLocaleString()} ج.م</div>
        </div>
        <div className="bg-[#FFF7ED] rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-[#FFE7C0] rounded-lg flex items-center justify-center"><DollarSign size={28} className="text-[#F59E0B]" /></div>
          </div>
          <div className="text-base text-gray-600 mb-1 font-bold font-sans">المصاريف التشغيلية</div>
          <div className="text-4xl font-bold text-[#1E293B] font-sans">{totalExpenses.toLocaleString()} ج.م</div>
        </div>
        <div className="bg-[#ECFDF5] rounded-xl shadow-sm border border-[#10B981] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-[#A7F3D0] rounded-lg flex items-center justify-center"><TrendingUp size={28} className="text-[#10B981]" /></div>
          </div>
          <div className="text-base text-[#10B981] mb-1 font-bold font-sans">صافي الربح التقديري</div>
          <div className="text-4xl font-bold text-[#10B981] font-sans">{estimatedProfit.toLocaleString()} ج.م</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex gap-1 p-2 border-b">
          <button onClick={() => setActiveTab('employees')} className={`flex-1 py-3 rounded-lg font-bold transition-all ${activeTab === 'employees' ? 'bg-[#1E293B] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>الموظفين</button>
          <button onClick={() => setActiveTab('expenses')} className={`flex-1 py-3 rounded-lg font-bold transition-all ${activeTab === 'expenses' ? 'bg-[#1E293B] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>المصاريف العامة</button>
        </div>

        <div className="p-6">
          {activeTab === 'employees' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right font-sans">
                <thead className="bg-gray-50 border-b-2 border-gray-200 font-bold">
                  <tr>
                    <th className="px-4 py-3">الحالة</th>
                    <th className="px-4 py-3">الاسم</th>
                    <th className="px-4 py-3 text-center">الأساسي</th>
                    <th className="px-4 py-3 text-center">السلف</th>
                    <th className="px-4 py-3 text-center">الحوافز</th>
                    <th className="px-4 py-3 text-center">الصافي</th>
                    <th className="px-4 py-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50 font-bold">
                      <td className="px-4 py-4"><div className={`w-3 h-3 rounded-full ${emp.attendance === 'present' ? 'bg-green-500' : 'bg-red-500'}`} /></td>
                      <td className="px-4 py-4">{emp.name}</td>
                      <td className="px-4 py-4 text-center">{emp.baseSalary.toLocaleString()} ج.م</td>
                      <td className="px-4 py-4 text-center text-red-500">-{emp.advances}</td>
                      <td className="px-4 py-4 text-center text-green-500">+{emp.incentives}</td>
                      <td className="px-4 py-4 text-center text-blue-600 font-bold">{emp.netSalary?.toLocaleString()} ج.م</td>
                      <td className="px-4 py-4 flex justify-center gap-2">
                        <button onClick={() => openModal('advance', emp)} className="bg-red-50 text-red-600 px-3 py-1 rounded-lg border border-red-200 text-xs hover:bg-red-100 font-bold">+ سلفة</button>
                        <button onClick={() => openModal('incentive', emp)} className="bg-green-50 text-green-600 px-3 py-1 rounded-lg border border-green-200 text-xs hover:bg-green-100 font-bold">+ حافز</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-4 font-sans">
               <button onClick={() => openModal('expense')} className="w-full bg-[#3B82F6] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"><Plus /> إضافة مصروف جديد</button>
               {expenses.map((exp) => (
                 <div key={exp.id} className="bg-gray-50 p-4 rounded-xl border flex justify-between items-center shadow-sm font-bold font-sans">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(exp.category)}
                      <div>{exp.type} <p className="text-xs text-gray-400 font-normal">{exp.date}</p></div>
                    </div>
                    <div className="text-red-500">{exp.amount.toLocaleString()} ج.م</div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* Unified Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm text-right font-sans">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden font-sans font-bold">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
               <span>{modalType === 'addEmployee' ? 'إضافة موظف جديد' : 'تسجيل مبلغ'}</span>
               <button onClick={closeModal}><X /></button>
            </div>
            <div className="p-6 space-y-4">
               {modalType === 'addEmployee' ? (
                 <>
                   <label>الاسم الكامل:</label>
                   <input type="text" className="w-full p-3 border rounded-xl" value={formData.name} onChange={(e)=>setFormData({...formData, name:e.target.value})} />
                   <label>المسمى الوظيفي:</label>
                   <input type="text" className="w-full p-3 border rounded-xl" value={formData.position} onChange={(e)=>setFormData({...formData, position:e.target.value})} />
                   <label>الراتب الأساسي:</label>
                   <input type="number" className="w-full p-3 border rounded-xl font-bold" value={formData.baseSalary} onChange={(e)=>setFormData({...formData, baseSalary:e.target.value})} />
                 </>
               ) : (
                 <>
                   {selectedEmployee && <div className="p-3 bg-blue-50 text-blue-700 rounded-lg mb-4 italic">{selectedEmployee.name}</div>}
                   {modalType === 'expense' && (
                      <select className="w-full p-3 border rounded-xl mb-4" value={formData.category} onChange={(e)=>setFormData({...formData, category:e.target.value})}>
                        <option value="">نوع المصروف</option>
                        <option value="rent">إيجار</option>
                        <option value="electricity">كهرباء</option>
                        <option value="maintenance">صيانة</option>
                        <option value="other">أخرى</option>
                      </select>
                   )}
                   <label>المبلغ:</label>
                   <input type="number" className="w-full p-3 border rounded-xl font-bold text-left" dir="ltr" value={formData.amount} onChange={(e)=>setFormData({...formData, amount:e.target.value})} />
                   <label>ملاحظات:</label>
                   <textarea className="w-full p-3 border rounded-xl" rows={3} value={formData.notes} onChange={(e)=>setFormData({...formData, notes:e.target.value})} />
                 </>
               )}
               <div className="flex gap-2 pt-4 font-bold font-sans">
                  <button onClick={closeModal} className="flex-1 bg-gray-100 py-3 rounded-xl">إلغاء</button>
                  <button onClick={handleSubmit} className="flex-1 bg-[#10B981] text-white py-3 rounded-xl shadow-lg hover:bg-[#059669]">تأكيد وحفظ</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}