# استخدام نسخة Node مستقرة وخفيفة
FROM node:18-alpine

# تحديد مكان العمل داخل الحاوية
WORKDIR /app

# نسخ ملفات التعريف وتثبيت المكتبات
COPY package*.json ./
RUN npm install

# نسخ باقي ملفات المشروع
COPY . .

# تشغيل السيرفر الافتراضي لـ React/Next.js
EXPOSE 3000
# ... (باقي الملف كما هو)
# غير السطر الأخير إلى:
CMD ["npm", "run", "dev"]