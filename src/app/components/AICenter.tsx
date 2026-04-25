import { useState, useEffect } from 'react';
import { Mic, AlertTriangle, TrendingUp, CheckCircle, Brain, ShoppingCart, Package, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import apiClient from '../../api/axiosConfig';

// Types
interface Summary {
  total_sales_30_days: number;
  operations_count_30_days: number;
  forecast_next_week: number;
  low_stock_count: number;
}

interface TopProduct {
  product_name: string;
  total_qty: number;
  total_revenue: number;
}

interface LowStockAlert {
  name: string;
  current_stock: number;
  min_stock_level: number;
}

interface Anomaly {
  invoice: string;
  amount: number;
  customer: string;
  cashier: string;
  date: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
}

interface Recommendation {
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
  icon: string;
}

interface AnalyticsData {
  summary: Summary;
  top_products: TopProduct[];
  low_stock_alerts: LowStockAlert[];
  anomalies: Anomaly[];
  recommendations: Recommendation[];
  sales_trend: { month: string; actual: number | null; forecast: number | null }[];
}

export function AICenter() {
  // Voice state
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'anomalies' | 'stock'>('overview');

  // Fetch analytics on mount
  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await apiClient.get('/ai/analytics/');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleVoiceCommand = async () => {
    if (listening) {
      SpeechRecognition.stopListening();
      
      if (transcript) {
        setIsLoading(true);
        try {
          const response = await apiClient.post('/ai/ask/', {
            query: transcript,
            context_data: analytics?.anomalies || []
          });
          setAiResponse(response.data.response || response.data.status === 'error' 
            ? response.data.response 
            : 'عذراً، لم أفهم السؤال.');
        } catch (error) {
          console.error("خطأ في الاتصال بالباك إند:", error);
          setAiResponse('حدث خطأ في الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى.');
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      resetTranscript();
      setAiResponse('');
      SpeechRecognition.startListening({ language: 'ar-EG', continuous: true });
    }
  };

  const getSeverityBadge = (severity: string) => {
    const styles = {
      high: "bg-red-500/20 text-red-400 border-red-500/30",
      medium: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      low: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30"
    };
    const labels = { high: "خطر عالي", medium: "خطر متوسط", low: "خطر منخفض" };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${styles[severity as keyof typeof styles]}`}>
        {labels[severity as keyof typeof labels]}
      </span>
    );
  };

  const getRecommendationStyle = (type: string) => {
    const styles = {
      warning: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
      info: "bg-blue-500/10 border-blue-500/30 text-blue-400"
    };
    return styles[type as keyof typeof styles] || styles.info;
  };

  if (analyticsLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0F172A]">
        <div className="text-blue-400 animate-pulse flex items-center gap-3">
          <Brain className="animate-spin" size={24} />
          <span>جاري تحميل تحليلات الذكاء الاصطناعي...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0F172A] p-6 space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Brain size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">مركز الذكاء الاصطناعي</h1>
            <p className="text-slate-400 text-sm">تحليلات ذكية وتوقعات مبيعات</p>
          </div>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-2"
        >
          <Sparkles size={16} />
          تحديث التحليلات
        </button>
      </div>

      {/* Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl border border-blue-500/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-400 text-sm">مبيعات 30 يوم</span>
              <ShoppingCart size={18} className="text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{analytics.summary.total_sales_30_days.toLocaleString()} ج.م</p>
            <p className="text-blue-400/70 text-xs mt-1">{analytics.summary.operations_count_30_days} عملية</p>
          </div>

          <div className="bg-gradient-to-br from-violet-600/20 to-violet-800/20 rounded-xl border border-violet-500/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-violet-400 text-sm">توقع الأسبوع القادم</span>
              <TrendingUp size={18} className="text-violet-400" />
            </div>
            <p className="text-2xl font-bold text-white">{analytics.summary.forecast_next_week.toLocaleString()} ج.م</p>
            <p className="text-violet-400/70 text-xs mt-1">بناءً على التحليل الإحصائي</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 rounded-xl border border-emerald-500/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-400 text-sm">المنتجات المتوفرة</span>
              <CheckCircle size={18} className="text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">{analytics.top_products.length}+</p>
            <p className="text-emerald-400/70 text-xs mt-1">منتج نشط في المخزون</p>
          </div>

          <div className={`rounded-xl border p-4 ${analytics.summary.low_stock_count > 0 ? 'bg-gradient-to-br from-amber-600/20 to-amber-800/20 border-amber-500/30' : 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-slate-600/30'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={analytics.summary.low_stock_count > 0 ? 'text-amber-400' : 'text-slate-400'}>تنبيهات المخزون</span>
              <Package size={18} className={analytics.summary.low_stock_count > 0 ? 'text-amber-400' : 'text-slate-400'} />
            </div>
            <p className={`text-2xl font-bold ${analytics.summary.low_stock_count > 0 ? 'text-amber-400' : 'text-white'}`}>
              {analytics.summary.low_stock_count}
            </p>
            <p className={`text-xs mt-1 ${analytics.summary.low_stock_count > 0 ? 'text-amber-400/70' : 'text-slate-400/70'}`}>
              {analytics.summary.low_stock_count > 0 ? 'منتجات تحتاج إعادة طلب' : 'المخزون في حالة جيدة'}
            </p>
          </div>
        </div>
      )}

      {/* AI Chat & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Voice Chat */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#60A5FA] to-[#6366F1] rounded-lg flex items-center justify-center">
              <Mic size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">المساعد الصوتي الذكي</h2>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleVoiceCommand}
              disabled={isLoading}
              className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
                listening 
                  ? 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse' 
                  : isLoading 
                    ? 'bg-slate-600 cursor-not-allowed'
                    : 'bg-slate-700/50 hover:bg-slate-700 hover:scale-105'
              }`}
            >
              <Mic size={44} className="text-white" />
              {listening && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-red-400/30 animate-ping"></div>
                  <div className="absolute inset-[-8px] rounded-full border-2 border-red-400/20"></div>
                </>
              )}
            </button>

            <p className="text-slate-400 text-sm">
              {listening ? 'جاري الاستماع... اضغط مرة أخرى للإرسال' : 
               isLoading ? 'جاري التحليل بواسطة Llama 3...' : 
               'اضغط للتحدث مع المساعد'}
            </p>

            {(listening || transcript) && !isLoading && (
              <div className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3 text-center">
                <p className="text-slate-400 text-xs mb-1">النص المكتشف:</p>
                <p className="text-white font-medium">"{transcript || '...'}"</p>
              </div>
            )}
          </div>

          {/* AI Response */}
          <div className="mt-6 bg-slate-950/50 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-indigo-400" />
              <span className="text-indigo-400 text-sm font-medium">رد المساعد الذكي</span>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed min-h-[80px]">
              {aiResponse || "اسأل المساعد عن المبيعات أو المخزون أو أي استفسار..."}
            </p>
          </div>
        </div>

        {/* Sales Chart & Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommendations */}
          {analytics && analytics.recommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analytics.recommendations.map((rec, idx) => (
                <div key={idx} className={`rounded-xl border p-4 ${getRecommendationStyle(rec.type)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{rec.icon}</span>
                    <span className="font-bold">{rec.title}</span>
                  </div>
                  <p className="text-sm opacity-90">{rec.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Sales Trend Chart */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-400" />
              اتجاه المبيعات والتوقعات
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics?.sales_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(val) => val ? `${(val/1000).toFixed(0)}k` : ''} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(val: number) => val ? `${val.toLocaleString()} ج.م` : '-'}
                />
                <Line type="monotone" dataKey="actual" stroke="#60A5FA" strokeWidth={3} dot={{ fill: '#60A5FA' }} name="المبيعات" />
                <Line type="monotone" dataKey="forecast" stroke="#A78BFA" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#A78BFA' }} name="التوقع" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {[
          { key: 'overview', label: 'نظرة عامة', icon: Sparkles },
          { key: 'anomalies', label: 'العمليات المشبوهة', icon: AlertTriangle },
          { key: 'stock', label: 'المخزون المنخفض', icon: Package },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === key 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Anomalies Tab */}
        {activeTab === 'anomalies' && analytics && (
          <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="text-orange-500" />
              سجل العمليات المشبوهة (Anomaly Detection)
            </h3>
            {analytics.anomalies.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle size={48} className="mx-auto mb-3 text-emerald-400" />
                <p>لا توجد عمليات مشبوهة حالياً</p>
                <p className="text-sm opacity-70">النظام يعمل بشكل طبيعي</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="pb-3 px-3">الفاتورة</th>
                      <th className="pb-3 px-3">المبلغ</th>
                      <th className="pb-3 px-3">العميل</th>
                      <th className="pb-3 px-3">الكاشير</th>
                      <th className="pb-3 px-3">التاريخ</th>
                      <th className="pb-3 px-3">السبب</th>
                      <th className="pb-3 px-3">الخطورة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {analytics.anomalies.map((anomaly, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50">
                        <td className="py-4 px-3 text-white font-medium">{anomaly.invoice}</td>
                        <td className="py-4 px-3 text-blue-400 font-bold">{anomaly.amount.toLocaleString()} ج.م</td>
                        <td className="py-4 px-3 text-slate-300">{anomaly.customer}</td>
                        <td className="py-4 px-3 text-slate-300">{anomaly.cashier}</td>
                        <td className="py-4 px-3 text-slate-400">{anomaly.date}</td>
                        <td className="py-4 px-3 text-slate-400 text-sm">{anomaly.reason}</td>
                        <td className="py-4 px-3">{getSeverityBadge(anomaly.severity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Stock Tab */}
        {activeTab === 'stock' && analytics && (
          <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Package className="text-amber-500" />
              المنتجات ذات المخزون المنخفض
            </h3>
            {analytics.low_stock_alerts.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle size={48} className="mx-auto mb-3 text-emerald-400" />
                <p>جميع المنتجات في المخزون بكميات كافية</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.low_stock_alerts.map((product, idx) => (
                  <div key={idx} className="bg-slate-800/50 rounded-xl border border-amber-500/30 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{product.name}</span>
                      <span className="text-amber-400 text-xl">⚠️</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">المخزون:</span>
                        <span className="text-amber-400 font-bold mr-1">{product.current_stock}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">الحد الأدنى:</span>
                        <span className="text-slate-300 mr-1">{product.min_stock_level}</span>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (product.current_stock / product.min_stock_level) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Overview Tab - Top Products */}
        {activeTab === 'overview' && analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" />
                أكثر المنتجات مبيعاً (30 يوم)
              </h3>
              {analytics.top_products.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p>لا توجد بيانات مبيعات كافية</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.top_products.map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">{product.product_name}</p>
                          <p className="text-slate-400 text-sm">{product.total_qty} وحدة مباعة</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold">{product.total_revenue.toLocaleString()} ج.م</p>
                        <p className="text-slate-400 text-xs">إيرادات</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
              <h3 className="text-xl font-bold text-white mb-4">نصائح الذكاء الاصطناعي</h3>
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-blue-400 font-bold mb-2">💡 توصية للمبيعات</p>
                  <p className="text-slate-300 text-sm">
                    بناءً على تحليل البيانات، يُنصح بالتركيز على المنتجات الأكثر مبيعاً 
                    وتوفير مخزون إضافي منها لتجنب النفاد.
                  </p>
                </div>
                <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
                  <p className="text-violet-400 font-bold mb-2">📊 توقعات</p>
                  <p className="text-slate-300 text-sm">
                    التوقع يعتمد على متوسط المبيعات الأسبوعية خلال آخر 4 أسابيع.
                    دقة التوقع تزداد مع زيادة البيانات المتاحة.
                  </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <p className="text-emerald-400 font-bold mb-2">🛡️ الأمان</p>
                  <p className="text-slate-300 text-sm">
                    يتم فحص جميع المعاملات تلقائياً للكشف عن العمليات غير الطبيعية
                    باستخدام التحليل الإحصائي (Anomaly Detection).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}