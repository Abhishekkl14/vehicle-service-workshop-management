-- ============================================================
-- CLEAN TEST DATA
-- ============================================================

DELETE FROM payments
WHERE invoice_id IN (
    SELECT i.id
    FROM invoices i
    JOIN work_orders wo
        ON i.work_order_id = wo.id
    JOIN vehicles v
        ON wo.vehicle_id = v.id
    WHERE v.registration_number = 'TN01AB1234'
);

DELETE FROM invoice_items
WHERE invoice_id IN (
    SELECT i.id
    FROM invoices i
    JOIN work_orders wo
        ON i.work_order_id = wo.id
    JOIN vehicles v
        ON wo.vehicle_id = v.id
    WHERE v.registration_number = 'TN01AB1234'
);

DELETE FROM invoices
WHERE work_order_id IN (
    SELECT wo.id
    FROM work_orders wo
    JOIN vehicles v
        ON wo.vehicle_id = v.id
    WHERE v.registration_number = 'TN01AB1234'
);

DELETE FROM approvals
WHERE estimate_id IN (
    SELECT e.id
    FROM estimates e
    JOIN work_orders wo
        ON e.work_order_id = wo.id
    JOIN vehicles v
        ON wo.vehicle_id = v.id
    WHERE v.registration_number = 'TN01AB1234'
);

DELETE FROM estimate_items
WHERE estimate_id IN (
    SELECT e.id
    FROM estimates e
    JOIN work_orders wo
        ON e.work_order_id = wo.id
    JOIN vehicles v
        ON wo.vehicle_id = v.id
    WHERE v.registration_number = 'TN01AB1234'
);

DELETE FROM estimates
WHERE work_order_id IN (
    SELECT wo.id
    FROM work_orders wo
    JOIN vehicles v
        ON wo.vehicle_id = v.id
    WHERE v.registration_number = 'TN01AB1234'
);

DELETE FROM work_order_parts
WHERE work_order_id IN (
    SELECT wo.id
    FROM work_orders wo
    JOIN vehicles v
        ON wo.vehicle_id = v.id
    WHERE v.registration_number = 'TN01AB1234'
);

DELETE FROM inspection_items
WHERE inspection_id IN (
    SELECT i.id
    FROM inspections i
    JOIN work_orders wo
        ON i.work_order_id = wo.id
    JOIN vehicles v
        ON wo.vehicle_id = v.id
    WHERE v.registration_number = 'TN01AB1234'
);

DELETE FROM inspections
WHERE work_order_id IN (
    SELECT wo.id
    FROM work_orders wo
    JOIN vehicles v
        ON wo.vehicle_id = v.id
    WHERE v.registration_number = 'TN01AB1234'
);

DELETE FROM work_orders
WHERE vehicle_id IN (
    SELECT id
    FROM vehicles
    WHERE registration_number = 'TN01AB1234'
);

DELETE FROM bookings
WHERE vehicle_id IN (
    SELECT id
    FROM vehicles
    WHERE registration_number = 'TN01AB1234'
);

DELETE FROM vehicles
WHERE registration_number = 'TN01AB1234';

DELETE FROM customers
WHERE user_id IN (
    SELECT id
    FROM users
    WHERE email = 'customer@example.com'
);

DELETE FROM users
WHERE email IN (
    'customer@example.com',
    'mechanic@example.com'
);