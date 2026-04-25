// mohmat el malaf da hwa eny maktpesh el link el 5as pe el server akter men mra 
// a7to hena pas 3ashan lma age a3mel publish fa a8er el link men hena pas 

// axios da esm el liberary ele ptklm el django 3ashan tgep meno el data 
// conf e5tsar le confgration  and ts for type script


import axios from "axios"; 


const apiClient = axios.create({ 
    baseURL: 'http://127.0.0.1:8000/api/',
    // hena ka2ny pa2ol le el backend ana 7p3tlk json we enta rod 3lya pe json pardo
    headers: {
        'Content-Type': 'application/json', 
    }
});

// Interceptor: يضيف token تلقائياً مع كل request
apiClient.interceptors.request.use((config) => {
    const userStr = localStorage.getItem('erp_user');
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user.token) {
            config.headers.Authorization = `Token ${user.token}`;
        }
    }
    return config;
});

// Interceptor: لو جاء 401/403 → logout + رسالة عربية + redirect
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Session expired or not authenticated
            localStorage.removeItem('erp_user');
            alert('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى');
            window.location.href = '/login';
        } else if (error.response?.status === 403) {
            // Forbidden - no permission
            console.error('403 Forbidden:', error.response.data);
        }
        return Promise.reject(error);
    }
);

// ya3ne pakol le el react ay malaf 3aez yklm el backend  y3mel import le apiClient
export default apiClient;