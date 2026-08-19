-- ============================================================
-- SEED: SERVICE ADVISOR AND MECHANIC USERS
-- Password for all users: password123
-- ============================================================

-- SERVICE ADVISOR
INSERT INTO users (
    role_id,
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    is_active
)
VALUES (
    (SELECT id FROM roles WHERE name = 'SERVICE_ADVISOR'),
    'advisor@workshop.com',
    '$2b$12$hwxCkyDNG.xvqQLHK8rrreIY.uK9aGoQRQVBJeV0p1R3lpM/qgj2S',
    'Ravi',
    'Sharma',
    '9876543211',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- MECHANIC
INSERT INTO users (
    role_id,
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    is_active
)
VALUES (
    (SELECT id FROM roles WHERE name = 'MECHANIC'),
    'mechanic@workshop.com',
    '$2b$12$hwxCkyDNG.xvqQLHK8rrreIY.uK9aGoQRQVBJeV0p1R3lpM/qgj2S',
    'Raj',
    'Kumar',
    '9876501234',
    TRUE
)
ON CONFLICT (email) DO NOTHING;
