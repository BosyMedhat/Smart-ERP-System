import { TreasuryAccount, TreasuryTransaction, TreasurySummary, ManualEntryForm } from './types';

const BASE_URL = 'http://127.0.0.1:8000';

function getHeaders() {
  try {
    const raw = localStorage.getItem('erp_user');
    if (!raw) return { 'Content-Type': 'application/json' };
    const user = JSON.parse(raw);
    const token = user?.token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
}

export async function fetchTreasurySummary(): Promise<TreasurySummary> {
  const res = await fetch(`${BASE_URL}/api/treasury/transactions/summary/`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('فشل تحميل ملخص الخزينة');
  return res.json();
}

export async function fetchTreasuryAccounts(): Promise<TreasuryAccount[]> {
  const res = await fetch(`${BASE_URL}/api/treasury/accounts/`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('فشل تحميل حسابات الخزينة');
  return res.json();
}

export async function fetchTransactions(params?: {
  account?: number;
  type?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
}): Promise<TreasuryTransaction[]> {
  const query = new URLSearchParams();
  if (params?.account)   query.append('account',   String(params.account));
  if (params?.type)      query.append('type',       params.type);
  if (params?.category)  query.append('category',   params.category);
  if (params?.date_from) query.append('date_from',  params.date_from);
  if (params?.date_to)   query.append('date_to',    params.date_to);

  const res = await fetch(
    `${BASE_URL}/api/treasury/transactions/?${query.toString()}`,
    { headers: getHeaders() }
  );
  if (!res.ok) throw new Error('فشل تحميل الحركات');
  return res.json();
}

export async function postManualEntry(data: ManualEntryForm): Promise<TreasuryTransaction> {
  const res = await fetch(`${BASE_URL}/api/treasury/transactions/manual/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}
