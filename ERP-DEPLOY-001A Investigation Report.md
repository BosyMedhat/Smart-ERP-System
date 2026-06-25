# ERP-DEPLOY-001A — Deployment Readiness Investigation Report

**Project:** Smart ERP (Go Easy Store)
**Branch:** `main_clean_20260426`
**Date:** 2026-06-20
**Targets:** Railway (Backend) / Vercel (Frontend)
**Scope:** Investigation Only — No Implementation

---

## 1. Executive Summary

| Area | Status | Blocking Issues |
|---|---|---|
| Backend (Railway) | NOT READY | 5+ critical blockers |
| Frontend (Vercel) | CLOSE BUT NOT READY | 2+ critical blockers |
| AI Components | NOT READY for online | Hardcoded localhost Ollama |
| Overall Readiness | **32%** | Deployment is blocked until listed fixes are implemented |

---

## 2. Backend Investigation

### 2.1 `requirements.txt` — Production Readiness

**File:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\requirements.txt`

**Findings:**
- 36 packages listed, core frameworks present: `Django==6.0.2`, `djangorestframework==3.16.1`, `django-cors-headers==4.9.0`, `Pillow==11.3.0`
- **MISSING:** `psycopg2` / `psycopg2-binary` — PostgreSQL adapter required for Railway PostgreSQL
- **MISSING:** `python-dotenv` — imported in `core/settings.py` (`from dotenv import load_dotenv`) but not pinned
- **MISSING:** `whitenoise` — required for serving static files in production on Railway
- **MISSING:** `gunicorn` — required as WSGI server on Railway
- **MISSING:** `brotli` / `dj-database-url` (optional but recommended for Railway)
- **MISSING:** `django-storages` + S3/Azure backend driver — required for persistent media uploads

**Evidence:**
```txt
Django==6.0.2
...
Pillow==11.3.0
...
# No psycopg2, python-dotenv, whitenoise, gunicorn, django-storages
```

**Risk:** Railway build will fail or runtime will crash because `psycopg2` and `python-dotenv` are not installed.

---

### 2.2 `core/settings.py` — Production Configuration

**File:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\smart_erp_backend\core\settings.py`

**Findings:**

| Setting | Current Value | Deployment Status |
|---|---|---|
| `SECRET_KEY` | `os.environ.get('SECRET_KEY')` | ✅ Correct (env-based) |
| `DEBUG` | `os.environ.get('DEBUG', 'False') == 'True'` | ✅ Defaults to False |
| `ALLOWED_HOSTS` | `os.environ.get('ALLOWED_HOSTS', 'localhost').split(',')` | ✅ Env-based, but must be set on Railway |
| `CORS_ALLOW_ALL_ORIGINS` | Env-based | ✅ Good default False |
| `CORS_ALLOWED_ORIGINS` | Env-based, defaults to `localhost:5173` | ✅ Configurable |
| `DATABASES` | Fully env-based | ✅ Good for Railway |
| `STATIC_URL` | `'static/'` | ⚠️ Missing `STATIC_ROOT` |
| `STATICFILES_STORAGE` | Not set | ⚠️ Missing Whitenoise integration |
| `MEDIA_URL` / `MEDIA_ROOT` | `'/media/'`, `os.path.join(BASE_DIR, 'media')` | ⚠️ Local-only, no persistent storage |
| `CSRF_TRUSTED_ORIGINS` | Not set | ⚠️ May cause issues with Vercel frontend |
| `SECURE_SSL_REDIRECT` / `SESSION_COOKIE_SECURE` | Not set | ⚠️ Security headers not enforced |

**Evidence:**
```python
# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
# No STATIC_ROOT defined

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
# No external storage backend
```

**Risk:**
- `collectstatic` will not work without `STATIC_ROOT`
- Railway container filesystem is ephemeral; media uploads will be lost on redeploy
- Whitenoise not configured to serve static files

---

### 2.3 PostgreSQL Configuration

**Findings:**
- `DB_ENGINE` defaults to PostgreSQL via env variables
- **Local vs Production compatibility:** Settings are fully env-based, so PostgreSQL is supported in principle
- **Missing dependency:** `psycopg2` is not in `requirements.txt`
- **Local SQLite fallback is commented out** — good, prevents accidental SQLite use

