import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MessageCircle, Send, X, Bot, Mic, Loader2 } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import apiClient from '../../api/axiosConfig';
import type { Screen } from '../App';

interface FloatingAIAssistantProps {
  onScreenChange: (screen: Screen) => void;
  currentUser: { username: string; role: string } | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
  'المندوبين': 'representatives',
  'مندوب': 'representatives',
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
  representatives: 'المناديب',
  quotations: 'عروض الأسعار',
  sales: 'سجل المبيعات',
  profile: 'الملف الشخصي',
  credit: 'الآجل والديون',
};

const commandPrefixes = ['اذهب الى', 'اذهب إلى', 'انتقل الى', 'انتقل إلى', 'روح الى', 'روح إلى', 'افتح', 'اعرض'];

const normalizeText = (text: string) =>
  text
    .replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

const FloatingAIAssistant = ({ onScreenChange, currentUser }: FloatingAIAssistantProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

    setIsLoading(true);
    try {
      const response = await apiClient.post('/ai/ask/', {
        command: trimmedMessage,
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
            {isLoading && (
              <div className="mb-3 flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-100">
                  <Loader2 className="animate-spin" size={16} />
                  <span>المساعد يكتب...</span>
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
                className="flex-1 resize-none rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
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
                disabled={isLoading}
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
};

export default FloatingAIAssistant;
