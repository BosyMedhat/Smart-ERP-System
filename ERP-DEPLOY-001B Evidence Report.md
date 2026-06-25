# ERP-DEPLOY-001B — Evidence Report

**Project:** Smart ERP (Go Easy Store)  
**Branch:** `main_clean_20260426`  
**Date:** 2026-06-22  
**Scope:** Evidence only — No implementation

---

## Methodology

For each deployment blocking issue, this report provides:
- **Evidence**: exact file content
- **Affected file**: absolute path
- **Exact line(s)**: line numbers from the source
- **Production impact**: what will fail when deployed

No files were modified during this investigation.

---

## Issue 1 — `requirements.txt` missing production packages

### Evidence

**Affected file:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\requirements.txt`

**Exact lines:** 1–37

```txt
annotated-types==0.7.0
anyio==4.12.1
asgiref==3.11.1
certifi==2026.2.25
charset-normalizer==3.4.5
Django==6.0.2
django-cors-headers==4.9.0
djangorestframework==3.16.1
h11==0.16.0
httpcore==1.0.9
httpx==0.28.1
idna==3.11
jsonpatch==1.33
jsonpointer==3.0.0
langchain-core==1.2.18
langchain-ollama==1.0.1
langsmith==0.7.16
ollama==0.6.1
orjson==3.11.7
packaging==26.0
Pillow==11.3.0
pydantic==2.12.5
pydantic_core==2.41.5
pyserial==3.5
PyYAML==6.0.3
requests==2.32.5
requests-toolbelt==1.0.0
sqlparse==0.5.5
tenacity==9.1.4
typing-inspection==0.4.2
typing_extensions==4.15.0
tzdata==2025.3
urllib3==2.6.3
uuid_utils==0.14.1
xxhash==3.6.0
zstandard==0.25.0
```

### Production impact

| Missing package | Why it matters | What will fail |
|---|---|---|
| `psycopg2` / `psycopg2-binary` | PostgreSQL driver for Django | `ModuleNotFoundError` on Railway; database connection impossible |
| `python-dotenv` | Used in `core/settings.py` line 14 | `ModuleNotFoundError` if not present in Railway environment |
| `whitenoise` | Serves static files in production | `collectstatic` output not served; CSS/JS broken |
| `gunicorn` | Production WSGI server | Railway has no command to run the app |
| `django-storages` + S3 driver | Persistent media storage | Uploaded images lost on every redeploy |

---

## Issue 2 — `package.json` has React as optional peer dependency

### Evidence

**Affected file:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\package.json`

**Exact lines:** 78–89

```json
"peerDependencies": {
  "react": "18.3.1",
  "react-dom": "18.3.1"
},
"peerDependenciesMeta": {
  "react": {
    "optional": true
  },
  "react-dom": {
    "optional": true
  }
}
```

**Additional evidence:** `react` and `react-dom` are NOT listed in `dependencies` (lines 10–70).

### Production impact

Vercel and most CI runners do **not** install optional peer dependencies by default. Build will likely fail with:

```
Error: Cannot find module 'react'
```

or a TypeScript/ESLint error during `vite build`.

---

## Issue 3 — `core/settings.py` missing production static/media settings

### Evidence A — No `STATIC_ROOT`

**Affected file:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\smart_erp_backend\core\settings.py`

**Exact lines:** 179–186

```python
# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

### Production impact

- `python manage.py collectstatic` has no target directory, so it will fail or be ignored
- Django admin CSS and any future static assets will return 404 in production

### Evidence B — No WhiteNoise middleware or storage backend

**Affected file:** same file, lines 62–71

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

`whitenoise.middleware.WhiteNoiseMiddleware` is not present.

**Affected file:** same file, no line (setting is absent)

`STATICFILES_STORAGE` is not defined anywhere.

### Production impact

WhiteNoise is the standard way to serve static files on Railway/Heroku. Without it, CSS/JS/admin assets will not be served by the Django application.

### Evidence C — `python-dotenv` imported but not in requirements

**Affected file:** same file, lines 13–21

```python
from pathlib import Path
from dotenv import load_dotenv
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / '.env')
```

### Production impact

If `python-dotenv` is not pre-installed by Railway's base image (which is not guaranteed), the application will fail on startup with:

```
ModuleNotFoundError: No module named 'dotenv'
```

---

## Issue 4 — `src/api/axiosConfig.ts` hardcodes localhost backend URL

### Evidence

**Affected file:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\src\api\axiosConfig.ts`

**Exact lines:** 11–17

```ts
const apiClient = axios.create({ 
    baseURL: 'http://127.0.0.1:8000/api/',
    // hena ka2ny pa2ol le el backend ana 7p3tlk json we enta rod 3lya pe json pardo
    headers: {
        'Content-Type': 'application/json', 
    }
});
```

### Production impact

After Vercel deployment, every browser request will be sent to `http://127.0.0.1:8000/api/`, which is the user's own computer. The application will be completely non-functional for any user other than a developer running the backend locally on port 8000.

All data requests (login, products, sales, suppliers, treasury, etc.) will fail with CORS or connection errors.

---

## Issue 5 — `vite.config.ts` has no SPA production rewrite config

### Evidence

**Affected file:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\vite.config.ts`

**Exact lines:** 1–26

```ts
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
  server: {
    historyApiFallback: true,
  },
})
```

### Production impact

`historyApiFallback: true` only works during `vite dev`. On Vercel, direct navigation to routes like `/suppliers`, `/inventory`, or `/sales` will return a 404 unless `vercel.json` is added with SPA rewrite rules.

---

## Issue 6 — Missing deployment configuration files

### Evidence

**Search command:** `find_by_name` for `Procfile|railway.toml|vercel.json`

**Result:** `Found 0 results`

**Affected directory:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System`

