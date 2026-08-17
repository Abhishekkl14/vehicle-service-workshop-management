-- ============================================================
-- PAYMENT IDEMPOTENCY — MIGRATION-READY SQL (STEP 2 FIX #5B)
-- ============================================================
-- DO NOT apply this to a live database without a controlled
-- migration step. This project has no migration framework yet.
--
-- This index is DEFENSE-IN-DEPTH behind the application-level
-- idempotency check in PaymentService.create_payment:
--
--   * The service normalizes blank/whitespace references to NULL
--     and, inside the invoice FOR UPDATE transaction, replays an
--     existing SUCCESS payment that shares a non-null reference
--     instead of creating a duplicate.
--   * The per-invoice row lock serializes same-invoice requests,
--     but a global reference could be replayed against TWO
--     DIFFERENT invoices concurrently (each holds a different
--     invoice lock, so neither sees the other's uncommitted row).
--     This partial unique index is what rejects that second
--     insert at commit time.
--
-- Why partial (WHERE transaction_reference IS NOT NULL AND
-- status = 'SUCCESS'):
--   * NULL references are legitimate (optional reference
--     payments) and must keep working.
--   * FAILED/PENDING rows must NOT permanently consume a
--     reference — a retried attempt with the same reference must
--     still be able to record a SUCCESS payment.
--
-- Pre-requisite (verified on the current dataset):
--   * No duplicate non-null references exist (checked at
--     implementation time). If duplicates exist in any future
--     environment, resolve them BEFORE applying this index.
--
-- Apply with:
--   psql -d <database> -f database/payment_idempotency_index.sql
-- (or your chosen SQL client / eventual migration tooling).

CREATE UNIQUE INDEX uq_payments_success_transaction_reference
    ON payments (transaction_reference)
    WHERE transaction_reference IS NOT NULL
      AND status = 'SUCCESS';
