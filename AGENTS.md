# AGENTS.md — MwendoSchoolSystem (Codex Rules)

This repository is **MwendoSchoolSystem**, a multi-tenant **School Management System** built with **NestJS + TypeORM + PostgreSQL**.
The system is ~73% complete and the remaining work must preserve **financial correctness** and **multi-tenant isolation**.

Codex: follow these rules exactly. If anything is unclear, inspect the repo and mark TODOs—do not guess.

---

## 0) Prime Directive (P0)
**Never introduce money bugs. Never cross school boundaries. Never allow silent data corruption.**

High-risk areas:
- `src/modules/fees/*`
- `src/database/entities/payment.entity.ts`
- `src/database/entities/fee-invoice.entity.ts`
- `src/database/entities/fee-structure.entity.ts`
- Auth/tenant enforcement (`schoolId` filtering)

---

## 1) Multi-Tenancy Rules (P0)
All queries that read or write tenant data MUST be scoped by `schoolId`.

- Always pass `req.user.schoolId` into service methods.
- Every repository query must include `schoolId` in `where` or be enforced by join conditions.
- Never return data across schools.
- When using QueryBuilder, add:
  - `where('...schoolId = :schoolId', { schoolId })`

If a function takes an `id` (studentId, invoiceId, paymentId), always verify the record belongs to `schoolId` before acting.

---

## 2) Financial Safety Rules (P0)

### 2.1 Payments are immutable
Do **not** edit payment amounts after creation.
To correct mistakes:
- **Reverse** the payment with reason, actor, timestamp.
- Create a new payment entry if needed.

### 2.2 Idempotency (NO duplicate credits)
Payments MUST be idempotent by external reference:

- M-Pesa: `mpesaReceiptNumber`
- Bank: `transactionReference`
- Cheque: `chequeNumber`
- Receipt: `receiptNumber` must always be unique per school

Behavior:
- If a duplicate reference is received, return the existing payment (preferred), and **do not** update the invoice again.

### 2.3 Required DB constraints (P0)
Application-level checks are not enough. Add migrations enforcing these indexes in Postgres:

- `payments (school_id, mpesa_receipt_number)` UNIQUE WHERE `mpesa_receipt_number IS NOT NULL`
- `payments (school_id, transaction_reference)` UNIQUE WHERE `transaction_reference IS NOT NULL`
- `payments (school_id, cheque_number)` UNIQUE WHERE `cheque_number IS NOT NULL`
- `payments (school_id, receipt_number)` UNIQUE
- `fee_invoices (school_id, invoice_number)` UNIQUE

If data already contains duplicates, Codex must:
- report them,
- propose a cleanup strategy,
- avoid destructive actions without explicit instruction.

### 2.4 Transactions + Row locking
Any operation that changes invoice balances or payment status MUST:
- run inside a single DB transaction,
- lock invoice row using `pessimistic_write` / `SELECT ... FOR UPDATE`,
- be safe under concurrent requests.

### 2.5 Money math
- DB uses `decimal(12,2)` for all money columns (FeeStructure, FeeInvoice, Payment).
- Use strict parsing for inputs (`parseMoneyStrict`) and consistent rounding (`moneyRound` / `moneyOrZero`).
- Never allow:
  - negative totals
  - negative balances
  - negative `amountPaid`

### 2.6 Integrity checks
When paying an invoice:
- `dto.studentId` (if provided) must equal `invoice.studentId`
- block paying CANCELLED or PAID invoices
- block amount <= 0
- block amount > invoice.balance

On reversal:
- block reversing already reversed payment
- ensure `invoice.amountPaid` never goes below 0
- restore invoice status correctly:
  - unpaid should revert to `DRAFT` if never sent, else `SENT`
  - partial stays `PARTIALLY_PAID`

---

## 3) Controller/Service Contract Rules
Fees controller expects these service methods to exist (do not remove):
- `getStudentFeeStatement`
- `getClassFeesSummary`
- `getPaymentMethodsBreakdown`
- `getTermlyCollectionSummary`
- plus all fee structures/invoices/payments methods already wired.

Always maintain Swagger annotations and endpoint behavior.

---

## 4) Performance Rules (Scaling to 2000 students / 5 schools)

- Avoid N+1 queries. Prefer bulk queries (`IN (...)`) and joins.
- List endpoints must be paginated by default; cap `limit` at 100.
- `GET` endpoints must NOT write to DB (no silent status updates).
- Invoice listing should not eagerly load heavy relations (e.g., payments) unless on detail endpoints.

Known optimizations already applied in fees:
- Bulk invoice generation should prefetch existing invoices.
- Defaulters filtering by class should be in SQL (QueryBuilder).
- Invoice list should omit payments relation; include payments only in detail view.

---

## 5) Testing Expectations (P0)
For any change in fees/payments:
Add or update tests (unit or e2e) for:
1) Duplicate M-Pesa reference submitted twice -> only one payment recorded and no double-credit
2) Two concurrent payments on same invoice -> balances remain correct
3) Reversal cannot make `amountPaid` negative
4) Overpayment is rejected

If tests are missing in repo, provide a minimal smoke test script or documented checklist.

---

## 6) Coding Standards
- Use DTO validation (class-validator) for inputs.
- Prefer clear exceptions:
  - 400 for invalid input
  - 404 for missing records
  - 409 for duplicate business conflicts (optional), or return existing for idempotency
- Keep services slim and predictable; do not “hide” side effects in reads.

---

## 7) Priority Backlog (from handoff)

### P0 (do first)
1) Add migration for payment unique constraints + invoice number uniqueness.
2) Verify fees module smoke tests (invoice -> payment -> duplicate -> reversal).
3) Verify attendance module compiles and runs (fix any remaining TS errors).

### P1 (next)
- M-Pesa STK push integration (Daraja) + callback handling
- Notifications (SMS/email) for invoice sent + payment receipt
- PDF invoice + receipt generation

---

## 8) Output Requirements for Codex
When making changes:
- Open a PR with a clear title and summary.
- Include file paths changed.
- Explain how changes maintain idempotency and multi-tenant safety.
- If any uncertainty: mark TODOs and point to exact code areas.

End of rules.
