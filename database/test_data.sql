-- ============================================================
-- VEHICLE SERVICE & WORKSHOP MANAGEMENT SYSTEM
-- MVP TEST DATA
-- ============================================================


-- ============================================================
-- 1. CUSTOMER USER
-- ============================================================

INSERT INTO users (
    role_id,
    email,
    password_hash,
    first_name,
    last_name,
    phone
)
VALUES (
    (SELECT id FROM roles WHERE name = 'CUSTOMER'),
    'customer@example.com',
    'demo_hash_customer',
    'Abhishek',
    'K',
    '9876543210'
);


-- ============================================================
-- 2. CUSTOMER PROFILE
-- ============================================================

INSERT INTO customers (
    user_id,
    address,
    city
)
VALUES (
    (SELECT id FROM users WHERE email = 'customer@example.com'),
    'Chennai',
    'Chennai'
);


-- ============================================================
-- 3. MECHANIC USER
-- ============================================================

INSERT INTO users (
    role_id,
    email,
    password_hash,
    first_name,
    last_name,
    phone
)
VALUES (
    (SELECT id FROM roles WHERE name = 'MECHANIC'),
    'mechanic@example.com',
    'demo_hash_mechanic',
    'Raj',
    'Kumar',
    '9876501234'
);


-- ============================================================
-- 4. VEHICLE
-- ============================================================

INSERT INTO vehicles (
    customer_id,
    vehicle_type_id,
    registration_number,
    vin,
    make,
    model,
    manufacturing_year,
    color,
    mileage
)
VALUES (
    (
        SELECT c.id
        FROM customers c
        JOIN users u
            ON c.user_id = u.id
        WHERE u.email = 'customer@example.com'
    ),
    (
        SELECT id
        FROM vehicle_types
        WHERE name = 'SEDAN'
    ),
    'TN01AB1234',
    'HONDACITYVIN001',
    'Honda',
    'City',
    2022,
    'White',
    42000
);


-- ============================================================
-- 5. SERVICE BOOKING
-- ============================================================

INSERT INTO bookings (
    customer_id,
    vehicle_id,
    service_id,
    booking_date,
    booking_time,
    status,
    customer_notes
)
VALUES (
    (
        SELECT c.id
        FROM customers c
        JOIN users u
            ON c.user_id = u.id
        WHERE u.email = 'customer@example.com'
    ),
    (
        SELECT id
        FROM vehicles
        WHERE registration_number = 'TN01AB1234'
    ),
    (
        SELECT id
        FROM services
        WHERE name = 'General Service'
    ),
    CURRENT_DATE + 1,
    '10:00:00',
    'CONFIRMED',
    'Please check brakes and engine condition.'
);


-- ============================================================
-- 6. WORK ORDER
-- ============================================================

INSERT INTO work_orders (
    booking_id,
    vehicle_id,
    assigned_mechanic_id,
    status,
    complaint,
    received_at
)
VALUES (
    (
        SELECT id
        FROM bookings
        WHERE vehicle_id = (
            SELECT id
            FROM vehicles
            WHERE registration_number = 'TN01AB1234'
        )
    ),
    (
        SELECT id
        FROM vehicles
        WHERE registration_number = 'TN01AB1234'
    ),
    (
        SELECT id
        FROM users
        WHERE email = 'mechanic@example.com'
    ),
    'INSPECTION',
    'Customer reports brake noise and requests general service.',
    CURRENT_TIMESTAMP
);


-- ============================================================
-- 7. INSPECTION
-- ============================================================

INSERT INTO inspections (
    work_order_id,
    mechanic_id,
    overall_notes
)
VALUES (
    (
        SELECT id
        FROM work_orders
        WHERE vehicle_id = (
            SELECT id
            FROM vehicles
            WHERE registration_number = 'TN01AB1234'
        )
    ),
    (
        SELECT id
        FROM users
        WHERE email = 'mechanic@example.com'
    ),
    'Vehicle inspected. Brake components show wear and air filter is dirty.'
);


-- ============================================================
-- 8. INSPECTION ITEM — BRAKE PADS
-- ============================================================

INSERT INTO inspection_items (
    inspection_id,
    component,
    condition,
    severity,
    notes,
    recommended_action
)
VALUES (
    (
        SELECT i.id
        FROM inspections i
        JOIN work_orders wo
            ON i.work_order_id = wo.id
        JOIN vehicles v
            ON wo.vehicle_id = v.id
        WHERE v.registration_number = 'TN01AB1234'
    ),
    'Brake Pads',
    'Worn',
    'HIGH',
    'Brake pads are significantly worn.',
    'Replace front brake pads'
);


-- ============================================================
-- 9. INSPECTION ITEM — AIR FILTER
-- ============================================================

INSERT INTO inspection_items (
    inspection_id,
    component,
    condition,
    severity,
    notes,
    recommended_action
)
VALUES (
    (
        SELECT i.id
        FROM inspections i
        JOIN work_orders wo
            ON i.work_order_id = wo.id
        JOIN vehicles v
            ON wo.vehicle_id = v.id
        WHERE v.registration_number = 'TN01AB1234'
    ),
    'Air Filter',
    'Dirty',
    'MEDIUM',
    'Air filter has excessive dirt accumulation.',
    'Replace air filter'
);


