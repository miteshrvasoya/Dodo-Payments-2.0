# Dodo Payments 2.0 - Backend Assignment

A robust, multi-tenant invoice management and payment processing platform built with Node.js, Express, and PostgreSQL.

---

## 🎥 Demo Video
[![Watch the Demo](https://img.shields.io/badge/Watch-Demo_Video-red?style=for-the-badge&logo=youtube)](https://drive.google.com/file/d/1pbUIpB6TJBZrSC5AMIbLQeR2eo_7c2eJ/view?usp=sharing)  
*Click the badge above to see the platform in action.*

---

## 🚀 Quick Start (Development Mode)

The project is fully containerized. For the best development experience with hot-reloading and live logs, use the following command:

```powershell
docker compose -f docker-compose.dev.yml up --build
```

**Access Points:**
- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173) (Dev Tooling)
- **API Server**: [http://localhost:3000](http://localhost:3000)
- **Mock PSP**: [http://localhost:3001](http://localhost:3001)

---

## 🛠 Features

- **Multi-Tenant Architecture**: Business-scoped customers, invoices, and payments.
- **Idempotent Payments**: Robust protection against duplicate charges using `Idempotency-Key` and request body hashing.
- **Transactional Integrity**: Uses PostgreSQL row-level locking (`FOR UPDATE`) to ensure atomic state transitions.
- **Webhook System**: Signed deliveries (HMAC-SHA256) with asynchronous retries and exponential backoff.
- **Mock PSP Testing**: Granular control over payment outcomes (Success, Decline, Timeout, Network Error).
- **Persistent Storage**: Configured with bind mounts to ensure data persists even after container removals.

---

## 🌐 Frontend (Internal Dev Tool)
The included Frontend application is built strictly as a **Development Utility** to allow for easy interaction with the API and manual testing of the payment flows. It is not intended as a production-facing merchant dashboard.

---

## 📚 Documentation & testing

- **[DESIGN.md](./DESIGN.md)**: Detailed breakdown of the data model, state machines, and concurrency handling.
- **[API_cURLs.md](./API_cURLs.md)**: Ready-to-use cURL commands for all backend endpoints.
- **[AI_USAGE.md](./AI_USAGE.md)**: Disclosure of AI assistance and independent design decisions.

### Concurrency Test
To verify the robust locking and idempotency logic, you can run the included concurrency test script:
```bash
npm run test:concurrency
```

---

## 🔐 Authentication
All API requests require a Bearer token.
**Demo Key:** `whsec_acme_secret_123`

```http
Authorization: Bearer whsec_acme_secret_123
```
