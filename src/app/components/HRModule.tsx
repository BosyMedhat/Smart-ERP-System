import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import {
  Users, Calendar, DollarSign, FileText, Plus, X, CheckCircle, Clock,
  AlertCircle, ChevronDown, Download, Printer, Save, RefreshCw
} from 'lucide-react';

// TypeScript Interfaces
interface Employee {
  id: string;
  name: string;
  position: string;
  baseSalary: number;
  advances: number;
  incentives: number;
  netSalary: number;
}

interface Attendance {
  id: string;
  employee: string;
  employee_name: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  status_display: string;
  check_in: string | null;
  check_out: string | null;
  late_minutes: number;
  notes: string;
  recorded_by: string;
  created_at: string;
}

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: 'draft' | 'approved' | 'paid';
  status_display: string;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  notes: string;
  created_by: string;
  created_by_name: string;
  approved_by: string | null;
  paid_at: string | null;
  created_at: string;
  slips: SalarySlip[];
}

interface SalarySlip {
  id: string;
  employee: string;
  employee_name: string;
  base_salary: number;
  incentives: number;
  advances: number;
  deductions: number;
  absent_days: number;
  late_deduction: number;
  net_salary: number;
  notes: string;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  payroll_run: string;
}

type TabType = 'employees' | 'attendance' | 'payroll' | 'slips';
type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'present', label: 'حاضر', color: 'bg-green-500' },
  { value: 'absent', label: 'غائب', color: 'bg-red-500' },
  { value: 'late', label: 'متأخر', color: 'bg-yellow-500' },
  { value: 'excused', label: 'إذن', color: 'bg-blue-500' },
];

const PAYROLL_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'مسودة', color: 'text-gray-600', bg: 'bg-gray-100' },
  approved: { label: 'معتمد', color: 'text-blue-600', bg: 'bg-blue-100' },
  paid: { label: 'مدفوع', color: 'text-green-600', bg: 'bg-green-100' },
};

