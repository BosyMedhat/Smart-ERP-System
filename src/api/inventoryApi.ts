
// // hena el awalmer ele ptklm el inventory 

// import apiClient from './axiosConfig'; // استدعينا النسخة اللي لسه عاملينها

// // بنعمل دالة (Function) اسمها getProducts عشان تجيب المنتجات
// // بنستخدم async/await لأن الاتصال بالسيرفر بياخد وقت، فلازم الكود "يستنى" الرد
// export const getProducts = async () => {
//     try {
//         // السطر ده بيروح يخبط على http://127.0.0.1:8000/api/products/
//         const response = await apiClient.get('products/'); 
//         return response.data; // لو نجح، بيرجع الداتا اللي جات من جانغو
//     } catch (error) {
//         console.error("Error fetching products:", error); // لو فشل، بيطبع الخطأ عشان نعرف نصلحه
//         throw error;
//     }
// };

// // إضافة منتج جديد
// export const createProduct = async (productData: any) => {
//     try {
//         const response = await apiClient.post('products/', productData);
//         return response.data;
//     } catch (error) {
//         console.error("Error creating product:", error);
//         throw error;
//     }
// };

// // تعديل منتج موجود
// export const updateProduct = async (id: string, productData: any) => {
//     try {
//         const response = await apiClient.put(`products/${id}/`, productData);
//         return response.data;
//     } catch (error) {
//         console.error("Error updating product:", error);
//         throw error;
//     }
// };

// // حذف منتج
// export const deleteProduct = async (id: string) => {
//     try {
//         await apiClient.delete(`products/${id}/`);
//         return true;
//     } catch (error) {
//         console.error("Error deleting product:", error);
//         throw error;
//     }
// };



// // hena el awalmer ele ptklm el inventory 

// import apiClient from './axiosConfig'; // استدعينا النسخة اللي لسه عاملينها

// // ------------------- (1) المنتجات - Products -------------------

// // بنعمل دالة (Function) اسمها getProducts عشان تجيب المنتجات
// export const getProducts = async () => {
//     try {
//         const response = await apiClient.get('products/'); 
//         return response.data; 
//     } catch (error) {
//         console.error("Error fetching products:", error); 
//         throw error;
//     }
// };

// // إضافة منتج جديد
// export const createProduct = async (productData: any) => {
//     try {
//         const response = await apiClient.post('products/', productData);
//         return response.data;
//     } catch (error) {
//         console.error("Error creating product:", error);
//         throw error;
//     }
// };

// // تعديل منتج موجود
// export const updateProduct = async (id: string, productData: any) => {
//     try {
//         const response = await apiClient.put(`products/${id}/`, productData);
//         return response.data;
//     } catch (error) {
//         console.error("Error updating product:", error);
//         throw error;
//     }
// };

// // حذف منتج
// export const deleteProduct = async (id: string) => {
//     try {
//         await apiClient.delete(`products/${id}/`);
//         return true;
//     } catch (error) {
//         console.error("Error deleting product:", error);
//         throw error;
//     }
// };

// // ------------------- (2) العملاء - Customers -------------------

// // جلب قائمة العملاء لعرضها في شاشة الكاشير
// // جلب قائمة العملاء من قاعدة البيانات
// export const getCustomers = async () => {
//     try {
//         // نستخدم المسار المباشر 'customers/' الذي تم ضبطه في الدجانغو
//         const response = await apiClient.get('customers/'); 
//         return response.data;
//     } catch (error) {
//         console.error("Error fetching customers:", error);
//         throw error;
//     }
// };

// // ------------------- (3) المستخدمين - Users -------------------

// // جلب قائمة المستخدمين لعرضهم في الإعدادات (طلب الريكورد الثاني)
// export const getUsers = async () => {
//     try {
//         const response = await apiClient.get('users/'); // تأكدي من المسار في Django
//         return response.data;
//     } catch (error) {
//         console.error("Error fetching users:", error);
//         throw error;
//     }
// };




// import apiClient from './axiosConfig'; // استدعاء إعدادات Axios

// // ------------------- (1) المنتجات - Products -------------------

// // جلب قائمة المنتجات
// export const getProducts = async () => {
//   try {
//     const response = await apiClient.get('products/');
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching products:', error);
//     throw error;
//   }
// };

// // إضافة منتج جديد
// export const createProduct = async (productData: any) => {
//   try {
//     const response = await apiClient.post('products/', productData);
//     return response.data;
//   } catch (error) {
//     console.error('Error creating product:', error);
//     throw error;
//   }
// };

// // تعديل منتج موجود
// export const updateProduct = async (id: string, productData: any) => {
//   try {
//     const response = await apiClient.put(`products/${id}/`, productData);
//     return response.data;
//   } catch (error) {
//     console.error('Error updating product:', error);
//     throw error;
//   }
// };

// // حذف منتج
// export const deleteProduct = async (id: string) => {
//   try {
//     await apiClient.delete(`products/${id}/`);
//     return true;
//   } catch (error) {
//     console.error('Error deleting product:', error);
//     throw error;
//   }
// };

// // ------------------- (2) العملاء - Customers -------------------

// // جلب قائمة العملاء
// export const getCustomers = async () => {
//   try {
//     const response = await apiClient.get('customers/');
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching customers:', error);
//     throw error;
//   }
// };

// // ------------------- (3) المستخدمين - Users -------------------

// // جلب قائمة المستخدمين
// export const getUsers = async () => {
//   try {
//     const response = await apiClient.get('users/');
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     throw error;
//   }
// };

// // إنشاء مستخدم جديد
// export const createUser = async (userData: any) => {
//   try {
//     const response = await apiClient.post('users/', userData);
//     return response.data;
//   } catch (error) {
//     console.error('Error creating user:', error);
//     throw error;
//   }
// };


import apiClient from './axiosConfig'; // استدعاء إعدادات Axios

// ------------------- (1) المنتجات - Products -------------------

// جلب قائمة المنتجات مع دعم الفلترة والبحث من الباك إند
export const getProducts = async (params: any = {}) => {
  try {
    const response = await apiClient.get('products/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// إضافة منتج جديد (يدعم رفع الصور عبر FormData)
export const createProduct = async (productData: any) => {
  try {
    const isFormData = productData instanceof FormData;
    const response = await apiClient.post('products/', productData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// تعديل منتج موجود (يدعم رفع الصور عبر FormData)
export const updateProduct = async (id: string, productData: any) => {
  try {
    const isFormData = productData instanceof FormData;
    const response = await apiClient.patch(`products/${id}/`, productData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// حذف منتج
export const deleteProduct = async (id: string) => {
  try {
    await apiClient.delete(`products/${id}/`);
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// ------------------- (2) العملاء - Customers -------------------

// جلب قائمة العملاء
export const getCustomers = async () => {
  try {
    const response = await apiClient.get('customers/');
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

// ------------------- (3) المستخدمين - Users -------------------

// جلب قائمة المستخدمين
export const getUsers = async () => {
  try {
    const response = await apiClient.get('users/');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// إنشاء مستخدم جديد
export const createUser = async (userData: any) => {
  try {
    const response = await apiClient.post('users/', userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// تعديل مستخدم موجود
export const updateUser = async (id: string, userData: any) => {
  try {
    const response = await apiClient.put(`users/${id}/`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};