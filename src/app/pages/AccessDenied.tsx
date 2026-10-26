import { ShieldX, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

/**
 * Access Denied — shown when an authenticated user hits a route whose
 * screen permission they lack. Backend permissions remain authoritative;
 * this only blocks the visual screen.
 */
export function AccessDenied() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center">
        <ShieldX size={40} className="text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">
        {t('errors.accessDeniedTitle', 'غير مصرح بالوصول')}
      </h2>
      <p className="text-muted-foreground max-w-md">
        {t('errors.accessDeniedBody', 'ليس لديك صلاحية لعرض هذه الصفحة. تواصل مع المدير إذا كنت تعتقد أن هذا خطأ.')}
      </p>
      <button
        onClick={() => navigate(-1)}
        className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors"
      >
        <ArrowRight size={18} />
        {t('common.back', 'رجوع')}
      </button>
    </div>
  );
}
