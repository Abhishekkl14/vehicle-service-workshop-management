-- ============================================================
-- 1. ROLES
-- ============================================================

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);


-- ============================================================
-- 2. USERS
-- ============================================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
);


-- ============================================================
-- 3. CUSTOMERS
-- ============================================================

CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_customers_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 4. VEHICLE TYPES
-- ============================================================

CREATE TABLE vehicle_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);


-- ============================================================
-- 5. VEHICLES
-- ============================================================

CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    vehicle_type_id BIGINT,
    registration_number VARCHAR(30) NOT NULL UNIQUE,
    vin VARCHAR(50) UNIQUE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    manufacturing_year INTEGER,
    color VARCHAR(50),
    mileage INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_vehicles_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_vehicles_type
        FOREIGN KEY (vehicle_type_id)
        REFERENCES vehicle_types(id),

    CONSTRAINT chk_vehicle_mileage
        CHECK (mileage >= 0),

    CONSTRAINT chk_manufacturing_year
        CHECK (
            manufacturing_year IS NULL
            OR manufacturing_year BETWEEN 1900 AND 2100
        )
);


-- ============================================================
-- 6. SERVICES
-- ============================================================

CREATE TABLE services (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    base_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    estimated_duration_minutes INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_service_price
        CHECK (base_price >= 0),

    CONSTRAINT chk_service_duration
        CHECK (estimated_duration_minutes >= 0)
);


-- ============================================================
-- 7. BOOKINGS
-- ============================================================

CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    customer_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bookings_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_bookings_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicles(id),

    CONSTRAINT fk_bookings_service
        FOREIGN KEY (service_id)
        REFERENCES services(id),

    CONSTRAINT chk_booking_status
        CHECK (
            status IN (
                'PENDING',
                'CONFIRMED',
                'VEHICLE_RECEIVED',
                'CANCELLED'
            )
        )
);


-- ============================================================
-- 8. WORK ORDERS
-- ============================================================

CREATE TABLE work_orders (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    vehicle_id BIGINT NOT NULL,
    assigned_mechanic_id BIGINT,
    status VARCHAR(40) NOT NULL DEFAULT 'CREATED',
    complaint TEXT,
    received_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_work_orders_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id),

    CONSTRAINT fk_work_orders_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicles(id),

    CONSTRAINT fk_work_orders_mechanic
        FOREIGN KEY (assigned_mechanic_id)
        REFERENCES users(id),

    CONSTRAINT chk_work_order_status
        CHECK (
            status IN (
                'CREATED',
                'ASSIGNED',
                'INSPECTION',
                'WAITING_FOR_APPROVAL',
                'IN_PROGRESS',
                'COMPLETED'
            )
        )
);


-- ============================================================
-- 9. INSPECTIONS
-- ============================================================

CREATE TABLE inspections (
    id BIGSERIAL PRIMARY KEY,
    work_order_id BIGINT NOT NULL UNIQUE,
    mechanic_id BIGINT NOT NULL,
    overall_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    inspected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inspections_work_order
        FOREIGN KEY (work_order_id)
        REFERENCES work_orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_inspections_mechanic
        FOREIGN KEY (mechanic_id)
        REFERENCES users(id)
);


-- ============================================================
-- 10. INSPECTION ITEMS
-- ============================================================