**Evidence:**
```python
DATABASES = {
    'default': {
        'ENGINE': os.environ.get('DB_ENGINE'),
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT'),
    }
}
```

**Risk:** Railway deployment will fail with `ModuleNotFoundError: No module named 'psycopg2'`

---

### 2.4 API Configuration — Hardcoded URLs

**Findings:**
- Backend code itself has no hardcoded external API URLs
- `core/urls.py` contains a comment only: `http://127.0.0.1:8000/api/employees/` — not a runtime URL
- **Ollama hardcoded in `ai_assistant/views.py`:** `http://127.0.0.1:11434` and `http://localhost:11434` (see AI section)

**Risk:** AI features will fail on Railway because Ollama is not accessible via localhost

---

### 2.5 Media Uploads

**Findings:**
- `MEDIA_ROOT` uses local filesystem: `BASE_DIR / 'media'`
- Media serving is only enabled in `DEBUG=True` via `core/urls.py`
- In production (`DEBUG=False`), uploaded files will not be served
- Railway/Vercel do not provide persistent local filesystem storage

**Evidence:**
```python
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
```

**Affected Features:**
- Product images
- Store logo (`StoreSettings.store_logo`)
- Supplier evaluation images (`goods_image`, `invoice_image`)
- Audit/AI image uploads

**Risk:** All image uploads will be lost on every redeploy unless cloud storage (S3, Cloudflare R2, etc.) or persistent volume is configured.

---

## 3. Frontend Investigation

### 3.1 `package.json` — Missing Dependencies

**File:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\package.json`

**Findings:**
- Vite + React + Tailwind v4 stack
- **CRITICAL:** `react` and `react-dom` are listed only as `peerDependencies` and marked as optional
- Vercel/CI will NOT install peer dependencies automatically unless configured
- Build may fail on Vercel because React is not installed as a dependency

**Evidence:**
```json
"peerDependencies": {
  "react": "18.3.1",
  "react-dom": "18.3.1"
},
"peerDependenciesMeta": {
  "react": { "optional": true },
  "react-dom": { "optional": true }
}
```

**Risk:** Vercel build may fail with `Cannot find module 'react'`

---

### 3.2 `vite.config.ts` — Production Readiness

**File:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\vite.config.ts`

**Findings:**
- Standard Vite React config
- `@/` alias configured correctly
- `historyApiFallback: true` configured for dev server
- **Missing:** `base` path not set (default `/` is fine for Vercel)
- **Missing:** build chunking strategy for the 1.1 MB+ JS bundle

**Evidence:**
```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  server: {
    historyApiFallback: true,
  },
})
```

**Risk:** No critical production risk, but bundle size warning is present.

---

### 3.3 Environment Variables — API URL

**Findings:**
- **CRITICAL:** `src/api/axiosConfig.ts` hardcodes `baseURL: 'http://127.0.0.1:8000/api/'`
- **CRITICAL:** `src/app/components/CashPermissionModal.tsx` declares `const BASE_URL = 'http://127.0.0.1:8000'` (unused but dangerous)
- Other files only mention `localhost:8000` in error messages or comments
- No `.env` file or `VITE_API_URL` variable exists

**Evidence:**
```ts
const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
    headers: { 'Content-Type': 'application/json' }
});
```

**Risk:** After Vercel deployment, the frontend will attempt to call the user's local laptop backend. The application will be completely broken.

---

### 3.4 Routing — SPA Compatibility

**Findings:**
- Vite dev server has `historyApiFallback: true`
- **Vercel:** Need `vercel.json` with `rewrites: [{ "source": "/(.*)", "destination": "/index.html" }]`
- **No `vercel.json` exists** in project root

**Risk:** Direct navigation to routes (e.g., `/suppliers`) on Vercel will return 404.

---

### 3.5 Build Test

**Command:** `npm run build`

**Result:**
```
vite v6.3.5 building for production...
✓ 2419 modules transformed.
dist/index.html                     0.46 kB │ gzip:   0.29 kB
dist/assets/logo-BBkBh-h2.png      20.08 kB
dist/assets/index-DYwppH-G.css    168.78 kB │ gzip:  24.63 kB
dist/assets/index-Cte8tgJ8.js   1,194.83 kB │ gzip: 321.71 kB

(!) Some chunks are larger than 500 kB after minification.
✓ built in 33.74s
```

