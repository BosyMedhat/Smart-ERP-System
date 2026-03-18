import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', 
});

export const productService = {
  // جلب كل المنتجات
  getAll: async () => {
    const response = await api.get('/inventory/products/'); // المسار الصحيح
    return response.data;
  },
  // إضافة منتج جديد
  create: async (data: any) => {
    const response = await api.post('/inventory/products/', data);
    return response.data;
  },
  // تحديث منتج
  update: async (id: string, data: any) => {
    const response = await api.put(`/inventory/products/${id}/`, data);
    return response.data;
  },
  // حذف منتج
  delete: async (id: string) => {
    await api.delete(`/inventory/products/${id}/`);
  }
};