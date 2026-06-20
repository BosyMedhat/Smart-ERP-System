import apiClient from '../../../api/axiosConfig';
import { TreasuryAccount, TreasuryTransaction, TreasurySummary, ManualEntryForm } from './types';

export async function fetchTreasurySummary(): Promise<TreasurySummary> {
  const res = await apiClient.get('treasury/transactions/summary/');
  return res.data;
}

export async function fetchTreasuryAccounts(): Promise<TreasuryAccount[]> {
  const res = await apiClient.get('treasury/accounts/');
  return res.data;
}

export async function fetchTransactions(params?: {
  account?: number;
  type?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
}): Promise<TreasuryTransaction[]> {
  const res = await apiClient.get('treasury/transactions/', { params });
  return res.data;
}

export async function postManualEntry(data: ManualEntryForm): Promise<TreasuryTransaction> {
  const res = await apiClient.post('treasury/transactions/manual/', data);
  return res.data;
}
