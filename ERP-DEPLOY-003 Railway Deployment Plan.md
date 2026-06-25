# ERP-DEPLOY-003 — Railway Backend Deployment Plan

**Project:** Smart ERP (Go Easy Store)
**Repository:** https://github.com/BosyMedhat/Smart-ERP-System
**Branch:** `main_clean_20260426`
**Backend path:** `smart_erp_backend/`
**Date:** 2026-06-22

---

## Preflight Summary

During preflight inspection, two additional critical blockers were found and fixed before this plan was written:

| Issue | Fix |
|---|---|
| `pdfplumber` missing from `requirements.txt` — hard import in `ai_assistant/views.py` | Added `pdfplumber==0.11.6` |
| `reportlab` missing from `requirements.txt` — hard import in `reports/views.py` | Added `reportlab==4.4.1` |
| `arabic-reshaper`, `python-bidi` missing — used in reports PDF | Added `arabic-reshaper==3.0.0`, `python-bidi==0.6.10` |

Post-fix `manage.py check` result: **System check identified no issues (0 silenced)**

---

## Current Deployment Files

### `Procfile`
```
web: python smart_erp_backend/manage.py migrate --noinput && python smart_erp_backend/manage.py collectstatic --noinput && gunicorn core.wsgi:application --chdir smart_erp_backend --bind 0.0.0.0:$PORT --workers 2
```

### `railway.toml`
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "python smart_erp_backend/manage.py migrate --noinput && ..."
healthcheckPath = "/api/login/"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### `requirements.txt` (production additions)
```
gunicorn==23.0.0
whitenoise==6.9.0
brotli==1.1.0
python-dotenv==1.0.1
psycopg2-binary==2.9.12
dj-database-url==2.3.0
pdfplumber==0.11.6
reportlab==4.4.1
arabic-reshaper==3.0.0
python-bidi==0.6.10
```

---

## Environment Variables Table

### What Railway provides AUTOMATICALLY

| Variable | Source | Notes |
|---|---|---|
| `DATABASE_URL` | Railway PostgreSQL plugin | Auto-injected; `settings.py` reads this first |
| `PORT` | Railway runtime | Used in `gunicorn --bind 0.0.0.0:$PORT` |
| `RAILWAY_ENVIRONMENT` | Railway runtime | Can be used for env detection if needed |

### What you MUST set manually in Railway Dashboard

| Variable | Example value | Phase | Required? |
|---|---|---|---|
| `SECRET_KEY` | `django-insecure-REPLACE-WITH-50-RANDOM-CHARS` | Before first deploy | **CRITICAL** |
| `DEBUG` | `False` | Before first deploy | Required |
| `ALLOWED_HOSTS` | `your-app.up.railway.app` | After Railway URL is generated | **CRITICAL** |
| `CORS_ALLOWED_ORIGINS` | `https://your-vercel-app.vercel.app` | After Vercel deploy | Required for frontend |
| `CSRF_TRUSTED_ORIGINS` | `https://your-vercel-app.vercel.app` | After Vercel deploy | Required for frontend POST requests |
| `OLLAMA_BASE_URL` | _(leave unset for graceful fallback)_ | Optional | AI will return 503 friendly message |
| `CORS_ALLOW_ALL_ORIGINS` | `False` | Before first deploy | Set False for security |

### Temporary values BEFORE frontend is deployed

