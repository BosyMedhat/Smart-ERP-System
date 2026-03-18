import axios from 'axios';

const API_URL = 'http://localhost:8000/api/sales/';
const INVENTORY_API_URL = 'http://localhost:8000/api/inventory/';

export const salesService = {
  async createCustomer(customerData: { name: string; phone: string }) {
    try {
      const response = await axios.post(`${API_URL}/sales/customers/`, customerData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // --- الوظائف القديمة (كما هي) ---
  getInvoices: async () => {
    const response = await axios.get(`${API_URL}invoices/`);
    return response.data;
  },
  
  createInvoice: async (invoiceData: any) => {
    const response = await axios.post(`${API_URL}invoices/`, invoiceData);
    return response.data;
  },

  getCustomers: async () => {
    const response = await axios.get('http://localhost:8000/api/customers/');
    return response.data;
  },

  getProducts: async () => {
    const response = await axios.get(`${INVENTORY_API_URL}products/`);
    return response.data.map((product: any) => ({
        id: product.id.toString(),
        name: product.name,
        price: parseFloat(product.retailPrice) || 0,
        image: product.image || '/placeholder-product.png', 
        category: product.category || 'عام',
        barcode: product.barcode,
      }));
  },

  // --- ✅ وظائف التقسيط المحدثة ---

  // 1. جلب قائمة الأقساط بالكامل
  getInstallments: async () => {
    const response = await axios.get(`${API_URL}installments/`);
    return response.data;
  },

  // 2. تحصيل قسط معين (تغيير حالته لـ PAID)
  payInstallment: async (installmentId: number) => {
    const response = await axios.post(`${API_URL}installments/${installmentId}/pay/`);
    return response.data;
  },

  // 3. جلب إحصائيات الأقساط (المحصل، المتبقي، المتأخر)
  getInstallmentStats: async () => {
    const response = await axios.get(`${API_URL}installments/stats/`);
    return response.data;
  },

  // 4. ✅ الدالة الناقصة: إنشاء قسط يدوي من الفورم
  createManualInstallment: async (installmentData: any) => {
    // إرسال البيانات للأكشن (create_manual) اللي عملناه في الباك إيند
    const response = await axios.post(`${API_URL}installments/create_manual/`, installmentData);
    return response.data;
  }
};


//اخر كود قبل اضافة الاقساط

// import axios from 'axios';

// // تأكد أن الرابط يطابق إعدادات Docker للباك إيند
// const API_URL = 'http://localhost:8000/api/sales/';
// const INVENTORY_API_URL = 'http://localhost:8000/api/inventory/';

// export const salesService = {
//   // جلب الفواتير (للمراجعة)
//   getInvoices: async () => {
//     const response = await axios.get(`${API_URL}invoices/`);
//     return response.data;
//   },
  
//   // إنشاء فاتورة جديدة وخصم المخزون (الربط الرئيسي)
//   createInvoice: async (invoiceData: any) => {
//     const response = await axios.post(`${API_URL}invoices/`, invoiceData);
//     return response.data;
//   },

//   // جلب العملاء (للربط في شاشة الكاشير)
//   getCustomers: async () => {
//     const response = await axios.get('http://localhost:8000/api/customers/');
//     return response.data;
//   },

//   // جلب المنتجات (للربط في شاشة الكاشير)
//   getProducts: async () => {
//     const response = await axios.get(`${INVENTORY_API_URL}products/`);
    
//     // ✅ 1. عرض البيانات في الـ Console للتأكد
//     console.log("Raw products data from API:", response.data);
    
//     return response.data.map((product: any) => {
      
//       // ✅ 2. نأخذ 'retailPrice' ونحوله لـ 'price'
//       const price = parseFloat(product.retailPrice) || 0;

//       return {
//         id: product.id.toString(),
//         name: product.name,
//         price: price, // الآن السعر سيظهر
//         image: product.image || '/placeholder-product.png', 
//         category: product.category || 'عام',
//         barcode: product.barcode,
//       };
//     });
//   }
// };