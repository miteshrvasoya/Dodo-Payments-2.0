# AI_USAGE.md

## AI Tools Used

### ChatGPT

Used mainly for:

* discussing payment system design tradeoffs
* validating concurrency handling approaches
* structuring DESIGN.md
* generating initial boilerplate prompts for project setup

---

### Google Antigravity (Claude Opus & Gemini Flash 3)

Used for:

* TypeScript/Fastify boilerplate generation
* route scaffolding
* migration scaffolding
* Docker configuration setup
* repetitive CRUD handler generation
* autocomplete during implementation

---

## Decisions I Made Independently or Against AI Suggestions

### 1. Using the `payments` table as the idempotency store

One suggestion was to create a separate `idempotency_keys` table similar to Stripe-style architectures.

I intentionally simplified this by storing:

* `idempotency_key`
* `request_hash`

directly in the `payments` table.

Reason:
The assignment explicitly rewards restraint and simplicity. A dedicated idempotency service/table felt unnecessary for the scope of this system. Additionally, we can check and restrict the duplicate payment using indempotency-key only.

---

### 2. Choosing PostgreSQL row-level locking

AI suggested optimistic concurrency and advisory locks as alternatives.

I chose:

```sql id="j61k0f"
SELECT ... FOR UPDATE
```

Reason:
As system uses a single PostgreSQL primary database only we can choose it and it's the only simplest way to prevent the duplication in case of concurrancy.

---

### 3. Using a seeded demo business instead of business CRUD APIs

It has suggested to implement full business registration and API key management endpoints.

I intentionally avoided building these APIs and instead seeded a demo business and API key during startup.

Reason:
Business management APIs were not required for the assignment.

---

### 4. Implementation of the Transaction and Lock (AI didn't suggested this)

For smooth and correct flow, I've implemented as Transaction with locks, which ensures the consistency and correctness of payment flow. Either all the updates are done for all the respective entities or for none. 

In case of Payment in Real world scenarios, We can't not introduce transaction if we call PSP payment initiate API otherwise upon certain error transaction will be rollbacked but payment will be initiated from psp. In such scenarios, we need to develop status check APIs and we need to add transaction there to ensure correctness of data across all the entities.

## Verification Approach

Even when AI-generated code was used, I manually reviewed and validated:

* payment transaction flow
* invoice state transitions
* idempotency handling
* webhook retry logic
* PostgreSQL transaction behavior

Particular attention was given to:

* duplicate payment prevention
* concurrent payment correctness
* PSP timeout handling
* ensuring no floating-point values existed in the money path