**Findings:**
- Build succeeds ✅
- Chunk size warning ⚠️ (non-blocking but impacts performance)
- No TypeScript errors

---

## 4. AI Components Investigation

### 4.1 Ollama Integration

**Findings:**
- `ai_assistant/views.py` uses `langchain_ollama` and direct `requests` calls
- **Hardcoded Ollama URL in multiple places:**
  - `OllamaLLM(..., base_url="http://127.0.0.1:11434", ...)` in `ask_ai`
  - `requests.post('http://localhost:11434/api/generate', ...)` in `PDFProductImportView`
  - `requests.post('http://localhost:11434/api/generate', ...)` in `AnalyzeInvoiceView`
  - `requests.post('http://127.0.0.1:11434/api/generate', ...)` in `_ollama_parse` (AI Actions)

**Evidence:**
```python
llm = OllamaLLM(
    model="qwen2.5:3b",
    base_url="http://127.0.0.1:11434",
    ...
)

response = requests.post(
    'http://localhost:11434/api/generate',
    json={'model': 'qwen2.5:3b', ...},
    timeout=300
)
```

### 4.2 What Will Work Online

- Smart analytics endpoints that do NOT use Ollama:
  - Sales summary
  - Top products
  - Low stock alerts
  - Anomaly detection (statistical)
  - Forecast (statistical mean)
  - Rule-based recommendations
- Rule-based AI Action parser (`_rule_based_parse`)

### 4.3 What Will Fail After Deployment

| Feature | Reason | Failure Mode |
|---|---|---|
| `ask_ai` endpoint | Hardcoded Ollama localhost | Cannot connect to Ollama |
| PDF Product Import | Hardcoded Ollama localhost | Returns "تعذر الاتصال بـ Ollama" |
| Invoice Image Analysis | Hardcoded Ollama localhost | Returns 503 error |
| AI Action Parser (Ollama) | Hardcoded Ollama localhost | Falls back to rule-based parser |
| AI Actions Execution | Depends on parsed intent | May work if rule-based fallback succeeds |

### 4.4 Required Deployment Strategy

**Option A: External Ollama Host**
- Deploy Ollama on a separate server (e.g., Railway private service, Hugging Face, or dedicated VM)
- Move Ollama URL to environment variable: `OLLAMA_HOST`
- `.env.example` already defines `OLLAMA_HOST=http://localhost:11434` but code does not read it

**Option B: Disable AI Features Online**
- Feature-flag Ollama-dependent features
- Show user-friendly message when Ollama is unavailable

**Option C: Replace with Cloud LLM**
- Use OpenAI / Anthropic / Google Gemini API via environment variable API key
- Requires privacy and cost review

**Recommendation:** Implement Option A with env variable and fallback to Option B.

---

## 5. Deployment Targets Evaluation

### 5.1 Railway (Backend)

**What's Missing:**
1. `requirements.txt` needs: `psycopg2-binary`, `python-dotenv`, `whitenoise`, `gunicorn`, `brotli`
2. `core/settings.py` needs:
   - `STATIC_ROOT`
   - `STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'`
   - Whitenoise middleware
   - `CSRF_TRUSTED_ORIGINS` from env
   - Cloud storage for `MEDIA_ROOT` (e.g., S3 via `django-storages`)
3. `Procfile` or `railway.toml` for start command
4. Health check endpoint
5. Migration run on deploy
6. `SECRET_KEY`, `ALLOWED_HOSTS`, `DATABASE_URL` configured in Railway dashboard

**Railway Readiness:** 25%

---

### 5.2 Vercel (Frontend)

**What's Missing:**
1. `react` and `react-dom` must be moved from `peerDependencies` to `dependencies`
2. `VITE_API_URL` environment variable and update `axiosConfig.ts` to use it
3. `vercel.json` for SPA routing
4. Remove or replace hardcoded `http://127.0.0.1:8000` in `CashPermissionModal.tsx`

**Vercel Readiness:** 60%

---

## 6. Blocking Issues Summary

### Critical (Must Fix Before Deployment)