CREATE TABLE inspection_items (
    id BIGSERIAL PRIMARY KEY,
    inspection_id BIGINT NOT NULL,
    component VARCHAR(100) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    notes TEXT,
    recommended_action TEXT,

    CONSTRAINT fk_inspection_items_inspection
        FOREIGN KEY (inspection_id)
        REFERENCES inspections(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_inspection_severity
        CHECK (
            severity IN (
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
            )
        )
);


-- ============================================================
-- 11. PARTS
-- ============================================================

CREATE TABLE parts (
    id BIGSERIAL PRIMARY KEY,
    part_number VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    unit_price NUMERIC(12, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

    CONSTRAINT chk_part_price
        CHECK (unit_price >= 0),

    CONSTRAINT chk_part_stock
        CHECK (stock_quantity >= 0)
);


-- ============================================================
-- 12. WORK ORDER PARTS
-- ============================================================

CREATE TABLE work_order_parts (
    id BIGSERIAL PRIMARY KEY,
    work_order_id BIGINT NOT NULL,
    part_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,

    CONSTRAINT fk_work_order_parts_work_order
        FOREIGN KEY (work_order_id)
        REFERENCES work_orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_work_order_parts_part
        FOREIGN KEY (part_id)
        REFERENCES parts(id),

    CONSTRAINT chk_work_order_part_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_work_order_part_unit_price
        CHECK (unit_price >= 0),

    CONSTRAINT chk_work_order_part_total_price
        CHECK (total_price >= 0),

    CONSTRAINT uq_work_order_part
        UNIQUE (work_order_id, part_id)
);


-- ============================================================
-- 13. ESTIMATES
-- ============================================================

CREATE TABLE estimates (
    id BIGSERIAL PRIMARY KEY,
    work_order_id BIGINT NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    estimated_duration_minutes INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    expires_at TIMESTAMP,

    CONSTRAINT fk_estimates_work_order
        FOREIGN KEY (work_order_id)
        REFERENCES work_orders(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_estimate_subtotal
        CHECK (subtotal >= 0),

    CONSTRAINT chk_estimate_tax
        CHECK (tax_amount >= 0),

    CONSTRAINT chk_estimate_discount
        CHECK (discount_amount >= 0),

    CONSTRAINT chk_estimate_total
        CHECK (total_amount >= 0),

    CONSTRAINT chk_estimate_duration
        CHECK (estimated_duration_minutes >= 0),

    CONSTRAINT chk_estimate_status
        CHECK (
            status IN (
                'DRAFT',
                'SENT',
                'APPROVED',
                'REJECTED',
                'EXPIRED'
            )
        )
);


-- ============================================================
-- 14. ESTIMATE ITEMS
-- ============================================================

CREATE TABLE estimate_items (
    id BIGSERIAL PRIMARY KEY,
    estimate_id BIGINT NOT NULL,
    item_type VARCHAR(20) NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL,
    estimated_minutes INTEGER NOT NULL DEFAULT 0,
    total_price NUMERIC(12, 2) NOT NULL,

    CONSTRAINT fk_estimate_items_estimate
        FOREIGN KEY (estimate_id)
        REFERENCES estimates(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_estimate_item_type
        CHECK (
            item_type IN (
                'PART',
                'LABOR',
                'SERVICE'
            )
        ),

    CONSTRAINT chk_estimate_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_estimate_item_price
        CHECK (unit_price >= 0),

    CONSTRAINT chk_estimate_item_duration
        CHECK (estimated_minutes >= 0),

    CONSTRAINT chk_estimate_item_total
        CHECK (total_price >= 0)
);


-- ============================================================
-- 15. APPROVALS
-- ============================================================

CREATE TABLE approvals (
    id BIGSERIAL PRIMARY KEY,
    estimate_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    decision VARCHAR(20) NOT NULL,
    comments TEXT,
    decided_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_approvals_estimate
        FOREIGN KEY (estimate_id)
        REFERENCES estimates(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_approvals_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT chk_approval_decision
        CHECK (
            decision IN (
                'APPROVED',
                'REJECTED'
            )
        )
);


-- ============================================================
-- 16. INVOICES
-- ============================================================

CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    work_order_id BIGINT NOT NULL UNIQUE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_at TIMESTAMP,

    CONSTRAINT fk_invoices_work_order
        FOREIGN KEY (work_order_id)
        REFERENCES work_orders(id),

    CONSTRAINT chk_invoice_subtotal
        CHECK (subtotal >= 0),

    CONSTRAINT chk_invoice_tax
        CHECK (tax_amount >= 0),

    CONSTRAINT chk_invoice_discount
        CHECK (discount_amount >= 0),

    CONSTRAINT chk_invoice_total
        CHECK (total_amount >= 0),

    CONSTRAINT chk_invoice_status
        CHECK (
            status IN (
                'UNPAID',
                'PARTIALLY_PAID',
                'PAID'
            )
        )
);


-- ============================================================
-- 17. INVOICE ITEMS
-- ============================================================

CREATE TABLE invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,

    CONSTRAINT fk_invoice_items_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES invoices(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_invoice_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_invoice_item_unit_price
        CHECK (unit_price >= 0),

    CONSTRAINT chk_invoice_item_total
        CHECK (total_price >= 0)
);


-- ============================================================
-- 18. PAYMENTS
-- ============================================================

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    transaction_reference VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES invoices(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_payment_amount
        CHECK (amount > 0),

    CONSTRAINT chk_payment_method
        CHECK (
            payment_method IN (
                'CASH',
                'CARD',
                'UPI',
                'ONLINE'
            )
        ),

    CONSTRAINT chk_payment_status
        CHECK (
            status IN (
                'PENDING',
                'SUCCESS',
                'FAILED'
            )
        )
);


-- ============================================================
-- 19. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 20. INDEXES
-- ============================================================

CREATE INDEX idx_users_role_id
    ON users(role_id);

CREATE INDEX idx_customers_user_id
    ON customers(user_id);

CREATE INDEX idx_vehicles_customer_id
    ON vehicles(customer_id);

CREATE INDEX idx_vehicles_vehicle_type_id
    ON vehicles(vehicle_type_id);

CREATE INDEX idx_bookings_customer_id
    ON bookings(customer_id);

CREATE INDEX idx_bookings_vehicle_id
    ON bookings(vehicle_id);

CREATE INDEX idx_bookings_service_id
    ON bookings(service_id);

CREATE INDEX idx_bookings_date_status
    ON bookings(booking_date, status);

CREATE INDEX idx_work_orders_vehicle_id
    ON work_orders(vehicle_id);

CREATE INDEX idx_work_orders_mechanic_id
    ON work_orders(assigned_mechanic_id);

CREATE INDEX idx_work_orders_status
    ON work_orders(status);

CREATE INDEX idx_inspections_mechanic_id
    ON inspections(mechanic_id);

CREATE INDEX idx_inspection_items_inspection_id
    ON inspection_items(inspection_id);

CREATE INDEX idx_work_order_parts_work_order_id
    ON work_order_parts(work_order_id);

CREATE INDEX idx_work_order_parts_part_id
    ON work_order_parts(part_id);

CREATE INDEX idx_estimates_work_order_id
    ON estimates(work_order_id);

CREATE INDEX idx_estimates_status
    ON estimates(status);

CREATE INDEX idx_estimate_items_estimate_id
    ON estimate_items(estimate_id);

CREATE INDEX idx_approvals_estimate_id
    ON approvals(estimate_id);

CREATE INDEX idx_approvals_customer_id
    ON approvals(customer_id);

CREATE INDEX idx_invoices_work_order_id
    ON invoices(work_order_id);

CREATE INDEX idx_invoice_items_invoice_id
    ON invoice_items(invoice_id);

CREATE INDEX idx_payments_invoice_id
    ON payments(invoice_id);

CREATE INDEX idx_notifications_user_id
    ON notifications(user_id);

CREATE INDEX idx_notifications_unread
    ON notifications(user_id, is_read);


-- ============================================================
-- 21. SEED DATA — ROLES
-- ============================================================

INSERT INTO roles (name, description)
VALUES
    ('ADMIN', 'System administrator'),
    ('SERVICE_ADVISOR', 'Workshop service advisor'),
    ('MECHANIC', 'Workshop mechanic'),
    ('CUSTOMER', 'Vehicle owner');


-- ============================================================
-- 22. SEED DATA — VEHICLE TYPES
-- ============================================================

INSERT INTO vehicle_types (name, description)
VALUES
    ('HATCHBACK', 'Small passenger vehicle'),
    ('SEDAN', 'Four-door passenger vehicle'),
    ('SUV', 'Sports utility vehicle'),
    ('MUV', 'Multi utility vehicle'),
    ('PICKUP', 'Pickup truck');


-- ============================================================
-- 23. SEED DATA — SERVICES
-- ============================================================

INSERT INTO services (
    name,
    description,
    base_price,
    estimated_duration_minutes
)
VALUES
    (
        'General Service',
        'Basic vehicle inspection and service',
        2500.00,
        120
    ),
    (
        'Oil Change',
        'Engine oil replacement',
        1200.00,
        30
    ),
    (
        'Brake Service',
        'Brake inspection and service',
        1500.00,
        60
    ),
    (
        'AC Service',
        'Air conditioning inspection and service',
        2000.00,
        90
    );


-- ============================================================
-- 24. SEED DATA — PARTS
-- ============================================================

INSERT INTO parts (
    part_number,
    name,
    description,
    unit_price,
    stock_quantity
)
VALUES
    (
        'BP001',
        'Front Brake Pad',
        'Front brake pad replacement part',
        3000.00,
        20
    ),
    (
        'AF001',
        'Air Filter',
        'Engine air filter',
        800.00,
        30
    ),
    (
        'EO001',
        'Engine Oil',
        '5W-30 engine oil',
        1200.00,
        50
    ),
    (
        'SP001',
        'Spark Plug',
        'Standard spark plug',
        600.00,
        40
    );

-- ============================================================
-- 25. CUSTOMER SERVICE HISTORY VIEW
-- ============================================================

CREATE VIEW customer_service_history AS
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