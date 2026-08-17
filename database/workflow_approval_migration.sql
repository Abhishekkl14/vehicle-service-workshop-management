-- ============================================================
-- STEP 3 — PHASE 1 FOUNDATION: MECHANIC WORKFLOW / ADVISOR
-- APPROVAL DATABASE MIGRATION (MIGRATION-READY SQL)
-- ============================================================
-- DO NOT apply this to a live database without a controlled
-- migration step. This project has no migration framework yet.
-- Do NOT re-run database/schema.sql on top of this file, and do
-- NOT apply this file before schema.sql has been applied once.
--
-- The file is SAFE / IDEMPOTENT / ADDITIVE:
--   * Wrapped in BEGIN / COMMIT (all-or-nothing).
--   * ALTER TABLE ... ADD COLUMN IF NOT EXISTS — only adds a
--     column when it does not already exist.
--   * CREATE TABLE IF NOT EXISTS — no duplicate table errors.
--   * Constraint/index creation guarded by existence checks in
--     DO $$ blocks, so re-runs do not raise duplicate-name
--     errors.
--   * No tables or columns are ever dropped, and no rows are
--     deleted or modified.
--
-- Apply with:
--   psql -d <database> -f database/workflow_approval_migration.sql
--
-- Contents:
--   1. work_orders        : + approval workflow columns
--   2. work_orders        : status CHECK now includes
--                           SUBMITTED_FOR_APPROVAL
--   3. work_order_services: NEW table (actual/estimated work)
--   4. work_order_parts   : + source column (ESTIMATE/ACTUAL)
--   5. work_order_approvals: NEW table (advisor audit trail)
--   6. invoice_items      : + item_type column (PART/LABOR/SERVICE)

BEGIN;

-- ============================================================
-- 1. WORK ORDERS — APPROVAL WORKFLOW COLUMNS
-- ============================================================
-- All new columns are nullable so existing rows stay valid and
-- work orders that never enter the approval flow are unaffected.
-- approved_by / rejected_by reference users.id (the advisor).

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS approved_by BIGINT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS rejected_by BIGINT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Foreign keys for the new nullable user columns.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_work_orders_approved_by'
    ) THEN
        ALTER TABLE work_orders
            ADD CONSTRAINT fk_work_orders_approved_by
            FOREIGN KEY (approved_by)
            REFERENCES users(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_work_orders_rejected_by'
    ) THEN
        ALTER TABLE work_orders
            ADD CONSTRAINT fk_work_orders_rejected_by
            FOREIGN KEY (rejected_by)
            REFERENCES users(id);
    END IF;
END $$;


-- ============================================================
-- 2. WORK ORDERS — STATUS CHECK + SUBMITTED_FOR_APPROVAL
-- ============================================================
-- Preferred flow: mechanic submits -> SUBMITTED_FOR_APPROVAL ->
-- advisor approves -> COMPLETED (COMPLETED stays final).
-- Rejection returns the work order to IN_PROGRESS.
-- 'APPROVED' is intentionally NOT added as a work-order status;
-- the advisor decision is recorded in work_order_approvals.
--
-- Postgres cannot ALTER a CHECK constraint, so the existing
-- chk_work_order_status is replaced only when it is present and
-- does not already allow SUBMITTED_FOR_APPROVAL. This is an
-- idempotent constraint replacement — no table, column, or row
-- is dropped.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_work_order_status'
          AND pg_get_constraintdef(oid) ILIKE '%SUBMITTED_FOR_APPROVAL%'
    ) THEN
        ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS chk_work_order_status;
        ALTER TABLE work_orders
            ADD CONSTRAINT chk_work_order_status
            CHECK (
                status IN (
                    'CREATED',
                    'ASSIGNED',
                    'INSPECTION',
                    'WAITING_FOR_APPROVAL',
                    'SUBMITTED_FOR_APPROVAL',
                    'IN_PROGRESS',
                    'COMPLETED'
                )
            );
    END IF;
END $$;


-- ============================================================
-- 3. WORK ORDER SERVICES (NEW TABLE)
-- ============================================================
-- Records the work actually performed on a work order, plus the
-- advisor estimate baseline (source = ESTIMATE/ACTUAL).
--   * service_id is NULL for CONSUMABLE / LABOR rows; it points
--     to services.id when item_type = 'SERVICE'.
--   * quantity > 0; unit_price / total_price >= 0; money is
--     NUMERIC(12,2).
--   * total_price is stored explicitly (never recomputed from
--     unit_price * quantity by readers).
--   * No inventory behavior for consumables in this phase.
--   * Existing estimate data is not rewritten — estimates keep
--     living in estimate_items. Actual mechanic work is recorded
--     here with source = 'ACTUAL'.