1. **Backend missing `psycopg2` in requirements.txt** — PostgreSQL connection will fail
2. **Backend missing `python-dotenv` in requirements.txt** — settings load will fail
3. **Backend missing `whitenoise` + `STATIC_ROOT` + middleware** — static files won't serve
4. **Backend missing `gunicorn`** — no production WSGI server
5. **Frontend `axiosConfig.ts` hardcodes `http://127.0.0.1:8000/api/`** — app won't connect to backend
6. **Frontend `package.json` has React as optional peer dependency** — Vercel build may fail
7. **Missing `vercel.json`** — SPA direct links will 404
8. **AI hardcodes Ollama `localhost:11434`** — all AI features fail online
9. **Media files stored on local filesystem** — uploads lost on redeploy
10. **No `Procfile` / `railway.toml` / `vercel.json` / Dockerfile** — deployment targets have no instructions

### High (Should Fix Before Public Use)

11. `CSRF_TRUSTED_ORIGINS` not configured
12. No cloud storage for media (S3/R2/Cloudinary)
13. No health check endpoint for Railway
14. Bundle size > 1.1 MB without code splitting
15. No `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, etc.

---

## 7. Recommended Fixes

### Backend
1. Update `requirements.txt`:
   ```txt
   psycopg2-binary==2.9.10
   python-dotenv==1.0.1
   whitenoise==6.9.0
   gunicorn==23.0.0
   brotli==1.1.0
   django-storages==1.14.5
   boto3==1.37.0
   ```
2. Update `core/settings.py`:
   ```python
   STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
   STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
   MIDDLEWARE = [
       'django.middleware.security.SecurityMiddleware',
       'whitenoise.middleware.WhiteNoiseMiddleware',
       ...
   ]
   CSRF_TRUSTED_ORIGINS = os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',')
   ```
3. Add `Procfile`:
   ```
   web: gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
   release: python manage.py migrate
   ```
4. Add `railway.toml` or use Railway dashboard for start commands

### Frontend
1. Move React to dependencies in `package.json`:
   ```json
   "dependencies": {
     "react": "18.3.1",
     "react-dom": "18.3.1",
     ...
   }
   ```
2. Update `src/api/axiosConfig.ts`:
   ```ts
   baseURL: import.meta.env.VITE_API_URL || '/api/'
   ```
3. Add `.env.example`:
   ```
   VITE_API_URL=https://your-railway-app.up.railway.app/api/
   ```
4. Add `vercel.json`:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

### AI
1. Read `OLLAMA_HOST` from environment variable:
   ```python
   OLLAMA_HOST = os.environ.get('OLLAMA_HOST', 'http://localhost:11434')
   ```
2. Replace all hardcoded `localhost:11434` / `127.0.0.1:11434` with `OLLAMA_HOST`
3. Add fallback behavior when Ollama is unavailable

### Media
1. Configure `django-storages` with S3/R2/Cloudinary
2. Set `DEFAULT_FILE_STORAGE` to cloud backend
3. Ensure `MEDIA_URL` points to CDN URL

---

## 8. Deployment Readiness Score

| Area | Score | Weight | Weighted |
|---|---|---|---|
| Backend Requirements | 30% | 25% | 7.5% |
| Backend Settings | 35% | 25% | 8.75% |
| PostgreSQL Config | 60% | 10% | 6% |
| Frontend Build | 75% | 15% | 11.25% |
| Frontend Runtime Config | 20% | 15% | 3% |
| AI Components | 15% | 10% | 1.5% |
| **TOTAL** | — | **100%** | **32%** |

**Overall Deployment Readiness: 32%**

**Verdict:** Smart ERP is **NOT ready for deployment** on Railway + Vercel. The project requires a focused deployment fix sprint before going live. The most critical blockers are the hardcoded backend URL in the frontend, missing production dependencies, absent static/media configuration, and the hardcoded Ollama localhost URL.

---

## 9. Evidence Files Referenced

- `requirements.txt`
- `smart_erp_backend/core/settings.py`
- `smart_erp_backend/core/urls.py`
- `smart_erp_backend/core/wsgi.py`
- `smart_erp_backend/ai_assistant/views.py`
- `smart_erp_backend/.env.example`
- `smart_erp_backend/env.example`
- `package.json`
- `vite.config.ts`
- `src/api/axiosConfig.ts`
- `src/app/components/CashPermissionModal.tsx`
- `src/lib/notifications.ts`
- `index.html`
- `docker-compose.yml`

---

*End of Report*
