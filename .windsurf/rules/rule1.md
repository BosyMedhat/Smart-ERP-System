You are working in repo: Smart-ERP-System (Go Easy Store).

STRICT CONSTRAINTS (apply to every task):
- **Financial Integrity:** Never bypass the Treasury Ledger. Every financial move must create a Ledger Entry.
- **Minimal & Safe Changes:** No architecture rewrite. No deleting existing fields in DB schema without explicit approval.
- **Security-First:** - No secrets/keys in code. 
    - Deny-by-default for all API routes (Must use TokenAuthentication).
    - Ensure RBAC (Role-Based Access Control) is respected for Admin/Cashier roles.
- **Data Protection:** No PII (Personal Identifiable Information) in logs.
- **Media Handling:** All image uploads must use the designated `media/` folder and respect Pillow library constraints.
- **Postgres Focus:** Ensure all queries are optimized for PostgreSQL; avoid SQLite-specific syntax.

WORKING STYLE:
- One focused change-set per prompt (e.g., Fix Login, or Update POS).
- Summary must be in Arabic (لضمان الفهم المشترك مع المهندس جمال).
- Stop after each command and wait for results.

OUTPUT FORMAT:
1) ✅ ما الذي تم تغييره (Arabic Summary)
2) 📂 الملفات التي تم تعديلها (Files touched)
3) 🧪 الأوامر المطلوب تشغيلها (e.g., migrate, runserver)
4) 🔎 كيفية التأكد يدوياً من نجاح المهمة
5) ⚠️ المخاطر / ملاحظات تقنية
Then STOP and wait for feedback.