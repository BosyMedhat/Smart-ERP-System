export interface TreasuryAccount {
  id: number;
  name: 'CASH' | 'BANK' | 'VODAFONE' | 'INSTAPAY' | 'CARD';
  display_name: string;
  balance: string;
  is_active: boolean;
  created_at: string;
}

export interface TreasuryTransaction {
  id: number;
  account: number;
  account_name: string;
  transaction_type: 'INCOME' | 'EXPENSE' | 'ADJUSTMENT';
  transaction_type_display: string;
  category: string;
  category_display: string;
  amount: string;
  balance_after: string;
  description: string;
  reference_type: string;
  reference_id: number | null;
  created_by: number | null;
  created_by_name: string;
  is_auto: boolean;
  created_at: string;
}

export interface TreasurySummary {
  total_balance: string;
  today_income: string;
  today_expense: string;
  today_net: string;
  month_income: string;
  month_expense: string;
  month_net: string;
  accounts: TreasuryAccount[];
}

export interface ManualEntryForm {
  account_id: number;
  transaction_type: 'INCOME' | 'EXPENSE' | 'ADJUSTMENT';
  category: string;
  amount: string;
  description: string;
}