CREATE TABLE IF NOT EXISTS work_order_services (
    id BIGSERIAL PRIMARY KEY,
    work_order_id BIGINT NOT NULL,
    service_id BIGINT,
    item_type VARCHAR(20) NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    estimated_minutes INTEGER,
    source VARCHAR(20) NOT NULL,
    notes TEXT,

    CONSTRAINT fk_work_order_services_work_order
        FOREIGN KEY (work_order_id)
        REFERENCES work_orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_work_order_services_service
        FOREIGN KEY (service_id)
        REFERENCES services(id),

    CONSTRAINT chk_work_order_service_item_type
        CHECK (
            item_type IN (
                'SERVICE',
                'CONSUMABLE',
                'LABOR'
            )
        ),

    CONSTRAINT chk_work_order_service_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_work_order_service_unit_price
        CHECK (unit_price >= 0),

    CONSTRAINT chk_work_order_service_total_price
        CHECK (total_price >= 0),

    CONSTRAINT chk_work_order_service_duration
        CHECK (
            estimated_minutes IS NULL
            OR estimated_minutes >= 0
        ),

    CONSTRAINT chk_work_order_service_source
        CHECK (
            source IN (
                'ESTIMATE',
                'ACTUAL'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_work_order_services_work_order_id
    ON work_order_services (work_order_id);

CREATE INDEX IF NOT EXISTS idx_work_order_services_service_id
    ON work_order_services (service_id);


-- ============================================================
-- 4. WORK ORDER PARTS — source COLUMN
-- ============================================================
-- Existing rows (all created during estimate planning) become
-- source = 'ESTIMATE', keeping them valid without any data
-- rewrite. The later mechanic work-tracking step will write
-- source = 'ACTUAL' for parts actually used.

ALTER TABLE work_order_parts ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'ESTIMATE';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_work_order_part_source'
    ) THEN
        ALTER TABLE work_order_parts
            ADD CONSTRAINT chk_work_order_part_source
            CHECK (
                source IN (
                    'ESTIMATE',
                    'ACTUAL'
                )
            );
    END IF;
END $$;


-- ============================================================
-- 5. WORK ORDER APPROVALS (NEW TABLE)
-- ============================================================
-- Audit trail of advisor decisions on completed work orders.
-- Multiple decisions over time are allowed (a work order may be
-- submitted, rejected, reworked, and submitted again), so there
-- is deliberately NO unique constraint on work_order_id.
-- decided_by references users.id (the advisor).

CREATE TABLE IF NOT EXISTS work_order_approvals (
    id BIGSERIAL PRIMARY KEY,
    work_order_id BIGINT NOT NULL,
    decision VARCHAR(20) NOT NULL,
    decided_by BIGINT NOT NULL,
    comments TEXT,
    decided_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_work_order_approvals_work_order
        FOREIGN KEY (work_order_id)
        REFERENCES work_orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_work_order_approvals_decided_by
        FOREIGN KEY (decided_by)
        REFERENCES users(id),

    CONSTRAINT chk_work_order_approval_decision
        CHECK (
            decision IN (
                'APPROVED',
                'REJECTED'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_work_order_approvals_work_order_id
    ON work_order_approvals (work_order_id);

CREATE INDEX IF NOT EXISTS idx_work_order_approvals_decided_by
    ON work_order_approvals (decided_by);


-- ============================================================
-- 6. INVOICE ITEMS — item_type COLUMN
-- ============================================================
-- Backward-compatible: the column is NULLABLE because existing
-- invoice_items were generated from mixed estimate/part sources
-- whose exact type cannot be reliably inferred per row. NULL
-- keeps every existing row valid without fabricating data. The
-- invoice-generation code is updated later to set item_type
-- (PART/LABOR/SERVICE) for all new rows.

ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS item_type VARCHAR(20);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_invoice_item_type'
    ) THEN
        ALTER TABLE invoice_items
            ADD CONSTRAINT chk_invoice_item_type
            CHECK (
                item_type IS NULL
                OR item_type IN (
                    'PART',
                    'LABOR',
                    'SERVICE'
                )
            );
    END IF;
END $$;

COMMIT;