-- ============================================================
-- 10. WORK ORDER PART — BRAKE PAD
-- ============================================================

INSERT INTO work_order_parts (
    work_order_id,
    part_id,
    quantity,
    unit_price,
    total_price
)
VALUES (
    (
        SELECT id
        FROM work_orders
        WHERE vehicle_id = (
            SELECT id
            FROM vehicles
            WHERE registration_number = 'TN01AB1234'
        )
    ),
    (
        SELECT id
        FROM parts
        WHERE part_number = 'BP001'
    ),
    1,
    3000.00,
    3000.00
);


-- ============================================================
-- 11. WORK ORDER PART — AIR FILTER
-- ============================================================

INSERT INTO work_order_parts (
    work_order_id,
    part_id,
    quantity,
    unit_price,
    total_price
)
VALUES (
    (
        SELECT id
        FROM work_orders
        WHERE vehicle_id = (
            SELECT id
            FROM vehicles
            WHERE registration_number = 'TN01AB1234'
        )
    ),
    (
        SELECT id
        FROM parts
        WHERE part_number = 'AF001'
    ),
    1,
    800.00,
    800.00
);


-- ============================================================
-- 12. ESTIMATE
-- ============================================================

INSERT INTO estimates (
    work_order_id,
    subtotal,
    tax_amount,
    discount_amount,
    total_amount,
    estimated_duration_minutes,
    status,
    sent_at
)
VALUES (
    (
        SELECT id
        FROM work_orders
        WHERE vehicle_id = (
            SELECT id
            FROM vehicles
            WHERE registration_number = 'TN01AB1234'
        )
    ),
    4800.00,
    864.00,
    0.00,
    5664.00,
    180,
    'SENT',
    CURRENT_TIMESTAMP
);


-- ============================================================
-- 13. ESTIMATE ITEM — BRAKE PAD
-- ============================================================

INSERT INTO estimate_items (
    estimate_id,
    item_type,
    description,
    quantity,
    unit_price,
    estimated_minutes,
    total_price
)
VALUES (
    (
    SELECT e.id
    FROM estimates e
    JOIN work_orders wo
        ON e.work_order_id = wo.id
    JOIN vehicles v
        ON wo.vehicle_id = v.id
    WHERE v.registration_number = 'TN01AB1234'
    ),
    'PART',
    'Front Brake Pad',
    1,
    3000.00,
    60,
    3000.00
);


-- ============================================================
-- 14. ESTIMATE ITEM — AIR FILTER
-- ============================================================

INSERT INTO estimate_items (
    estimate_id,
    item_type,
    description,
    quantity,
    unit_price,
    estimated_minutes,
    total_price
)
VALUES (
    (
    SELECT e.id
    FROM estimates e
    JOIN work_orders wo
        ON e.work_order_id = wo.id
    JOIN vehicles v
        ON wo.vehicle_id = v.id
    WHERE v.registration_number = 'TN01AB1234'
    ),
    'PART',
    'Air Filter',
    1,
    800.00,
    20,
    800.00
);


-- ============================================================
-- 15. ESTIMATE ITEM — LABOR
-- ============================================================

INSERT INTO estimate_items (
    estimate_id,
    item_type,
    description,
    quantity,
    unit_price,
    estimated_minutes,
    total_price
)
VALUES (
    (
    SELECT e.id
    FROM estimates e
    JOIN work_orders wo
        ON e.work_order_id = wo.id
    JOIN vehicles v
        ON wo.vehicle_id = v.id
    WHERE v.registration_number = 'TN01AB1234'
    ),
    'LABOR',
    'Brake and filter replacement labor',
    1,
    1000.00,
    100,
    1000.00
);


-- ============================================================
-- 16. CUSTOMER APPROVAL
-- ============================================================

INSERT INTO approvals (
    estimate_id,
    customer_id,
    decision,
    comments
)
VALUES (
    (
    SELECT e.id
    FROM estimates e
    JOIN work_orders wo
        ON e.work_order_id = wo.id
    JOIN vehicles v
        ON wo.vehicle_id = v.id
    WHERE v.registration_number = 'TN01AB1234'
    ),
    (
        SELECT c.id
        FROM customers c
        JOIN users u
            ON c.user_id = u.id
        WHERE u.email = 'customer@example.com'
    ),
    'APPROVED',
    'Please proceed with the recommended work.'
);


-- ============================================================
-- 17. UPDATE ESTIMATE STATUS
-- ============================================================

UPDATE estimates
SET status = 'APPROVED'
WHERE work_order_id = (
    SELECT wo.id
    FROM work_orders wo
    JOIN vehicles v
        ON wo.vehicle_id = v.id
    WHERE v.registration_number = 'TN01AB1234'
);


-- ============================================================
-- 18. UPDATE WORK ORDER STATUS
-- ============================================================

UPDATE work_orders
SET status = 'IN_PROGRESS',
    started_at = CURRENT_TIMESTAMP
WHERE vehicle_id = (
    SELECT id
    FROM vehicles
    WHERE registration_number = 'TN01AB1234'
);