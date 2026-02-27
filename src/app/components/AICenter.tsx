import { useState } from 'react';
import { Mic, AlertTriangle, TrendingUp, CheckCircle, Bell, Code } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnomalyLog {
  id: string;
  employee: string;
  operationType: string;
  value: number;
  reason: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  contextInfo: string;
}

interface VoiceQueryResult {
  productName: string;
  category: string;
  lastSaleDate: string;
  stockQty: number;
}

const mockAnomalies: AnomalyLog[] = [
  {
    id: '1',
    employee: 'أحمد محمود',
    operationType: 'خصم استثنائي',
    value: 8500,
    reason: 'قيمة الخصم تجاوزت 60% من إجمالي الفاتورة',
    severity: 'high',
    timestamp: '2026-02-04 14:23',
    contextInfo: 'قام هذا المستخدم بـ 3 عمليات مشابهة هذا الشهر',
  },
  {
    id: '2',
    employee: 'فاطمة أحمد',
    operationType: 'تعديل سعر منتج',
    value: 12000,
    reason: 'تم تخفيض السعر بنسبة 45% عن السعر القياسي',
    severity: 'medium',
    timestamp: '2026-02-04 11:45',
    contextInfo: 'أول عملية من هذا النوع لهذا المستخدم',
  },
  {
    id: '3',
    employee: 'محمد علي',
    operationType: 'حذف فاتورة',
    value: 3200,
    reason: 'حذف فاتورة بعد 3 ساعات من إصدارها',
    severity: 'high',
    timestamp: '2026-02-04 09:15',
    contextInfo: 'قام هذا المستخدم بحذف 7 فواتير في آخر أسبوع',
  },
  {
    id: '4',
    employee: 'سارة حسن',
    operationType: 'عملية بيع خارج الدوام',
    value: 1500,
    reason: 'تمت العملية الساعة 23:45 (خارج ساعات العمل)',
    severity: 'low',
    timestamp: '2026-02-03 23:45',
    contextInfo: 'حدث مماثل حصل مرة واحدة في الشهر الماضي',
  },
];

const mockQueryResults: VoiceQueryResult[] = [
  { productName: 'كاميرا Canon EOS', category: 'إلكترونيات', lastSaleDate: '2026-01-25', stockQty: 12 },
  { productName: 'حقيبة جلدية فاخرة', category: 'إكسسوارات', lastSaleDate: '2026-01-26', stockQty: 30 },
  { productName: 'نظارة شمسية', category: 'إكسسوارات', lastSaleDate: '2026-01-27', stockQty: 15 },
];

const forecastData = [
  { month: 'يناير', actual: 120000, forecast: null },
  { month: 'فبراير', actual: 135000, forecast: null },
  { month: 'مارس', actual: 145000, forecast: null },
  { month: 'أبريل', actual: null, forecast: 165000 },
  { month: 'مايو', actual: null, forecast: 180000 },
  { month: 'يونيو', actual: null, forecast: 195000 },
];