Use these placeholder values until Vercel frontend URL is known:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173
```

Update these immediately after Vercel deployment is complete.

### Complete `.env` block to paste into Railway dashboard

```env
SECRET_KEY=REPLACE_WITH_STRONG_RANDOM_KEY_AT_LEAST_50_CHARS
DEBUG=False
ALLOWED_HOSTS=REPLACE_AFTER_RAILWAY_URL_IS_GENERATED.up.railway.app
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173
```

> ⚠️ `DATABASE_URL` is injected automatically by Railway — do NOT set it manually.

---

## How to generate a secure SECRET_KEY

Run this locally and copy the output:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Or use: https://djecrety.ir

---

## Railway Deployment Steps

### Step 1 — Push code to GitHub

Make sure your latest code (including `Procfile`, `railway.toml`, updated `requirements.txt`) is committed and pushed to branch `main_clean_20260426`.

```
git add Procfile railway.toml requirements.txt smart_erp_backend/core/settings.py smart_erp_backend/ai_assistant/views.py src/api/axiosConfig.ts vercel.json package.json
git commit -m "ERP-DEPLOY-002: production deployment configuration"
git push origin main_clean_20260426
```

### Step 2 — Create a new Railway project

1. Go to https://railway.app
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Authorize Railway to access your GitHub account if prompted
5. Select repository: `BosyMedhat/Smart-ERP-System`
6. Select branch: `main_clean_20260426`
7. Railway will detect `railway.toml` and `Procfile` automatically

### Step 3 — Add PostgreSQL plugin

1. Inside the project, click **+ New** → **Database** → **Add PostgreSQL**
2. Railway creates a PostgreSQL service and automatically sets `DATABASE_URL` in your backend service environment
3. Wait for PostgreSQL to provision (usually 30–60 seconds)

### Step 4 — Set environment variables

1. Click on your backend service (the one connected to GitHub)
2. Go to **Settings** → **Variables** tab
3. Click **RAW Editor** and paste:

```env
SECRET_KEY=your-generated-secret-key-here
DEBUG=False
ALLOWED_HOSTS=PLACEHOLDER_UPDATE_AFTER_DEPLOY.up.railway.app
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173
```

4. Click **Save**

> ⚠️ `ALLOWED_HOSTS` needs your actual Railway public URL. Set a placeholder now, then update after Step 6.

### Step 5 — Trigger deployment

1. Railway will auto-deploy when it detects the environment variables are saved
2. Or click **Deploy** → **Deploy Now** manually
3. Watch the build logs in real time

### Step 6 — Get public URL and update ALLOWED_HOSTS

1. After deployment succeeds, go to **Settings** → **Networking**
2. Click **Generate Domain** to get a public URL (e.g., `smart-erp-system.up.railway.app`)
3. Go back to **Variables** and update:

```env
ALLOWED_HOSTS=smart-erp-system.up.railway.app
```

4. Railway will trigger a redeploy automatically

### Step 7 — Check deployment logs

Look for these lines in the build/deploy logs:

**Good signs:**
```
✓ Build successful
Running migrations...
Applying inventory.0001_initial... OK
...
[INFO] Starting gunicorn
[INFO] Listening at: http://0.0.0.0:PORT
```

**Bad signs (see error table below):**
```
ModuleNotFoundError: No module named '...'
django.core.exceptions.ImproperlyConfigured
Error loading psycopg2
```

### Step 8 — Validate backend is live

Test these URLs in browser or curl after getting the public domain:

| URL | Expected result |
|---|---|
| `https://your-app.up.railway.app/api/login/` | 405 Method Not Allowed (GET not allowed) = backend is running |
| `https://your-app.up.railway.app/admin/` | Django admin login page |
| `https://your-app.up.railway.app/api/products/` | 401 Unauthorized (authentication required) = API is working |

### Step 9 — Create superuser (optional)

From Railway dashboard → your service → **Shell** tab:
```bash
python smart_erp_backend/manage.py createsuperuser
```

### Step 10 — After Vercel frontend is deployed

Update these variables with the actual Vercel URL:
```env
CORS_ALLOWED_ORIGINS=https://smart-erp.vercel.app
CSRF_TRUSTED_ORIGINS=https://smart-erp.vercel.app
ALLOWED_HOSTS=smart-erp-system.up.railway.app
```

---

## Expected Build/Start Command

Railway will execute (from `railway.toml`):

```bash
python smart_erp_backend/manage.py migrate --noinput
python smart_erp_backend/manage.py collectstatic --noinput
gunicorn core.wsgi:application --chdir smart_erp_backend --bind 0.0.0.0:$PORT --workers 2
```

Build phase (NIXPACKS detects Python, installs from `requirements.txt`):
```bash
pip install -r requirements.txt
```

---

## Validation Checklist

