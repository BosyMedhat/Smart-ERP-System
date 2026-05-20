import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchTreasurySummary, fetchTransactions, postManualEntry } from './treasuryApi';
import type { TreasurySummary, TreasuryTransaction, ManualEntryForm } from './types';

/* ────────────────────────────────────
   حساب الخزينة
──────────────────────────────────── */
function AccountCard({ account }: { account: { display_name: string; balance: string; name: string } }) {
  const { t } = useTranslation();
  const ICONS: Record<string, string> = {
    CASH: '💵', BANK: '🏦', VODAFONE: '📱', INSTAPAY: '⚡', CARD: '💳',
  };
  const balance = parseFloat(account.balance);
  const isNegative = balance < 0;

  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 border border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{ICONS[account.name] ?? '💰'}</span>
        <span className="text-xs text-gray-400">{account.display_name}</span>
      </div>
      <div className={`text-xl font-bold ${isNegative ? 'text-red-600' : 'text-green-700'}`}>
        {balance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} {t('common.currency')}
      </div>
    </div>
  );
}

/* ────────────────────────────────────
   صف حركة
──────────────────────────────────── */
function TransactionRow({ tx }: { tx: TreasuryTransaction }) {
  const { t } = useTranslation();
  const isIncome = tx.transaction_type === 'INCOME';
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 text-sm">
      <td className="py-2 px-3 text-gray-500 whitespace-nowrap">
        {new Date(tx.created_at).toLocaleDateString('ar-EG')}
      </td>
      <td className="py-2 px-3">{tx.account_name}</td>
      <td className="py-2 px-3">{tx.category_display}</td>
      <td className="py-2 px-3 max-w-xs truncate text-gray-600">{tx.description}</td>
      <td className={`py-2 px-3 font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
        {isIncome ? '+' : '-'}{parseFloat(tx.amount).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} {t('common.currency')}
      </td>
      <td className="py-2 px-3 text-gray-500">
        {parseFloat(tx.balance_after).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} {t('common.currency')}
      </td>
      <td className="py-2 px-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${tx.is_auto ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
          {tx.is_auto ? t('treasury.automatic') : t('treasury.manual')}
        </span>
      </td>
    </tr>
  );
}

/* ────────────────────────────────────
   نموذج الإدخال اليدوي
──────────────────────────────────── */
function ManualEntryModal({
  accounts,
  onClose,
  onSuccess,
}: {
  accounts: { id: number; display_name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ManualEntryForm>({
    account_id: accounts[0]?.id ?? 1,
    transaction_type: 'EXPENSE',
    category: 'MANUAL',
    amount: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.amount || !form.description) {
      setError(t('errors.validationError'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await postManualEntry(form);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(t('errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">{t('treasury.manualEntry')}</h2>

        <div className="flex flex-col gap-3">
          <select className="border rounded-lg p-2 text-sm"
            value={form.account_id}
            onChange={e => setForm(f => ({ ...f, account_id: Number(e.target.value) }))}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.display_name}</option>)}
          </select>

          <select className="border rounded-lg p-2 text-sm"
            value={form.transaction_type}
            onChange={e => setForm(f => ({ ...f, transaction_type: e.target.value as any }))}>
            <option value="INCOME">{t('treasury.income')}</option>
            <option value="EXPENSE">{t('treasury.expense')}</option>
            <option value="ADJUSTMENT">{t('treasury.adjustment')}</option>
          </select>

          <select className="border rounded-lg p-2 text-sm"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            <option value="MANUAL">إدخال يدوي</option>
            <option value="RENT">إيجار</option>
            <option value="ELECTRICITY">كهرباء</option>
            <option value="MAINTENANCE">صيانة</option>
            <option value="OTHER">أخرى</option>
          </select>

          <input type="number" placeholder={t('common.total')} min="0" step="0.01"
            className="border rounded-lg p-2 text-sm"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />

          <input type="text" placeholder={t('common.notes')}
            className="border rounded-lg p-2 text-sm"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-2 mt-2">
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {loading ? t('common.loading') : t('common.save')}
            </button>
            <button onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-200">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────
   الصفحة الرئيسية
──────────────────────────────────── */
export default function TreasuryDashboard() {
  const { t } = useTranslation();
  const [summary, setSummary]           = useState<TreasurySummary | null>(null);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [filter, setFilter]             = useState({ type: '', date_from: '', date_to: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, t] = await Promise.all([
        fetchTreasurySummary(),
        fetchTransactions({
          type:      filter.type      || undefined,
          date_from: filter.date_from || undefined,
          date_to:   filter.date_to   || undefined,
        }),
      ]);
      setSummary(s);
      setTransactions(t);
    } catch {
      setError(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      {t('common.loading')}
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">💰 {t('treasury.title')}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
          + {t('treasury.manualEntry')}
        </button>
      </div>

      {/* بطاقات الملخص */}
      {summary && (
        <>
          {/* إجمالي الرصيد */}
          <div className="bg-gradient-to-l from-blue-600 to-blue-800 text-white rounded-2xl p-5 mb-6 shadow-lg">
            <p className="text-sm opacity-80 mb-1">{t('treasury.totalBalance')}</p>
            <p className="text-3xl font-bold">
              {parseFloat(summary.total_balance).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} {t('common.currency')}
            </p>
          </div>

          {/* حسابات الخزينة */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {summary.accounts.map(acc => <AccountCard key={acc.id} account={acc} />)}
          </div>

          {/* إحصائيات اليوم والشهر */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {[
              { label: t('treasury.todayIncome'),    value: summary.today_income,  color: 'text-green-600' },
              { label: t('treasury.todayExpense'),    value: summary.today_expense, color: 'text-red-600' },
              { label: t('treasury.todayNet'),   value: summary.today_net,     color: parseFloat(summary.today_net) >= 0 ? 'text-green-600' : 'text-red-600' },
              { label: t('treasury.monthIncome'),    value: summary.month_income,  color: 'text-green-600' },
              { label: t('treasury.monthExpense'),    value: summary.month_expense, color: 'text-red-600' },
              { label: t('treasury.monthNet'),   value: summary.month_net,     color: parseFloat(summary.month_net) >= 0 ? 'text-green-600' : 'text-red-600' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-xl shadow p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>
                  {parseFloat(item.value).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} {t('common.currency')}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* فلاتر */}
      <div className="bg-white rounded-xl shadow p-4 mb-4 flex flex-wrap gap-3 items-end border border-gray-100">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">{t('treasury.transactionType')}</label>
          <select className="border rounded-lg p-2 text-sm"
            value={filter.type}
            onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
            <option value="">{t('common.filter')}</option>
            <option value="INCOME">{t('treasury.income')}</option>
            <option value="EXPENSE">{t('treasury.expense')}</option>
            <option value="ADJUSTMENT">{t('treasury.adjustment')}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">{t('reports.dateFrom')}</label>
          <input type="date" className="border rounded-lg p-2 text-sm"
            value={filter.date_from}
            onChange={e => setFilter(f => ({ ...f, date_from: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">{t('reports.dateTo')}</label>
          <input type="date" className="border rounded-lg p-2 text-sm"
            value={filter.date_to}
            onChange={e => setFilter(f => ({ ...f, date_to: e.target.value }))} />
        </div>
        <button onClick={load}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800">
          🔍 {t('common.search')}
        </button>
        <button onClick={() => setFilter({ type: '', date_from: '', date_to: '' })}
          className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
          {t('common.reset')}
        </button>
      </div>

      {/* جدول الحركات */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-xs text-gray-500 border-b">
            <tr>
              <th className="py-3 px-3">{t('common.date')}</th>
              <th className="py-3 px-3">{t('treasury.account')}</th>
              <th className="py-3 px-3">التصنيف</th>
              <th className="py-3 px-3">{t('common.notes')}</th>
              <th className="py-3 px-3">{t('common.total')}</th>
              <th className="py-3 px-3">{t('treasury.balanceAfter')}</th>
              <th className="py-3 px-3">{t('treasury.transactionType')}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  {t('treasury.noTransactions')}
                </td>
              </tr>
            ) : (
              transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Modal الإدخال اليدوي */}
      {showModal && summary && (
        <ManualEntryModal
          accounts={summary.accounts}
          onClose={() => setShowModal(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