export function AICenter() {
  const [isListening, setIsListening] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSQL, setShowSQL] = useState(false);

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setShowResults(true);
      }, 2000);
    } else {
      setShowResults(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return (
          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold border border-red-500/30">
            خطر عالي
          </span>
        );
      case 'medium':
        return (
          <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold border border-orange-500/30">
            خطر متوسط
          </span>
        );
      case 'low':
        return (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold border border-yellow-500/30">
            خطر منخفض
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0F172A] p-6 space-y-6">
      {/* Voice-to-SQL Interface */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-[#60A5FA] to-[#6366F1] rounded-lg flex items-center justify-center">
            <Mic size={20} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">المساعد الصوتي الذكي</h2>
        </div>

        <div className="flex flex-col items-center gap-6">
          {/* Microphone Button */}
          <button
            onClick={toggleListening}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-gradient-to-br from-[#60A5FA] to-[#6366F1] shadow-lg shadow-blue-500/50 animate-pulse'
                : 'bg-slate-700/50 hover:bg-slate-700'
            }`}
          >
            <Mic size={48} className="text-white" />
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-400/20 animate-ping" style={{ animationDelay: '0.3s' }}></div>
              </>
            )}
          </button>

          {/* Voice Input Display */}
          {isListening && (
            <div className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-6 animate-fadeIn">
              <div className="text-slate-400 text-sm mb-2">تم اكتشاف الصوت:</div>
              <div className="text-white text-lg font-semibold">
                "أظهر لي تقرير المنتجات التي لم تُبع هذا الأسبوع"
              </div>
            </div>
          )}

          {/* SQL Query Box */}
          {showResults && (
            <div className="w-full space-y-4">
              <button
                onClick={() => setShowSQL(!showSQL)}
                className="flex items-center gap-2 text-[#60A5FA] hover:text-[#6366F1] transition-colors"
              >
                <Code size={16} />
                <span className="text-sm">SQL Query (For Nerds)</span>
              </button>

              {showSQL && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm text-green-400">
                  <code>
                    SELECT product_name, category, last_sale_date, stock_qty<br />
                    FROM products<br />
                    WHERE last_sale_date &lt; DATE_SUB(NOW(), INTERVAL 7 DAY)<br />
                    ORDER BY last_sale_date ASC;
                  </code>
                </div>
              )}

              {/* Dynamic Results Table */}
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700">
                  <h3 className="text-white font-semibold">نتائج الاستعلام الديناميكي</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/30">
                      <tr>
                        <th className="px-4 py-3 text-right text-slate-400 font-semibold text-sm">اسم المنتج</th>
                        <th className="px-4 py-3 text-right text-slate-400 font-semibold text-sm">التصنيف</th>
                        <th className="px-4 py-3 text-right text-slate-400 font-semibold text-sm">آخر عملية بيع</th>
                        <th className="px-4 py-3 text-right text-slate-400 font-semibold text-sm">الكمية المتبقية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {mockQueryResults.map((result, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 text-white">{result.productName}</td>
                          <td className="px-4 py-3 text-slate-300">{result.category}</td>
                          <td className="px-4 py-3 text-slate-300">{result.lastSaleDate}</td>
                          <td className="px-4 py-3 text-slate-300">{result.stockQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Anomaly Detection Logs */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <AlertTriangle size={20} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">سجل العمليات المشبوهة (Anomaly Logs)</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-right text-slate-300 font-semibold">الموظف</th>
                <th className="px-4 py-3 text-right text-slate-300 font-semibold">نوع العملية</th>
                <th className="px-4 py-3 text-right text-slate-300 font-semibold">القيمة</th>
                <th className="px-4 py-3 text-right text-slate-300 font-semibold">سبب الشك</th>
                <th className="px-4 py-3 text-right text-slate-300 font-semibold">مستوى الخطورة</th>
                <th className="px-4 py-3 text-center text-slate-300 font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {mockAnomalies.map((anomaly) => (
                <tr key={anomaly.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-4 py-4">
                    <div className="text-white font-semibold">{anomaly.employee}</div>
                    <div className="text-xs text-slate-400 mt-1">{anomaly.timestamp}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{anomaly.operationType}</td>
                  <td className="px-4 py-4">
                    <span className="text-[#60A5FA] font-bold">{anomaly.value.toLocaleString()} ج.م</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-slate-300 mb-1">{anomaly.reason}</div>
                    <div className="relative group/tooltip">
                      <div className="text-xs text-slate-500 cursor-help inline-flex items-center gap-1">
                        <AlertTriangle size={12} />
                        السياق التاريخي
                      </div>
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover/tooltip:block z-10">
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 whitespace-nowrap shadow-xl">
                          {anomaly.contextInfo}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">{getSeverityBadge(anomaly.severity)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1">
                        <CheckCircle size={14} />
                        تأكيد
                      </button>
                      <button className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1">
                        <Bell size={14} />
                        إبلاغ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Predictive Analytics */}
      <div className="grid grid-cols-3 gap-6">
        {/* Chart */}
        <div className="col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#60A5FA] to-[#6366F1] rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">توقعات الطلب المستقبلي</h2>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94A3B8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94A3B8" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend
                wrapperStyle={{ color: '#94A3B8' }}
                formatter={(value) => (
                  <span className="text-slate-300">
                    {value === 'actual' ? 'المبيعات السابقة' : 'التوقعات القادمة'}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#94A3B8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#94A3B8', r: 4 }}
                name="actual"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#60A5FA"
                strokeWidth={3}
                dot={{ fill: '#60A5FA', r: 5 }}
                name="forecast"
                filter="drop-shadow(0 0 8px rgba(96, 165, 250, 0.6))"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Smart Advice */}
        <div className="col-span-1 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-2xl border border-indigo-500/30 backdrop-blur-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-[#6366F1] to-purple-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">نصيحة ذكية</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-300 leading-relaxed">
                بناءً على تحليل الذكاء الاصطناعي، ننصح بطلب{' '}
                <span className="text-[#60A5FA] font-bold">500 قطعة إضافية</span> من{' '}
                <span className="text-white font-semibold">'السكر'</span> قبل بداية رمضان.
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-sm">تنبيه مخزون</span>
              </div>
              <div className="text-sm text-slate-300">
                من المتوقع نفاد مخزون{' '}
                <span className="text-white font-semibold">'لابتوب HP'</span> خلال{' '}
                <span className="text-orange-400 font-bold">15 يوم</span>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-green-400 font-semibold text-sm">فرصة نمو</span>
              </div>
              <div className="text-sm text-slate-300">
                زيادة متوقعة <span className="text-green-400 font-bold">+25%</span> في مبيعات{' '}
                <span className="text-white font-semibold">'الإلكترونيات'</span> الشهر القادم
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
