import { useState } from 'react';
import { Mic, AlertTriangle, TrendingUp, CheckCircle, Bell, Code } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
// de el masora ele pta5od el kalam we teo7 peha le django 
import axios from 'axios';


// Interfaces
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

// Mock Data
const mockAnomalies: AnomalyLog[] = [
  { id: '1', employee: 'أحمد محمود', operationType: 'خصم استثنائي', value: 8500, reason: 'قيمة الخصم تجاوزت 60% من إجمالي الفاتورة', severity: 'high', timestamp: '2026-02-04 14:23', contextInfo: 'قام هذا المستخدم بـ 3 عمليات مشابهة هذا الشهر' },
  { id: '2', employee: 'فاطمة أحمد', operationType: 'تعديل سعر منتج', value: 12000, reason: 'تم تخفيض السعر بنسبة 45% عن السعر القياسي', severity: 'medium', timestamp: '2026-02-04 11:45', contextInfo: 'أول عملية من هذا النوع لهذا المستخدم' },
  { id: '3', employee: 'محمد علي', operationType: 'حذف فاتورة', value: 3200, reason: 'حذف فاتورة بعد 3 ساعات من إصدارها', severity: 'high', timestamp: '2026-02-04 09:15', contextInfo: 'قام هذا المستخدم بحذف 7 فواتير في آخر أسبوع' },
  { id: '4', employee: 'سارة حسن', operationType: 'عملية بيع خارج الدوام', value: 1500, reason: 'تمت العملية الساعة 23:45 (خارج ساعات العمل)', severity: 'low', timestamp: '2026-02-03 23:45', contextInfo: 'حدث مماثل حصل مرة واحدة في الشهر الماضي' },
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
  const [showResults, setShowResults] = useState(false);
  const [showSQL, setShowSQL] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>(''); // رد الذكاء الاصطناعي الحقيقي
  const [isLoading, setIsLoading] = useState(false);

  // pa5od 3 7agat men el maktpa ta7wel el kalam ele ento kolto (transcript) + (listening) 3ahan lampt el microphone + ((resetTranscript) 3ashan aktep 3la nadafa tany mara)
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  const handleVoiceCommand = async () => {
  if (listening) {
    // لو بنسمع ودست تاني، وقف الاستماع وابعت النص
    SpeechRecognition.stopListening();
    console.log("تم إيقاف الاستماع، النص المكتشف:", transcript); // للتأكد في الـ Console
    
    if (transcript) {
      setIsLoading(true);
      try {
        const response = await axios.post('http://127.0.0.1:8000/api/ai/ask/', {
          query: transcript,
          context_data: mockAnomalies 
        });
        setAiResponse(response.data.response);
        setShowResults(true);
      } catch (error) {
        console.error("خطأ في الاتصال بالباك إند:", error);
      } finally {
        setIsLoading(false);
      }
    }
  } else {
    // لو مش بنسمع، ابدأ اسمع من جديد
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

  return (
    <div className="h-full overflow-y-auto bg-[#0F172A] p-6 space-y-6 text-right" dir="rtl">
      {/* Voice Interface */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6 justify-start">
          <div className="w-10 h-10 bg-gradient-to-br from-[#60A5FA] to-[#6366F1] rounded-lg flex items-center justify-center">
            <Mic size={20} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">المساعد الصوتي الذكي</h2>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleVoiceCommand}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
              listening ? 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse' : 'bg-slate-700/50 hover:bg-slate-700'
            }`}
          >
            <Mic size={48} className="text-white" />
            {listening && <div className="absolute inset-0 rounded-full border-4 border-red-400/30 animate-ping"></div>}
          </button>

          {(listening || transcript) && (
            <div className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-sm mb-1">النص المكتشف:</p>
              <p className="text-white text-lg font-medium">"{transcript || 'جاري الاستماع...'}"</p>
            </div>
          )}

          {isLoading && <div className="text-blue-400 animate-bounce">جاري تحليل البيانات بواسطة Llama 3...</div>}
        </div>
      </div>

      {/* Anomaly Logs Table */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center gap-3 mb-6">
           <AlertTriangle className="text-orange-500" />
           <h2 className="text-xl font-bold text-white">سجل العمليات المشبوهة (Anomaly Logs)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="text-slate-400 border-b border-slate-700">
              <tr>
                <th className="pb-3 px-2">الموظف</th>
                <th className="pb-3 px-2">نوع العملية</th>
                <th className="pb-3 px-2">القيمة</th>
                <th className="pb-3 px-2">السبب</th>
                <th className="pb-3 px-2">الخطورة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {mockAnomalies.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50">
                  <td className="py-4 px-2 text-white">{log.employee}</td>
                  <td className="py-4 px-2 text-slate-300">{log.operationType}</td>
                  <td className="py-4 px-2 text-blue-400 font-bold">{log.value.toLocaleString()} ج.م</td>
                  <td className="py-4 px-2 text-slate-400 text-sm">{log.reason}</td>
                  <td className="py-4 px-2">{getSeverityBadge(log.severity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Analysis Output */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
           <h3 className="text-white font-bold mb-4 flex items-center gap-2">
             <TrendingUp size={18} className="text-blue-400" /> تحليل المبيعات والتوقعات
           </h3>
           <ResponsiveContainer width="100%" height={250}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{backgroundColor: '#1e293b'}} />
                <Line type="monotone" dataKey="actual" stroke="#94A3B8" />
                <Line type="monotone" dataKey="forecast" stroke="#60A5FA" strokeWidth={3} />
              </LineChart>
           </ResponsiveContainer>
        </div>

        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-2xl border border-indigo-500/30 p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" /> تحليل المساعد الذكي
          </h3>
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 min-h-[150px]">
            <p className="text-slate-200 text-sm leading-relaxed">
              {aiResponse || "اضغط على الميكروفون واسأل المساعد عن أي عملية أو تقرير للمبيعات..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}