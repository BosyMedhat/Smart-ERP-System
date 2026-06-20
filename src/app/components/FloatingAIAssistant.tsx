import { useState, useEffect, useMemo, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { MessageCircle, Send, X, Bot, Mic, Loader2, CheckCircle, XCircle, Play } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import apiClient from '../../api/axiosConfig';
import type { Screen } from '../App';

export interface FloatingAIAssistantHandle {
  addDemoMessage: (content: string) => void;
  addDemoActionMessage: (content: string) => void;
  openPanel: () => void;
  clearDemoMessages: () => void;
}

interface FloatingAIAssistantProps {
  onScreenChange: (screen: Screen) => void;
  currentUser: { username: string; role: string } | null;
  onStartDemo?: () => void;
  isDemoRunning?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ActionParseData {
  account_id: number;
  transaction_type: string;
  category: string;
  amount: string;
  description: string;
}

interface ActionParseResult {
  intent: string;
  confidence?: number;
  requires_confirmation: boolean;
  requires_extra_confirmation?: boolean;
  parser?: string;
  data?: ActionParseData;
  preview_message?: string;
  error?: string;
  original_command: string;
}

interface PendingAction {
  parseResult: ActionParseResult;
  originalCommand: string;
}

type NavigationEntries = [string, Screen][];

type ScreenLabels = Record<Screen, string>;

const navigationMap: Record<string, Screen> = {
  'نقطة البيع': 'pos',
  'الكاشير': 'pos',
  'بيع': 'pos',
  'المخزون': 'inventory',
  'المخزن': 'inventory',
  'البضاعة': 'inventory',
  'الرئيسية': 'home',
  'الرئيسي': 'home',
  'الصفحة الرئيسية': 'home',
  'التقارير': 'reports',
  'تقرير': 'reports',
  'الذكاء': 'ai',
  'الذكاء الاصطناعي': 'ai',
  'المساعد': 'ai',
  'الموارد البشرية': 'hr',
  'الموظفين': 'hr',
  'hr': 'hr',
  'الإعدادات': 'settings',
  'الإعداد': 'settings',
  'المستخدمين': 'roles',
  'المستخدمون': 'roles',
  'الموردين': 'suppliers',
  'المورد': 'suppliers',
  'الأقساط': 'installments',
  'قسط': 'installments',
  'عروض الأسعار': 'quotations',
  'عرض سعر': 'quotations',
  'المبيعات': 'sales',
  'المبيع': 'sales',
  'الآجل': 'credit',
  'الديون': 'credit',
  'الملف الشخصي': 'profile',
  'حسابي': 'profile',
};

const screenLabels: ScreenLabels = {
  pos: 'نقطة البيع',
  inventory: 'المخزون',
  home: 'الصفحة الرئيسية',
  reports: 'التقارير',
  ai: 'الذكاء الاصطناعي',
  automation: 'الأتمتة',
  hr: 'الموارد البشرية',
  settings: 'الإعدادات',
  roles: 'إدارة المستخدمين',
  suppliers: 'الموردين',
  installments: 'إدارة الأقساط',
  quotations: 'عروض الأسعار',
  sales: 'سجل المبيعات',
  profile: 'الملف الشخصي',
  credit: 'الآجل والديون',
  treasury: 'الخزينة',
  audit: 'سجل التدقيق',
  pl: 'الأرباح والخسائر',
  customers_pos: 'عملاء نقطة البيع',
};

const commandPrefixes = ['اذهب الى', 'اذهب إلى', 'انتقل الى', 'انتقل إلى', 'روح الى', 'روح إلى', 'افتح', 'اعرض'];

const ACTION_TRIGGERS = [
  'سجل مصروف', 'سجل صرف',
  'مصروف', 'مصاريف', 'صرف',
  'ادفع', 'دفعت', 'دفع',
  'خصم', 'ادفع مصاريف',
  'سددت',
  'تكلفه', 'تكاليف',
  'فاتوره كهرباء', 'فاتوره ايجار',
  'دفعت كهرباء', 'دفعت ايجار',
];

const normalizeActionText = (text: string): string =>
  text
    .replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u0610-\u061A\u064B-\u065F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const isActionCommand = (message: string): boolean => {
  const normalized = normalizeActionText(message);
  return ACTION_TRIGGERS.some((t) => normalized.includes(normalizeActionText(t)));
};

const normalizeText = (text: string) =>
  text
    .replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

const FloatingAIAssistant = forwardRef<FloatingAIAssistantHandle, FloatingAIAssistantProps>(
  ({ onScreenChange, currentUser, onStartDemo, isDemoRunning }, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [demoActionMessage, setDemoActionMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    addDemoMessage: (content: string) => {
      setMessages((prev) => [...prev, { role: 'assistant', content }]);
    },
    addDemoActionMessage: (content: string) => {
      setDemoActionMessage(content);
    },
    openPanel: () => {
      setIsExpanded(true);
    },
    clearDemoMessages: () => {
      setDemoActionMessage(null);
    },
  }), []);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const navigationEntries: NavigationEntries = useMemo(
    () => Object.entries(navigationMap) as NavigationEntries,
    []
  );

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (isExpanded && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            'مرحباً! أنا مساعدك الذكي. يمكنني مساعدتك في التنقل بين الشاشات أو الإجابة على أسئلتك. جرّب أن تقول: اذهب إلى المخزون',
        },
      ]);
    }
  }, [isExpanded, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  const findNavigationMention = useCallback(
    (message: string): { screen: Screen; keyword: string } | null => {
      const normalizedMessage = normalizeText(message);
      for (const [keyword, screen] of navigationEntries) {
        const normalizedKeyword = normalizeText(keyword);
        if (normalizedMessage.includes(normalizedKeyword)) {
          return { screen, keyword };
        }
      }
      return null;
    },
    [navigationEntries]
  );

  const detectPureNavigation = useCallback(
    (message: string): Screen | null => {
      const normalizedMessage = normalizeText(message);
      for (const [keyword, screen] of navigationEntries) {
        const normalizedKeyword = normalizeText(keyword);
        if (normalizedMessage === normalizedKeyword) {
          return screen;
        }
        if (
          commandPrefixes.some(
            (prefix) => normalizedMessage === `${normalizeText(prefix)} ${normalizedKeyword}`
          )
        ) {
          return screen;
        }
        if (
          commandPrefixes.some(
            (prefix) => normalizedMessage === `${normalizeText(prefix)} ${normalizedKeyword}`
          )
        ) {
          return screen;
        }
      }
      return null;
    },
    [navigationEntries]
  );

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
    setErrorMessage('');
    if (!isExpanded) {
      resetTranscript();
    }
  };

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const handleNavigation = useCallback(
    (screen: Screen, showConfirmation: boolean) => {
      onScreenChange(screen);
      if (showConfirmation) {
        addMessage({
          role: 'assistant',
          content: `تم الانتقال إلى ${screenLabels[screen]}`,
        });
      }
    },
    [addMessage, onScreenChange]
  );

  const sendMessage = async () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isLoading) {
      return;
    }

    addMessage({ role: 'user', content: trimmedMessage });
    setInputValue('');
    setErrorMessage('');

    const pureNavigationScreen = detectPureNavigation(trimmedMessage);
    if (pureNavigationScreen) {
      handleNavigation(pureNavigationScreen, true);
      return;
    }

    try {
      SpeechRecognition.stopListening();
    } catch (error) {
      // Ignored – safe guard if not supported
    }

    // Route action commands to parse endpoint
    if (isActionCommand(trimmedMessage)) {
      setIsLoading(true);
      try {
        const response = await apiClient.post('/ai/action/parse/', {
          message: trimmedMessage,
          source: 'FLOATING_AI_ASSISTANT',
        });
        const result: ActionParseResult = {
          ...response.data,
          original_command: trimmedMessage,
        };

        if (result.intent === 'unknown' || result.error) {
          addMessage({
            role: 'assistant',
            content: result.error || 'لم أتمكن من فهم الأمر كإجراء مالي.',
          });
        } else if (result.requires_confirmation && result.data) {
          setPendingAction({ parseResult: result, originalCommand: trimmedMessage });
        } else {
          addMessage({
            role: 'assistant',
            content: result.error || 'لم أتمكن من معالجة الطلب.',
          });
        }
      } catch (err: any) {
        const errMsg: string = err?.response?.data?.error || 'حدث خطأ. تأكد من صلاحياتك وحاول مجدداً.';
        addMessage({ role: 'assistant', content: errMsg });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Regular chat — send to /ai/ask/ (fixed: query not command)
    setIsLoading(true);
    try {
      const response = await apiClient.post('/ai/ask/', {
        query: trimmedMessage,
      });
      const answer: string = response.data?.response || 'تم استلام سؤالك وسيتم الرد قريباً.';
      addMessage({ role: 'assistant', content: answer });
    } catch (error) {
      setErrorMessage('حدث خطأ أثناء التواصل مع المساعد. حاول مجدداً.');
      addMessage({
        role: 'assistant',
        content: 'لم أستطع الحصول على رد الآن. يرجى المحاولة مرة أخرى لاحقاً.',
      });
    } finally {
      setIsLoading(false);
    }

    const navigationMention = findNavigationMention(trimmedMessage);
    if (navigationMention) {
      handleNavigation(navigationMention.screen, false);
    }
  };

  const handleConfirmAction = useCallback(async () => {
    if (!pendingAction) return;
    setIsExecuting(true);
    const { parseResult, originalCommand } = pendingAction;
    setPendingAction(null);
    try {
      const response = await apiClient.post('/ai/action/execute/', {
        source: 'FLOATING_AI_ASSISTANT',
        original_command: originalCommand,
        intent: parseResult.intent,
        parser: parseResult.parser || 'unknown',
        data: parseResult.data,
      });
      const txId: number = response.data?.transaction_id;
      const msg: string = response.data?.message || 'تم تنفيذ العملية بنجاح.';
      addMessage({
        role: 'assistant',
        content: `✅ ${msg}${txId ? ` (رقم العملية: ${txId})` : ''}`,
      });
    } catch (err: any) {
      const errMsg: string = err?.response?.data?.error || 'فشل تنفيذ العملية. حاول مجدداً.';
      addMessage({ role: 'assistant', content: `❌ ${errMsg}` });
    } finally {
      setIsExecuting(false);
    }
  }, [pendingAction, addMessage]);

  const handleCancelAction = useCallback(() => {
    setPendingAction(null);
    addMessage({
      role: 'assistant',
      content: 'تم إلغاء العملية، لم يتم تسجيل أي مصروف.',
    });
  }, [addMessage]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleMicClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      return;
    }
    setErrorMessage('');
    resetTranscript();
    SpeechRecognition.startListening({ language: 'ar-EG', continuous: false });
  };

  const handlePanelClose = () => {
    setIsExpanded(false);
    setErrorMessage('');
    if (listening) {
      SpeechRecognition.stopListening();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" dir="rtl">
      {isExpanded && (
        <div className="mb-4 w-[360px] sm:w-[400px] h-[480px] rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">المساعد الذكي</span>
                {currentUser && (
                  <span className="text-xs text-blue-100">
                    مرحباً، {currentUser.username} ({currentUser.role})
                  </span>
                )}
              </div>
            </div>
            {onStartDemo && !isDemoRunning && (
              <button
                type="button"
                onClick={onStartDemo}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all"
                title="بدء العرض التوضيحي الذكي"
              >
                <Play size={11} />
                عرض
              </button>
            )}
            <button
              type="button"
              onClick={handlePanelClose}
              className="rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="إغلاق المساعد"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}-${message.content.slice(0, 10)}`}
                className={`mb-3 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed shadow-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* Action confirmation card */}
            {pendingAction && (
              <div className="mb-3 flex justify-start">
                <div className="max-w-[90%] rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm shadow-sm dark:border-amber-600 dark:bg-amber-900/30">
                  <p className="mb-1 font-semibold text-amber-800 dark:text-amber-300">⚠️ تأكيد إجراء مالي</p>
                  <p className="mb-3 text-gray-800 dark:text-gray-100">
                    {pendingAction.parseResult.preview_message}
                  </p>
                  {pendingAction.parseResult.requires_extra_confirmation && (
                    <p className="mb-2 text-xs text-red-600 dark:text-red-400">
                      ⚠️ المبلغ كبير — يرجى التأكد قبل المتابعة.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmAction}
                      disabled={isExecuting}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isExecuting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      تأكيد
                    </button>
                    <button
                      onClick={handleCancelAction}
                      disabled={isExecuting}
                      className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                    >
                      <XCircle size={12} />
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}

            {demoActionMessage && (
              <div className="mb-3 flex justify-start">
                <div className="max-w-[90%] rounded-xl border border-blue-300/50 bg-blue-50 px-4 py-2.5 text-sm shadow-sm dark:border-blue-700 dark:bg-blue-900/20">
                  <p className="text-blue-700 dark:text-blue-300 font-medium">{demoActionMessage}</p>
                </div>
              </div>
            )}

            {(isLoading || isExecuting) && (
              <div className="mb-3 flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-100">
                  <Loader2 className="animate-spin" size={16} />
                  <span>{isExecuting ? 'جارٍ تنفيذ العملية...' : 'المساعد يكتب...'}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            {errorMessage && (
              <p className="mb-2 text-xs text-red-500">{errorMessage}</p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                className="flex-1 resize-none rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 disabled:opacity-50"
              disabled={isDemoRunning}
                rows={2}
                placeholder="اكتب رسالتك هنا..."
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              {browserSupportsSpeechRecognition && (
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                    listening
                      ? 'bg-red-500 text-white shadow-lg animate-pulse'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100'
                  }`}
                  aria-label={listening ? 'إيقاف الميكروفون' : 'تشغيل الميكروفون'}
                >
                  <Mic size={20} />
                </button>
              )}
              <button
                type="button"
                onClick={sendMessage}
                className="flex h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
                disabled={isLoading || isDemoRunning}
              >
                <Send size={18} className="ml-1" />
                إرسال
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition hover:bg-blue-700"
        aria-label={isExpanded ? 'إخفاء المساعد الذكي' : 'إظهار المساعد الذكي'}
      >
        {isExpanded ? <Bot size={28} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
  }
);

FloatingAIAssistant.displayName = 'FloatingAIAssistant';

export default FloatingAIAssistant;
