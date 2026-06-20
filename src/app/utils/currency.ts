/**
 * Currency formatting utility with API-first dynamic currency support
 * 
 * ARCHITECTURE:
 * 1. API is the SOURCE OF TRUTH for currency settings
 * 2. localStorage is used only as CACHE/FALLBACK
 * 3. Event-based system notifies components of currency changes
 * 4. All formatCurrency() calls always use the latest cached value
 * 
 * To refresh currency from API: call refreshCurrencyFromAPI()
 * Components can listen for changes: window.addEventListener('currencyChanged', ...)
 */

import apiClient from '../../api/axiosConfig';

// Currency symbol mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  EGP: 'ج.م',
  SAR: 'ر.س',
  USD: '$',
  AED: 'د.إ',
};

// Currency locale mapping for proper formatting
const CURRENCY_LOCALES: Record<string, string> = {
  EGP: 'ar-EG',
  SAR: 'ar-SA',
  USD: 'en-US',
  AED: 'ar-AE',
};

// In-memory cache for current session (fastest)
let _currentCurrencyCode: string | null = null;

/**
 * Fetch currency directly from StoreSettings API (Source of Truth)
 * Updates localStorage cache and notifies listeners
 */
export const fetchCurrencyFromAPI = async (): Promise<string> => {
  try {
    const response = await apiClient.get('/settings/1/');
    const currency = response.data?.currency;
    
    if (currency && CURRENCY_SYMBOLS[currency]) {
      // Update in-memory cache
      _currentCurrencyCode = currency;
      
      // Update localStorage cache (for persistence)
      try {
        const settings = localStorage.getItem('storeSettings');
        const parsed = settings ? JSON.parse(settings) : {};
        parsed.currency = currency;
        localStorage.setItem('storeSettings', JSON.stringify(parsed));
      } catch (e) {
        console.warn('Failed to update currency cache in localStorage:', e);
      }
      
      // Notify all listeners that currency has changed
      window.dispatchEvent(new CustomEvent('currencyChanged', { 
        detail: { currency, symbol: CURRENCY_SYMBOLS[currency] }
      }));
      
      return currency;
    }
  } catch (error) {
    console.error('Failed to fetch currency from API:', error);
  }
  
  // Return cached value or fallback
  return getCurrencyCode();
};

/**
 * Get current currency code from cache (memory → localStorage → fallback)
 * This is fast and synchronous - uses cached value
 * Call fetchCurrencyFromAPI() first to ensure fresh data
 */
export const getCurrencyCode = (): string => {
  // 1. Check in-memory cache (fastest)
  if (_currentCurrencyCode && CURRENCY_SYMBOLS[_currentCurrencyCode]) {
    return _currentCurrencyCode;
  }
  
  // 2. Check localStorage cache
  try {
    const settings = localStorage.getItem('storeSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      if (parsed.currency && CURRENCY_SYMBOLS[parsed.currency]) {
        _currentCurrencyCode = parsed.currency; // Update memory cache
        return parsed.currency;
      }
    }
  } catch (e) {
    console.error('Error reading currency from localStorage:', e);
  }
  
  // 3. Fallback to EGP
  return 'EGP';
};

/**
 * Get currency symbol for current setting
 */
export const getCurrencySymbol = (): string => {
  return CURRENCY_SYMBOLS[getCurrencyCode()] || 'ج.م';
};

/**
 * Format a number as currency with current settings
 * Uses cached currency value (call fetchCurrencyFromAPI() to refresh)
 * 
 * Example: formatCurrency(1234.50) → "1,234.50 ج.م" (or based on currency setting)
 */
export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return `0.00 ${getCurrencySymbol()}`;
  }
  const num = Number(amount);
  const currencyCode = getCurrencyCode();
  const locale = CURRENCY_LOCALES[currencyCode] || 'ar-EG';
  const symbol = CURRENCY_SYMBOLS[currencyCode] || 'ج.م';
  
  return `${num.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ${symbol}`;
};

/**
 * Format a number as currency (compact form, no symbol)
 * Example: formatCurrencyCompact(1234.50) → "1,234.50"
 */
export const formatCurrencyCompact = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '0.00';
  }
  const num = Number(amount);
  const currencyCode = getCurrencyCode();
  const locale = CURRENCY_LOCALES[currencyCode] || 'ar-EG';
  
  return num.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * React hook compatible: Refresh currency and trigger re-render
 * Call this when Settings page saves new currency
 */
export const refreshCurrencyFromAPI = fetchCurrencyFromAPI;

/**
 * Subscribe to currency changes (for React components or other listeners)
 * Usage: subscribeToCurrencyChanges((event) => { console.log(event.detail.currency); })
 */
export const subscribeToCurrencyChanges = (
  callback: (event: CustomEvent<{ currency: string; symbol: string }>) => void
): (() => void) => {
  const handler = callback as EventListener;
  window.addEventListener('currencyChanged', handler);
  return () => window.removeEventListener('currencyChanged', handler);
};

/**
 * Static exports (resolved at import time - use getCurrencySymbol() for dynamic)
 */
export const CURRENCY_SYMBOL = getCurrencySymbol();
export const CURRENCY_CODE = getCurrencyCode();