| Check | How to verify |
|---|---|
| ✅ `Procfile` exists | File present at project root |
| ✅ `railway.toml` exists | File present at project root |
| ✅ `STATIC_ROOT` defined | `settings.py` line 206: `STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')` |
| ✅ WhiteNoise in MIDDLEWARE | `settings.py` line 66 |
| ✅ `DATABASE_URL` branch in settings | `settings.py` lines 139–158 |
| ✅ All hard imports in `requirements.txt` | `pdfplumber`, `reportlab`, `psycopg2-binary`, `gunicorn` |
| ✅ No hardcoded Ollama URLs | All replaced with `_OLLAMA_BASE_URL` variable |
| ✅ `manage.py check` passes | 0 issues confirmed locally |
| ⚠️ `SECRET_KEY` set in Railway | Must be done manually |
| ⚠️ `ALLOWED_HOSTS` updated after deploy | Must be done after Railway URL is generated |
| ⚠️ CORS/CSRF updated after Vercel | Must be done after Vercel frontend URL is generated |

---

## Possible Errors and Fixes

| Error message | Cause | Fix |
|---|---|---|
| `ModuleNotFoundError: No module named 'psycopg2'` | psycopg2-binary not installed | Verify `requirements.txt` has `psycopg2-binary==2.9.12` |
| `django.core.exceptions.ImproperlyConfigured: Set the SECRET_KEY environment variable` | SECRET_KEY not set in Railway | Add `SECRET_KEY` to Railway variables |
| `DisallowedHost at /` | ALLOWED_HOSTS doesn't include Railway domain | Update `ALLOWED_HOSTS` to actual domain |
| `Invalid HTTP_HOST header` | Same as above | Same fix |
| `CORS policy blocked` | CORS_ALLOWED_ORIGINS missing Vercel URL | Update `CORS_ALLOWED_ORIGINS` with Vercel URL |
| `502 Bad Gateway` | Gunicorn failed to start or wrong PORT | Check logs; ensure `--bind 0.0.0.0:$PORT` is in start command |
| `ModuleNotFoundError: No module named 'pdfplumber'` | Already fixed — was missing before this preflight | Confirmed added to `requirements.txt` |
| `ModuleNotFoundError: No module named 'reportlab'` | Already fixed — was missing before this preflight | Confirmed added to `requirements.txt` |
| `staticfiles/` missing hashed files | collectstatic didn't run | Check Procfile — collectstatic runs before gunicorn |
| `OperationalError: could not connect to server` | DATABASE_URL not set or PostgreSQL plugin not added | Add PostgreSQL plugin in Railway dashboard |
| AI endpoints return 503 | Ollama not reachable | Expected — graceful fallback returns Arabic error message |

---

## Remaining Limitations

1. **Media files are ephemeral** — uploaded product images, store logo, and supplier photos will be lost on redeploy. Acceptable for graduation demo. Future task: `ERP-DEPLOY-MEDIA-001`.

2. **AI Assistant (`/api/ai/ask/`) will return 503** — Ollama is not available on Railway free tier. Rule-based AI actions still work. Can be fixed by deploying Ollama as a separate Railway service (requires Railway Pro or a dedicated VM).

3. **`pyserial==3.5` in requirements** — This package is for serial hardware communication and is not relevant to web deployment. It will install cleanly but serves no purpose on Railway. No action needed.

---

## Backend Deployment Readiness

| Item | Status |
|---|---|
| `requirements.txt` complete | ✅ |
| `Procfile` correct | ✅ |
| `railway.toml` configured | ✅ |
| `settings.py` production-ready | ✅ |
| `DATABASE_URL` support | ✅ |
| WhiteNoise static files | ✅ |
| CORS/CSRF configurable | ✅ |
| Ollama graceful fallback | ✅ |
| `manage.py check` passes | ✅ 0 issues |
| `SECRET_KEY` set in Railway | ⚠️ User action required |
| `ALLOWED_HOSTS` final value | ⚠️ Set after Railway URL generated |
| CORS/CSRF final values | ⚠️ Set after Vercel URL generated |

**Backend is ready to deploy. Only 3 env vars need manual configuration (SECRET_KEY, ALLOWED_HOSTS, CORS after Vercel).**

---

*End of ERP-DEPLOY-003 — Do not deploy until user confirms credentials are configured.*
