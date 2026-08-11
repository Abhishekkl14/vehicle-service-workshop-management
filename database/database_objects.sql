-- ============================================================
-- 25. CUSTOMER SERVICE HISTORY VIEW
-- ============================================================

CREATE OR REPLACE VIEW customer_service_history AS
SELECT
    c.id AS customer_id,
    u.first_name,
    u.last_name,
    v.id AS vehicle_id,
    v.registration_number,
    v.make,
    v.model,
    b.id AS booking_id,
    b.booking_date,
    s.name AS service_name,
    wo.id AS work_order_id,
    wo.status AS work_order_status,
    i.invoice_number,
    i.total_amount AS invoice_total,
    i.status AS invoice_status
FROM customers c
JOIN users u
    ON c.user_id = u.id
JOIN vehicles v
    ON v.customer_id = c.id
JOIN bookings b
    ON b.customer_id = c.id
    AND b.vehicle_id = v.id
JOIN services s
    ON s.id = b.service_id
LEFT JOIN work_orders wo
    ON wo.booking_id = b.id
LEFT JOIN invoices i
    ON i.work_order_id = wo.id;

-- ============================================================
-- STORED FUNCTION
-- Calculate Estimate Total
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_estimate_total(
    p_estimate_id BIGINT
)
RETURNS NUMERIC(12, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_subtotal NUMERIC(12, 2);
    v_tax NUMERIC(12, 2);
    v_discount NUMERIC(12, 2);
    v_total NUMERIC(12, 2);
BEGIN

    SELECT
        subtotal,
        tax_amount,
        discount_amount
    INTO
        v_subtotal,
        v_tax,
        v_discount
    FROM estimates
    WHERE id = p_estimate_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Estimate with ID % does not exist', p_estimate_id;
    END IF;

    v_total := v_subtotal + v_tax - v_discount;

    RETURN v_total;

END;
$$;