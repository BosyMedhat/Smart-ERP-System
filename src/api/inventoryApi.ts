
// hena el awalmer ele ptklm el inventory 

import apiClient from './axiosConfig'; // استدعينا النسخة اللي لسه عاملينها

// بنعمل دالة (Function) اسمها getProducts عشان تجيب المنتجات
// بنستخدم async/await لأن الاتصال بالسيرفر بياخد وقت، فلازم الكود "يستنى" الرد
export const getProducts = async () => {
    try {
        // السطر ده بيروح يخبط على http://127.0.0.1:8000/api/products/
        const response = await apiClient.get('products/'); 
        return response.data; // لو نجح، بيرجع الداتا اللي جات من جانغو
    } catch (error) {
        console.error("Error fetching products:", error); // لو فشل، بيطبع الخطأ عشان نعرف نصلحه
        throw error;
    }
};

// إضافة منتج جديد
export const createProduct = async (productData: any) => {
    try {
        const response = await apiClient.post('products/', productData);
        return response.data;
    } catch (error) {
        console.error("Error creating product:", error);
        throw error;
    }
};

// تعديل منتج موجود
export const updateProduct = async (id: string, productData: any) => {
    try {
        const response = await apiClient.put(`products/${id}/`, productData);
        return response.data;
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
};

// حذف منتج
export const deleteProduct = async (id: string) => {
    try {
        await apiClient.delete(`products/${id}/`);
        return true;
    } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
    }
};