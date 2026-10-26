import { Compass, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

/** 404 — unknown route inside the authenticated app shell. */
export function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-20 h-20 rounded-2xl bg-[#3B82F6]/10 flex items-center justify-center">
        <Compass size={40} className="text-[#3B82F6]" />
      </div>
      <div className="text-6xl font-black text-muted-foreground/30">404</div>
      <h2 className="text-2xl font-bold text-foreground">
        {t('errors.notFoundTitle', 'الصفحة غير موجودة')}
      </h2>
      <p className="text-muted-foreground max-w-md">
        {t('errors.notFoundBody', 'الرابط الذي تحاول الوصول إليه غير موجود أو تم نقله.')}
      </p>
      <button
        onClick={() => navigate('/', { replace: true })}
        className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors"
      >
        <ArrowRight size={18} />
        {t('errors.goHome', 'العودة للرئيسية')}
      </button>
    </div>
  );
}