### Production impact

| Missing file | Platform | Consequence |
|---|---|---|
| `Procfile` | Railway | No default web process; Railway won't know how to start the app |
| `railway.toml` | Railway | Cannot define start command, healthcheck, or build steps |
| `vercel.json` | Vercel | SPA routing fails; direct links return 404 |

---

## Issue 7 — AI/Ollama endpoints hardcoded to localhost

### Evidence A — `ask_ai` endpoint

**Affected file:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\smart_erp_backend\ai_assistant\views.py`

**Exact lines:** 38–44

```python
llm = OllamaLLM(
    model="qwen2.5:3b",
    base_url="http://127.0.0.1:11434",
    timeout=120,
    num_predict=500,
    keep_alive=-1,
)
```

### Evidence B — PDF product import

**Affected file:** same file, lines 307–308

```python
response = requests.post(
    'http://localhost:11434/api/generate',
```

### Evidence C — Invoice image analysis

**Affected file:** same file, lines 427–428

```python
ollama_response = req.post(
    'http://localhost:11434/api/generate',
```

### Evidence D — AI Action parser

**Affected file:** same file, lines 661–662

```python
resp = requests.post(
    'http://127.0.0.1:11434/api/generate',
```

### Production impact

Ollama is not available on Railway's default network. All AI-dependent endpoints will fail with connection errors after deployment:

- `POST /api/ai/ask/` — AI assistant chat
- `POST /api/ai/import-pdf/` — PDF product import
- `POST /api/ai/analyze-invoice/` — invoice image analysis
- `POST /api/ai/action/parse/` — AI action parser (falls back to rule-based, but loses LLM intelligence)

The `.env.example` file defines `OLLAMA_HOST` but the code never reads it.

---

## Issue 8 — Media uploads use local filesystem only

### Evidence A — `MEDIA_ROOT` is local path

**Affected file:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\smart_erp_backend\core\settings.py`

**Exact line:** 185

```python
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

### Evidence B — Media serving only in DEBUG

**Affected file:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\smart_erp_backend\core\urls.py`

**Exact lines:** 68–72

```python
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
```

### Production impact

Railway containers have ephemeral filesystems. On every redeploy, the `media/` directory is recreated empty. All uploaded content will be lost, including:

- Product images (`Product.image`)
- Store logo (`StoreSettings.store_logo`)
- Supplier evaluation images (`SupplierEvaluation.goods_image`, `invoice_image`)
- Audit evidence files

In production, Django will not serve media files even if they exist because the `static()` helper is gated behind `DEBUG=True`.

---

## Issue 9 — No `STATIC_ROOT` setting

### Evidence

**Affected file:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\smart_erp_backend\core\settings.py`

**Exact lines:** 179–182

```python
# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'
```

`STATIC_ROOT` is completely absent from the file.

### Production impact

- `python manage.py collectstatic` has no destination directory
- Railway build step cannot gather admin assets or future app static files
- Django admin interface will appear unstyled or broken

---

## Issue 10 — WhiteNoise missing from middleware and requirements

### Evidence A — middleware list

**Affected file:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\smart_erp_backend\core\settings.py`

**Exact lines:** 62–71

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

### Evidence B — requirements.txt

**Affected file:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\requirements.txt`

Search for `whitenoise` returns no results.

### Production impact

WhiteNoise is the standard production static file server for PaaS platforms like Railway. Without it, Django cannot serve collected static files. Admin CSS, future app bundles, and any uploaded/compiled static assets will return 404.

---

## Issue 11 — Gunicorn missing from requirements

### Evidence

**Affected file:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\requirements.txt`

Search for `gunicorn` returns no results.

### Production impact

Railway needs a production WSGI server to run the Django application. Without `gunicorn` (or `uvicorn` + `daphne`), there is no command to bind the app to the `$PORT` environment variable. Railway deployment will fail to start.

---

## Issue 12 — `psycopg2` missing from requirements

### Evidence

**Affected file:** `f:\What_i_Made\New\Final_Year_4\Graduation_Project\ERP3Windsurf\Smart-ERP-System\requirements.txt`

Search for `psycopg2` or `postgresql` returns no results.

### Production impact

Railway provisions PostgreSQL by default. Django will be configured with:

```python
'ENGINE': 'django.db.backends.postgresql'
```

but the driver `psycopg2` is not installed. The application will fail to start with:

```
django.core.exceptions.ImproperlyConfigured: Error loading psycopg2 module: No module named 'psycopg2'
```

---

## Verification Summary Table

| Question | Answer | Evidence |
|---|---|---|
| Is `Procfile` missing? | **Yes** | `find_by_name` returned 0 results |
| Is `railway.toml` missing? | **Yes** | `find_by_name` returned 0 results |
| Is `vercel.json` missing? | **Yes** | `find_by_name` returned 0 results |
| Is `STATIC_ROOT` missing? | **Yes** | `core/settings.py` only defines `STATIC_URL` |
| Is WhiteNoise missing? | **Yes** | Not in `requirements.txt` and not in `MIDDLEWARE` |
| Is Gunicorn missing? | **Yes** | Not in `requirements.txt` |
| Is `psycopg2` missing? | **Yes** | Not in `requirements.txt` |

---

## Conclusion

All 12 blocking issues are confirmed with exact source evidence. The project cannot be deployed to Railway + Vercel without implementing the fixes listed in `ERP-DEPLOY-001A Investigation Report.md`.

*End of Evidence Report*
