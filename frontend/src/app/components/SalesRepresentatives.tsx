import { useState } from 'react';
import { UserCheck, Phone, TrendingUp, DollarSign, Target } from 'lucide-react';

interface Representative {
  id: string;
  name: string;
  phone: string;
  totalSales: number;
  targetSales: number;
  commission: number;
  commissionRate: number;
}

interface Commission {
  id: string;
  repName: string;
  operationNumber: string;
  date: string;
  salesValue: number;
  commissionRate: number;
  netCommission: number;
}

export function SalesRepresentatives() {
  const [representatives] = useState<Representative[]>([
    {
      id: '1',
      name: 'أحمد محمود',
      phone: '+20 123 456 7890',
      totalSales: 85000,
      targetSales: 100000,
      commission: 2550,
      commissionRate: 3,
    },
    {
      id: '2',
      name: 'سارة حسن',
      phone: '+20 111 222 3333',
      totalSales: 120000,
      targetSales: 100000,
      commission: 3600,
      commissionRate: 3,
    },
    {
      id: '3',
      name: 'محمد علي',
      phone: '+20 155 666 7777',
      totalSales: 65000,
      targetSales: 80000,
      commission: 1950,
      commissionRate: 3,
    },
    {
      id: '4',
      name: 'فاطمة أحمد',
      phone: '+20 144 555 8888',
      totalSales: 95000,
      targetSales: 90000,
      commission: 2850,
      commissionRate: 3,
    },
  ]);

  const [commissions] = useState<Commission[]>([
    {
      id: '1',
      repName: 'أحمد محمود',
      operationNumber: 'OP-5421',
      date: '2026-02-04',
      salesValue: 15000,
      commissionRate: 3,
      netCommission: 450,
    },
    {
      id: '2',
      repName: 'سارة حسن',
      operationNumber: 'OP-5422',
      date: '2026-02-04',
      salesValue: 22000,
      commissionRate: 3,
      netCommission: 660,
    },
    {
      id: '3',
      repName: 'محمد علي',
      operationNumber: 'OP-5418',
      date: '2026-02-03',
      salesValue: 8500,
      commissionRate: 3,
      netCommission: 255,
    },
    {
      id: '4',
      repName: 'فاطمة أحمد',
      operationNumber: 'OP-5420',
      date: '2026-02-03',
      salesValue: 18000,
      commissionRate: 3,
      netCommission: 540,
    },
    {
      id: '5',
      repName: 'أحمد محمود',
      operationNumber: 'OP-5415',
      date: '2026-02-02',
      salesValue: 12000,
      commissionRate: 3,
      netCommission: 360,
    },
  ]);

  const totalCommissions = representatives.reduce((sum, rep) => sum + rep.commission, 0);
  const totalSales = representatives.reduce((sum, rep) => sum + rep.totalSales, 0);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E293B] mb-2">إدارة المناديب</h1>
          <p className="text-gray-600">تتبع أداء المناديب وعمولاتهم</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-3">
            <div className="text-xs text-gray-600">إجمالي المبيعات</div>
            <div className="text-xl font-bold text-[#3B82F6]">
              {totalSales.toLocaleString()} ج.م
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-3">
            <div className="text-xs text-gray-600">إجمالي العمولات</div>
            <div className="text-xl font-bold text-[#10B981]">
              {totalCommissions.toLocaleString()} ج.م
            </div>
          </div>
        </div>
      </div>

      {/* Representatives Performance Grid */}
      <div className="grid grid-cols-2 gap-6">
        {representatives.map((rep) => {
          const targetPercentage = Math.min((rep.totalSales / rep.targetSales) * 100, 100);
          const isTargetAchieved = rep.totalSales >= rep.targetSales;

          return (
            <div
              key={rep.id}
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Rep Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#3B82F6] to-[#1E293B] rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {rep.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#1E293B]">{rep.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Phone size={14} />
                    <span dir="ltr">{rep.phone}</span>
                  </div>
                </div>
                {isTargetAchieved && (
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Target size={20} className="text-green-600" />
                  </div>
                )}
              </div>

              {/* Target Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-700">تحقيق التارجت</span>
                  <span
                    className={`text-sm font-bold ${
                      isTargetAchieved ? 'text-green-600' : 'text-orange-600'
                    }`}
                  >
                    {targetPercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isTargetAchieved
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500'
                    }`}
                    style={{ width: `${targetPercentage}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    التارجت: {rep.targetSales.toLocaleString()} ج.م
                  </span>
                </div>
              </div>

              {/* Sales & Commission Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={16} className="text-[#3B82F6]" />
                    <span className="text-xs text-blue-700 font-semibold">إجمالي المبيعات</span>
                  </div>
                  <div className="text-xl font-bold text-[#3B82F6]">
                    {rep.totalSales.toLocaleString()}
                    <span className="text-sm"> ج.م</span>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} className="text-[#10B981]" />
                    <span className="text-xs text-green-700 font-semibold">العمولة المستحقة</span>
                  </div>
                  <div className="text-xl font-bold text-[#10B981]">
                    {rep.commission.toLocaleString()}
                    <span className="text-sm"> ج.م</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                نسبة العمولة: {rep.commissionRate}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Commissions History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-[#1E293B] mb-4">سجل العمولات</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">المندوب</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                  رقم العملية
                </th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">التاريخ</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                  قيمة المبيعات
                </th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                  نسبة العمولة
                </th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                  صافي العمولة
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {commissions.map((commission) => (
                <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#1E293B] rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {commission.repName.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-800">{commission.repName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{commission.operationNumber}</td>
                  <td className="px-4 py-4 text-gray-600">{commission.date}</td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-[#1E293B]">
                      {commission.salesValue.toLocaleString()} ج.م
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">
                      {commission.commissionRate}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-[#10B981] text-lg">
                      {commission.netCommission.toLocaleString()} ج.م
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