export function HRModule() {
  const [activeTab, setActiveTab] = useState<TabType>('employees');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);

  // Form states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceForm, setAttendanceForm] = useState<Record<string, AttendanceStatus>>({});
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRun | null>(null);
  const [payrollForm, setPayrollForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), notes: '' });

  // Fetch data on mount and tab change
  useEffect(() => {
    fetchData();
  }, [activeTab, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'employees') {
        const res = await apiClient.get('/employees/');
        setEmployees(res.data);
      } else if (activeTab === 'attendance') {
        const [empRes, attRes] = await Promise.all([
          apiClient.get('/employees/'),
          apiClient.get('/hr/attendance/', { params: { date: selectedDate } })
        ]);
        setEmployees(empRes.data);
        setAttendanceRecords(attRes.data);
        // Initialize attendance form with existing data
        const formData: Record<string, AttendanceStatus> = {};
        attRes.data.forEach((record: Attendance) => {
          formData[record.employee] = record.status;
        });
        setAttendanceForm(formData);
      } else if (activeTab === 'payroll') {
        const res = await apiClient.get('/hr/payroll/');
        setPayrollRuns(res.data);
      } else if (activeTab === 'slips' && selectedPayroll) {
        const res = await apiClient.get('/hr/salary-slips/', { params: { payroll_run: selectedPayroll.id } });
        setSalarySlips(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err: any) => {
    if (err.response?.status === 401) {
      setError('ليس لديك صلاحية لتنفيذ هذا الإجراء');
    } else if (err.response?.status === 403) {
      setError('غير مصرح لك بهذه العملية');
    } else {
      setError('حدث خطأ، يرجى المحاولة مرة أخرى');
    }
  };

  // Attendance handlers
  const handleStatusChange = (employeeId: string, status: AttendanceStatus) => {
    setAttendanceForm(prev => ({ ...prev, [employeeId]: status }));
  };

  const saveBulkAttendance = async () => {
    setLoading(true);
    try {
      const defaultStatus = 'present' as AttendanceStatus;
      await apiClient.post('/hr/attendance/bulk-record/', {
        date: selectedDate,
        status: defaultStatus
      });
      // Then update individual records
      for (const [employeeId, status] of Object.entries(attendanceForm)) {
        await apiClient.post('/hr/attendance/', {
          employee: employeeId,
          date: selectedDate,
          status: status,
          check_in: status === 'present' || status === 'late' ? '09:00:00' : null,
          check_out: status === 'present' || status === 'late' ? '17:00:00' : null,
        });
      }
      fetchData();
      alert('تم حفظ سجلات الحضور بنجاح');
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Payroll handlers
  const createPayrollRun = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post('/hr/payroll/', payrollForm);
      setPayrollRuns(prev => [...prev, res.data]);
      setShowPayrollModal(false);
      alert('تم إنشاء مسير الرواتب بنجاح');
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const generateSlips = async (payrollId: string) => {
    setLoading(true);
    try {
      const res = await apiClient.post(`/hr/payroll/${payrollId}/generate-slips/`);
      alert(res.data.message);
      fetchData();
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const approvePayroll = async (payrollId: string) => {
    setLoading(true);
    try {
      const res = await apiClient.post(`/hr/payroll/${payrollId}/approve/`);
      alert(res.data.message);
      fetchData();
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const markPayrollPaid = async (payrollId: string) => {
    setLoading(true);
    try {
      const res = await apiClient.post(`/hr/payroll/${payrollId}/mark-paid/`);
      alert(res.data.message);
      fetchData();
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const viewSlips = (payroll: PayrollRun) => {
    setSelectedPayroll(payroll);
    setActiveTab('slips');
  };

  // Render helpers
  const getStatusBadge = (status: string) => {
    const config = PAYROLL_STATUS[status] || PAYROLL_STATUS.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-bold ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6 text-right" dir="rtl">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 font-bold flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1E293B] mb-2 font-sans">إدارة الموارد البشرية</h1>
          <p className="text-gray-600 font-sans">الحضور، الرواتب، ومسيرات الدفع</p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition-all"
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          تحديث
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex gap-1 p-2 border-b">
          {[
            { key: 'employees', label: 'الموظفون', icon: Users },
            { key: 'attendance', label: 'الحضور', icon: Clock },
            { key: 'payroll', label: 'مسير الرواتب', icon: DollarSign },
            { key: 'slips', label: 'قسائم الرواتب', icon: FileText },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as TabType)}
              className={`flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === key ? 'bg-[#1E293B] text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div className="overflow-x-auto">
              <table className="w-full text-right font-sans">
                <thead className="bg-gray-50 border-b-2 border-gray-200 font-bold">
                  <tr>
                    <th className="px-4 py-3">الاسم</th>
                    <th className="px-4 py-3 text-center">المسمى الوظيفي</th>
                    <th className="px-4 py-3 text-center">الراتب الأساسي</th>
                    <th className="px-4 py-3 text-center">السلف</th>
                    <th className="px-4 py-3 text-center">الحوافز</th>
                    <th className="px-4 py-3 text-center">صافي الراتب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50 font-bold">
                      <td className="px-4 py-4">{emp.name}</td>
                      <td className="px-4 py-4 text-center">{emp.position}</td>
                      <td className="px-4 py-4 text-center">{emp.baseSalary?.toLocaleString()} ج.م</td>
                      <td className="px-4 py-4 text-center text-red-500">{emp.advances?.toLocaleString()} ج.م</td>
                      <td className="px-4 py-4 text-center text-green-500">{emp.incentives?.toLocaleString()} ج.م</td>
                      <td className="px-4 py-4 text-center text-blue-600 font-bold">{emp.netSalary?.toLocaleString()} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {employees.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">لا يوجد موظفين</div>
              )}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {/* Date Selector */}
              <div className="flex items-center gap-4 mb-6">
                <label className="font-bold text-gray-700">تاريخ الحضور:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border rounded-xl font-bold"
                />
                <button
                  onClick={saveBulkAttendance}
                  disabled={loading}
                  className="px-6 py-2 bg-[#10B981] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#059669] transition-all disabled:opacity-50"
                >
                  <Save size={18} />
                  حفظ الحضور
                </button>
              </div>

              {/* Attendance Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((emp) => {
                  const currentStatus = attendanceForm[emp.id] || 'present';
                  return (
                    <div key={emp.id} className="bg-white border rounded-xl p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-[#1E293B]">{emp.name}</span>
                        <span className="text-sm text-gray-500">{emp.position}</span>
                      </div>
                      <div className="relative">
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(emp.id, e.target.value as AttendanceStatus)}
                          className="w-full p-3 border rounded-xl font-bold appearance-none cursor-pointer bg-white"
                        >
                          {STATUS_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${STATUS_OPTIONS.find(s => s.value === currentStatus)?.color}`} />
                        <span className="text-sm text-gray-500">
                          {STATUS_OPTIONS.find(s => s.value === currentStatus)?.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {employees.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">لا يوجد موظفين</div>
              )}
            </div>
          )}

          {/* Payroll Tab */}
          {activeTab === 'payroll' && (
            <div className="space-y-4">
              {/* Create Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowPayrollModal(true)}
                  className="px-6 py-3 bg-[#1E293B] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all"
                >
                  <Plus size={20} />
                  إنشاء مسير جديد
                </button>
              </div>

              {/* Payroll Runs List */}
              <div className="overflow-x-auto">
                <table className="w-full text-right font-sans">
                  <thead className="bg-gray-50 border-b-2 border-gray-200 font-bold">
                    <tr>
                      <th className="px-4 py-3">الشهر/السنة</th>
                      <th className="px-4 py-3 text-center">الحالة</th>
                      <th className="px-4 py-3 text-center">الإجمالي</th>
                      <th className="px-4 py-3 text-center">الخصومات</th>
                      <th className="px-4 py-3 text-center">الصافي</th>
                      <th className="px-4 py-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payrollRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-gray-50 font-bold">
                        <td className="px-4 py-4">{run.month}/{run.year}</td>
                        <td className="px-4 py-4 text-center">{getStatusBadge(run.status)}</td>
                        <td className="px-4 py-4 text-center">{run.total_gross?.toLocaleString()} ج.م</td>
                        <td className="px-4 py-4 text-center text-red-500">{run.total_deductions?.toLocaleString()} ج.م</td>
                        <td className="px-4 py-4 text-center text-blue-600 font-bold">{run.total_net?.toLocaleString()} ج.م</td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            {run.status === 'draft' && (
                              <button
                                onClick={() => generateSlips(run.id)}
                                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                                disabled={loading}
                              >
                                توليد قسائم
                              </button>
                            )}
                            {run.status === 'draft' && (
                              <button
                                onClick={() => approvePayroll(run.id)}
                                className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-lg text-xs font-bold hover:bg-yellow-100"
                                disabled={loading}
                              >
                                اعتماد
                              </button>
                            )}
                            {run.status === 'approved' && (
                              <button
                                onClick={() => markPayrollPaid(run.id)}
                                className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100"
                                disabled={loading}
                              >
                                تسجيل صرف
                              </button>
                            )}
                            <button
                              onClick={() => viewSlips(run)}
                              className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100"
                            >
                              عرض القسائم
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payrollRuns.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">لا يوجد مسيرات رواتب</div>
                )}
              </div>
            </div>
          )}

          {/* Salary Slips Tab */}
          {activeTab === 'slips' && (
            <div className="space-y-4">
              {/* Back Button & Payroll Info */}
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setActiveTab('payroll')}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition-all"
                >
                  <ChevronDown className="rotate-90" size={18} />
                  العودة لمسيرات الرواتب
                </button>
                {selectedPayroll && (
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-[#1E293B]">
                      مسير: {selectedPayroll.month}/{selectedPayroll.year}
                    </span>
                    {getStatusBadge(selectedPayroll.status)}
                  </div>
                )}
              </div>

              {/* Slips Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right font-sans">
                  <thead className="bg-gray-50 border-b-2 border-gray-200 font-bold">
                    <tr>
                      <th className="px-4 py-3">الموظف</th>
                      <th className="px-4 py-3 text-center">الأساسي</th>
                      <th className="px-4 py-3 text-center">الحوافز</th>
                      <th className="px-4 py-3 text-center">السلف</th>
                      <th className="px-4 py-3 text-center">أيام الغياب</th>
                      <th className="px-4 py-3 text-center">خصم التأخير</th>
                      <th className="px-4 py-3 text-center">الصافي</th>
                      <th className="px-4 py-3 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salarySlips.map((slip) => (
                      <tr key={slip.id} className="hover:bg-gray-50 font-bold">
                        <td className="px-4 py-4">{slip.employee_name}</td>
                        <td className="px-4 py-4 text-center">{slip.base_salary?.toLocaleString()} ج.م</td>
                        <td className="px-4 py-4 text-center text-green-500">+{slip.incentives?.toLocaleString()} ج.م</td>
                        <td className="px-4 py-4 text-center text-red-500">-{slip.advances?.toLocaleString()} ج.م</td>
                        <td className="px-4 py-4 text-center">{slip.absent_days} يوم</td>
                        <td className="px-4 py-4 text-center text-red-500">-{slip.late_deduction?.toLocaleString()} ج.م</td>
                        <td className="px-4 py-4 text-center text-blue-600 font-bold">{slip.net_salary?.toLocaleString()} ج.م</td>
                        <td className="px-4 py-4 text-center">
                          {slip.is_paid ? (
                            <span className="flex items-center justify-center gap-1 text-green-600">
                              <CheckCircle size={16} />
                              مدفوع
                            </span>
                          ) : (
                            <span className="text-gray-500">معلق</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {salarySlips.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">لا توجد قسائم رواتب لهذا المسير</div>
                )}
              </div>

              {/* Print Button */}
              {salarySlips.length > 0 && (
                <div className="flex justify-end gap-2">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200">
                    <Printer size={18} />
                    طباعة
                  </button>
                  <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-100">
                    <Download size={18} />
                    تصدير Excel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Payroll Modal */}
      {showPayrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm text-right font-sans">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden font-sans font-bold">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <span className="text-lg">إنشاء مسير رواتب جديد</span>
              <button onClick={() => setShowPayrollModal(false)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-gray-700">الشهر</label>
                  <select
                    value={payrollForm.month}
                    onChange={(e) => setPayrollForm({ ...payrollForm, month: parseInt(e.target.value) })}
                    className="w-full p-3 border rounded-xl"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-gray-700">السنة</label>
                  <input
                    type="number"
                    value={payrollForm.year}
                    onChange={(e) => setPayrollForm({ ...payrollForm, year: parseInt(e.target.value) })}
                    className="w-full p-3 border rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-gray-700">ملاحظات</label>
                <textarea
                  value={payrollForm.notes}
                  onChange={(e) => setPayrollForm({ ...payrollForm, notes: e.target.value })}
                  className="w-full p-3 border rounded-xl"
                  rows={3}
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowPayrollModal(false)}
                  className="flex-1 bg-gray-100 py-3 rounded-xl hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button
                  onClick={createPayrollRun}
                  className="flex-1 bg-[#10B981] text-white py-3 rounded-xl shadow-lg hover:bg-[#059669]"
                  disabled={loading}
                >
                  {loading ? 'جاري...' : 'إنشاء'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
