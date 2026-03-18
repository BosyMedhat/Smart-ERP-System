# 🚀 Smart ERP System - Ahmed Hashish Branch

This branch contains the full implementation of the **Invoicing** and **Installment** systems, fully containerized using **Docker**.

## 🛠 Features Implemented
### 1. Invoicing System (Backend & Frontend)
- **Automated Inventory Sync:** Real-time stock deduction upon invoice creation.
- **Tax & Discount Calculation:** Built-in 14% VAT and manual discount fields.
- **POS Interface:** Optimized React UI for fast sales processing.

### 2. Installment Management Engine
- **Automated Scheduling:** Generates monthly installment plans based on down payment and duration.
- **Customer Linking:** Mandatory customer assignment for installment invoices to ensure tracking.


---

## 🐳 Docker Architecture (Multi-Container Setup)
The project is built to run in isolated environments to ensure it works on any machine:
- **Backend Container:** Django REST Framework API.
- **Frontend Container:** React.js (Vite) User Interface.
- **Database Container:** PostgreSQL for secure data storage.

---

## 🚀 How to Run (Getting Started)
To run this project on your machine, ensure you have **Docker** and **Docker Compose** installed, then run:

```bash
docker-compose up --build