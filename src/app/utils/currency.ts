/**
 * Currency formatting utility for EGP (Egyptian Pound)
 * Use this across all components for consistent currency display
 */

/**
 * Format a number as Egyptian Pound currency
 * Example: formatCurrency(1234.50) → "1,234.50 ج.م"
 */
export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '0.00 ج.م';
  }
  const num = Number(amount);
  return `${num.toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ج.م`;
};

/**
 * Format a number as Egyptian Pound currency (compact form)
 * Example: formatCurrencyCompact(1234.50) → "1,234.50"
 */
export const formatCurrencyCompact = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '0.00';
  }
  const num = Number(amount);
  return num.toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Just the currency symbol
 */
export const CURRENCY_SYMBOL = 'ج.م';

/**
 * Just the currency code
 */
export const CURRENCY_CODE = 'EGP';
