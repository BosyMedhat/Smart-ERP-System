# PROJECT_STATE.md

## Current Architecture
- **Frontend Stack**: React (TypeScript, Vite, TailwindCSS, Lucide Icons, Recharts, React-Speech-Recognition).
- **Backend Stack**: Django REST Framework (DRF) running on `127.0.0.1:8000`.
- **Database**: PostgreSQL (`erp_db`) running on Docker container `erp_postgres_db`.
- **Apps/Modules Structure**:
  - `smart_erp_backend/customers` (Customer & Auth mapping)
  - `smart_erp_backend/inventory` (Products, Invoices, Expenses, Employees, Treasuries)
  - `smart_erp_backend/accounts` (User Profiles & Permissions separation)
  - `smart_erp_backend/ai_assistant` (AI Endpoints mapped via LangChain Ollama)

- [x] **Financial Closure Implementation**:
  - [x] Unified Treasury Ledger (Replaced signals with explicit logs in ViewSets).
  - [x] Automated Stock increase/decrease across all transactions.
  - [x] Automated 14% Tax & Discount storage in Invoices.
  - [x] Integrated Employee Salaries & Advances with Treasury.
  - [x] Implemented Treasury Overdraft Prevention (Prevents negative balance).
  - [x] Automated Installment schedule generation.

## Next Steps
- Implement Receipt Printing layout with QR Code.
- Implement Customer Loyalty/Credit system.
- Refine Dashboard Charts with real shift-normalized data.
- Integrate ZATCA Electronic Invoicing (Phase 1 & 2).

## Known Credentials
- **Backend Port**: `8000` (`http://127.0.0.1:8000`)
- **Frontend Port**: Vite Default (`http://localhost:5173/`)
- **Database (PostgreSQL)**:
  - Host: `127.0.0.1` | Port: `5432`
  - DB Name: `erp_db`
  - User: `admin` | Password: `adminpass`
- **Superuser**: `admin_temp` / `adminpass` (Generated during seeding)

*Note: This file is updated routinely to maintain cross-session context continuity.*
