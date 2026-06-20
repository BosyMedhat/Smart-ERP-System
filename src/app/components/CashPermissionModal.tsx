import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, DollarSign, Loader2, AlertCircle, CheckCircle, Printer } from 'lucide-react';
import { fetchTreasuryAccounts, postManualEntry } from './treasury/treasuryApi';
import type { TreasuryAccount } from './treasury/types';

interface CashItem {
  id: number;
  description: string;
  quantity: number;
  amount: number;
}

interface CashPermissionModalProps {
  onClose: () => void;
}

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

export function CashPermissionModal({ onClose }: CashPermissionModalProps) {
  const [items, setItems] = useState<CashItem[]>([
    { id: Date.now(), description: '', quantity: 1, amount: 0 },
  ]);
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  // Fetch treasury accounts on mount
  useEffect(() => {
    const loadAccounts = async () => {
      setLoading(true);
      setError('');
      try {
        const accs = await fetchTreasuryAccounts();
        setAccounts(accs);
        // Select first active CASH account as default
        const cashAccount = accs.find(a => a.name === 'CASH' && a.is_active);
        if (cashAccount) {
          setSelectedAccountId(cashAccount.id);
        } else if (accs.length > 0) {
          setSelectedAccountId(accs[0].id);
        }
      } catch (err: any) {
        setError('فشل في تحميل حسابات الخزينة. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, []);

  const addItem = () => {
    const newId = Date.now();
    setItems([...items, { id: newId, description: '', quantity: 1, amount: 0 }]);
    setValidationErrors([]);
  };

  const removeItem = (id: number) => {
    if (items.length === 1) {
      // Keep at least one item, just clear it
      setItems([{ id: Date.now(), description: '', quantity: 1, amount: 0 }]);
    } else {
      setItems(items.filter((item) => item.id !== id));
    }
    setValidationErrors([]);
  };

  const updateItem = (
    id: number,
    field: keyof CashItem,
    value: string | number
  ) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === 'description' ? value : Number(value),
            }
          : item
      )
    );
    setValidationErrors([]);
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.amount, 0);

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (items.length === 0) {
      errors.push('يجب إضافة بند صرف واحد على الأقل');
    }

    if (!selectedAccountId) {
      errors.push('يرجى اختيار حساب خزينة');
    }

    items.forEach((item, index) => {
      if (!item.description.trim()) {
        errors.push(`البند ${index + 1}: وصف المصروف مطلوب`);
      }
      if (item.quantity <= 0) {
        errors.push(`البند ${index + 1}: الكمية يجب أن تكون أكبر من صفر`);
      }
      if (item.amount <= 0) {
        errors.push(`البند ${index + 1}: المبلغ يجب أن يكون أكبر من صفر`);
      }
    });

    if (total <= 0) {
      errors.push('الإجمالي الكلي يجب أن يكون أكبر من صفر');
    }

    return errors;
  };

  const buildDescription = (): string => {
    const lines = items.map((item, index) => {
      const lineTotal = item.quantity * item.amount;
      return `${index + 1}) ${item.description} - الكمية: ${item.quantity} - سعر الوحدة: ${item.amount} - الإجمالي: ${lineTotal}`;
    });
    return `إذن صرف نقدية:\n${lines.join('\n')}\nالإجمالي: ${total}`;
  };

  const getCurrentUser = (): { name?: string } | null => {
    try {
      const raw = localStorage.getItem('erp_user');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const generatePrintContent = (): string => {
    const user = getCurrentUser();
    const now = new Date().toLocaleString('ar-EG');
    const account = accounts.find(a => a.id === selectedAccountId);

    const itemRows = items.map((item, index) => {
      const lineTotal = item.quantity * item.amount;
      return `
        <tr>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: right;">${item.description}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.quantity}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.amount.toLocaleString()}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">${lineTotal.toLocaleString()}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>إذن صرف نقدية</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: 14px;
            color: #666;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
            border: 1px solid #000;
            padding: 10px;
            text-align: center;
          }
          .total-row {
            background-color: #f9f9f9;
            font-weight: bold;
            font-size: 16px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #ccc;
          }
          .signature-box {
            text-align: center;
            width: 30%;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 5px;
            font-size: 12px;
          }
          .print-btn {
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin: 20px auto;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">إذن صرف نقدية</div>
          <div class="subtitle">نظام Go Easy Store - Smart ERP</div>
        </div>

        <div class="info-row">
          <span><strong>التاريخ:</strong> ${now}</span>
          <span><strong>رقم الإذن:</strong> CD-${Date.now().toString().slice(-6)}</span>
        </div>

        <div class="info-row">
          <span><strong>الخزينة:</strong> ${account?.display_name || 'غير محدد'}</span>
          <span><strong>أنشأه:</strong> ${user?.name || 'غير معروف'}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 8%;">#</th>
              <th style="width: 40%;">البيان</th>
              <th style="width: 15%;">الكمية</th>
              <th style="width: 20%;">سعر الوحدة (ج.م)</th>
              <th style="width: 17%;">الإجمالي (ج.م)</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            <tr class="total-row">
              <td colspan="4" style="border: 1px solid #000; padding: 10px; text-align: left;">الإجمالي الكلي:</td>
              <td style="border: 1px solid #000; padding: 10px; text-align: center;">${total.toLocaleString()} ج.م</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 30px; font-size: 14px;">
          <strong>المبلغ كتابة:</strong> ${numberToArabicWords(total)} جنيه مصري
        </div>

        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line">المستلم</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">أمين الخزنة</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">المدير</div>
          </div>
        </div>

        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
          هذا الإذن صادر من نظام Go Easy Store - Smart ERP System
        </div>

        <button class="print-btn no-print" onclick="window.print()">
          طباعة الإذن
        </button>
      </body>
      </html>
    `;
  };

  const numberToArabicWords = (num: number): string => {
    if (num === 0) return 'صفر';
    
    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
    
    const parts: string[] = [];
    let n = Math.floor(num);
    
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      if (thousands === 1) {
        parts.push('ألف');
      } else if (thousands === 2) {
        parts.push('ألفان');
      } else if (thousands <= 10) {
        parts.push(`${ones[thousands]} آلاف`);
      } else {
        parts.push(`${thousands} ألف`);
      }
      n = n % 1000;
    }
    
    if (n >= 100) {
      parts.push(hundreds[Math.floor(n / 100)]);
      n = n % 100;
    }
    
    if (n >= 20) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      if (one > 0) {
        parts.push(`${ones[one]} و${tens[ten]}`);
      } else {
        parts.push(tens[ten]);
      }
    } else if (n >= 10) {
      parts.push(teens[n - 10]);
    } else if (n > 0) {
      parts.push(ones[n]);
    }
    
    return parts.join(' و ') || 'صفر';
  };

  const handlePrint = () => {
    const printContent = generatePrintContent();
    
    if (printFrameRef.current) {
      const iframe = printFrameRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printContent);
        doc.close();
        
        // Wait for content to load then print
        setTimeout(() => {
          iframe.contentWindow?.print();
        }, 100);
      }
    }
  };

  const handleSaveAndPrint = async () => {
    // Validation
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    setValidationErrors([]);

    try {
      // Prepare data for API
      const payload = {
        account_id: selectedAccountId!,
        transaction_type: 'EXPENSE' as const,
        category: 'MANUAL' as const,  // Use MANUAL to appear in Financial Report & P&L
        amount: total.toString(),
        description: buildDescription(),
      };

      // Call API
      await postManualEntry(payload);

      setSuccess('تم حفظ الإذن بنجاح! جاري الطباعة...');

      // Print after short delay
      setTimeout(() => {
        handlePrint();
      }, 500);

      // Close modal after printing
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (err: any) {
      let errorMsg = 'حدث خطأ أثناء حفظ الإذن';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) {
          errorMsg = parsed.error;
        } else if (parsed.detail) {
          errorMsg = parsed.detail;
        } else if (parsed.amount) {
          errorMsg = `خطأ في المبلغ: ${parsed.amount}`;
        } else if (parsed.account_id) {
          errorMsg = `خطأ في الحساب: ${parsed.account_id}`;
        }
      } catch {
        errorMsg = err.message || 'حدث خطأ غير متوقع';
      }
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex items-center gap-3">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-lg font-semibold">جاري تحميل حسابات الخزينة...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      {/* Hidden iframe for printing */}
      <iframe
        ref={printFrameRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: 0, height: 0 }}
        title="Print Frame"
      />

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
              <DollarSign className="text-white" />
            </div>
            <h2 className="text-2xl font-bold">إذن صرف نقدية</h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center disabled:opacity-50"
          >
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Error Messages */}
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="text-red-600 shrink-0" size={20} />
              <span className="text-red-700 font-semibold">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="text-green-600 shrink-0" size={20} />
              <span className="text-green-700 font-semibold">{success}</span>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-yellow-600" size={18} />
                <span className="text-yellow-800 font-bold">يرجى تصحيح الأخطاء التالية:</span>
              </div>
              <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Treasury Account Selector */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              حساب الخزينة <span className="text-red-500">*</span>
            </label>
            {accounts.length === 0 ? (
              <div className="text-red-600 font-semibold text-sm">
                لا يوجد حساب خزينة متاح. يرجى إنشاء حساب خزينة أولاً.
              </div>
            ) : (
              <select
                value={selectedAccountId || ''}
                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                disabled={saving}
              >
                <option value="">اختر حساب الخزينة</option>
                {accounts.filter(a => a.is_active).map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.display_name} (الرصيد: {Number(acc.balance).toLocaleString()} ج.م)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Items List */}
          <div className="space-y-3">
            <div className="text-sm font-bold text-gray-600 mb-2">بنود الصرف:</div>
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-sm transition"
              >
                <div className="flex-1 flex items-center gap-4">
                  <span className="text-gray-400 font-bold w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={item.description}
                    placeholder="اكتب وصف المصروف"
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    disabled={saving}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-gray-100"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    min={1}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    disabled={saving}
                    className="w-20 px-3 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-100"
                  />
                  <input
                    type="number"
                    value={item.amount}
                    min={0}
                    step="0.01"
                    onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                    disabled={saving}
                    className="w-24 px-3 py-2 border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-gray-100"
                  />
                  <span className="w-24 text-right font-bold text-gray-700">
                    {(item.quantity * item.amount).toLocaleString()} ج.م
                  </span>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={saving}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-100 hover:bg-red-200 transition disabled:opacity-50"
                >
                  <Trash2 className="text-red-600" size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Add Item Button */}
          <button
            onClick={addItem}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white py-3 rounded-xl hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            إضافة بند صرف
          </button>

          {/* Total */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl text-xl font-bold">
            <span>الإجمالي الكلي:</span>
            <span>
              <DollarSign className="inline-block mr-1" />
              {total.toLocaleString()} ج.م
            </span>
          </div>

          {/* Preview Summary */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <strong>ملخص:</strong> {items.length} بنود | {items.filter(i => !i.description).length} بدون وصف | الإجمالي: {total.toLocaleString()} ج.م
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-gray-200 py-3 rounded-xl font-bold hover:bg-gray-300 transition disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSaveAndPrint}
            disabled={saving || accounts.length === 0 || !selectedAccountId}
            className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Printer size={20} />
                حفظ وطباعة الإذن
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
