# Database Design

## Database Strategy

PostgreSQL will be used as the primary relational database for transactional
workshop data.

MongoDB will be used for flexible data such as activity logs, notification
logs and AI recommendation logs.

## Core Entities

- roles
- users
- customers
- vehicle_types
- vehicles
- services
- bookings
- work_orders
- work_tasks
- inspections
- inspection_items
- parts
- work_order_parts
- estimates
- estimate_items
- approvals
- invoices
- invoice_items
- payments
- notifications

Booking → Work Order = 1 : 0..1

Work Order → Estimate = 1 : N

Work Order → Invoice = 1 : 0..1

Work Order ↔ Parts = N : N

Invoice → Payments = 1 : N

1. Core Entities
Based on our workflow, we'll use these main entities:

users
roles

customers
vehicles
vehicle_types

services
bookings

work_orders
work_tasks
inspections
inspection_items

parts
work_order_parts

estimates
estimate_items
approvals

invoices
invoice_items
payments

notifications
2. Relationship Design

The most important relationships are:

Role
 │
 └──────< User
             │
             └──── Customer
                    │
                    └────< Vehicle
                              │
                              └────< Booking
                                         │
                                         └──── Work Order
                                                   │
                         ┌─────────────────────────┼────────────────────┐
                         │                         │                    │
                         ▼                         ▼                    ▼
                    Inspection                Work Tasks             Estimate
                         │                         │                    │
                         ▼                         │                    ▼
                 Inspection Items                │                 Estimate Items
                                                   │                    │
                                                   ▼                    ▼
                                               Mechanic             Approval
                                                   │
                                                   ▼
                                                Parts
                                                   │
                                                   ▼
                                           Work Order Parts



Work Order
    │
    ▼
Invoice
    │
    ├── Invoice Items
    │
    └── Payment


3. roles

Stores application roles.

| Column      | Type    | Description      |
| ----------- | ------- | ---------------- |
| id          | BIGINT  | Primary key      |
| name        | VARCHAR | Role name        |
| description | TEXT    | Role description |


Example:

1 | ADMIN
2 | SERVICE_ADVISOR
3 | MECHANIC
4 | CUSTOMER
4. users

Stores authentication information.

| Column        | Type      |
| ------------- | --------- |
| id            | BIGINT    |
| role_id       | FK        |
| email         | VARCHAR   |
| password_hash | VARCHAR   |
| first_name    | VARCHAR   |
| last_name     | VARCHAR   |
| phone         | VARCHAR   |
| is_active     | BOOLEAN   |
| created_at    | TIMESTAMP |
| updated_at    | TIMESTAMP |


Relationship:

roles 1 ────────< users

One role can belong to many users.

5. customers

We'll keep customer-specific information separate from authentication.

| Column     | Type      |
| ---------- | --------- |
| id         | BIGINT    |
| user_id    | FK        |
| address    | TEXT      |
| city       | VARCHAR   |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |


Relationship:

users 1 ──────── 1 customers

A customer account corresponds to one customer profile.

6. vehicle_types

This avoids repeatedly storing vehicle category information.
| Column      | Type    |
| ----------- | ------- |
| id          | BIGINT  |
| name        | VARCHAR |
| description | TEXT    |


Example:

1 | Sedan
2 | SUV
3 | Hatchback
4 | MUV
5 | Pickup

7. vehicles

This is one of our most important tables.

| Column              | Type      |
| ------------------- | --------- |
| id                  | BIGINT    |
| customer_id         | FK        |
| vehicle_type_id     | FK        |
| registration_number | VARCHAR   |
| VIN                 | VARCHAR   |
| make                | VARCHAR   |
| model               | VARCHAR   |
| manufacturing_year  | INTEGER   |
| color               | VARCHAR   |
| mileage             | INTEGER   |
| created_at          | TIMESTAMP |
| updated_at          | TIMESTAMP |


Relationship:

customer 1 ────────< vehicles

Example:

Customer: Abhishek
     │
     ├── Honda City
     └── Hyundai Creta

8. services

Stores services offered by the workshop.

| Column                     | Type      |
| -------------------------- | --------- |
| id                         | BIGINT    |
| name                       | VARCHAR   |
| description                | TEXT      |
| base_price                 | DECIMAL   |
| estimated_duration_minutes | INTEGER   |
| is_active                  | BOOLEAN   |
| created_at                 | TIMESTAMP |


Example:

General Service       ₹2500    120 min
Oil Change             ₹1200     30 min
Brake Service          ₹1500     60 min
AC Service             ₹2000     90 min
9. bookings

This represents the customer's initial service booking.

| Column         | Type      |
| -------------- | --------- |
| id             | BIGINT    |
| customer_id    | FK        |
| vehicle_id     | FK        |
| service_id     | FK        |
| booking_date   | DATE      |
| booking_time   | TIME      |
| status         | VARCHAR   |
| customer_notes | TEXT      |
| created_at     | TIMESTAMP |
| updated_at     | TIMESTAMP |


Example:

Booking #1001

Customer: Abhishek
Vehicle: Honda City
Service: General Service
Date: 15-Aug-2026
Time: 10:00 AM
Status: CONFIRMED

10. work_orders

This is the central workshop entity.

When the customer drops the vehicle, the booking becomes a work order.

| Column               | Type      |
| -------------------- | --------- |
| id                   | BIGINT    |
| booking_id           | FK        |
| vehicle_id           | FK        |
| assigned_mechanic_id | FK        |
| status               | VARCHAR   |
| complaint            | TEXT      |
| received_at          | TIMESTAMP |
| started_at           | TIMESTAMP |
| completed_at         | TIMESTAMP |
| created_at           | TIMESTAMP |
| updated_at           | TIMESTAMP |


Example:

Booking #1001
      ↓
Work Order #5001
      ↓
Honda City
      ↓
Mechanic: Ravi

11. work_tasks

Breaks a work order into individual jobs.

| Column            | Type      |
| ----------------- | --------- |
| id                | BIGINT    |
| work_order_id     | FK        |
| service_id        | FK        |
| task_name         | VARCHAR   |
| description       | TEXT      |
| estimated_minutes | INTEGER   |
| actual_minutes    | INTEGER   |
| status            | VARCHAR   |
| created_at        | TIMESTAMP |
| completed_at      | TIMESTAMP |


Example:

    Work Order #5001

    1. Engine inspection
    2. Brake inspection
    3. Oil replacement
    4. Road test

12. inspections

Represents the vehicle inspection performed by the mechanic.

| Column        | Type      |
| ------------- | --------- |
| id            | BIGINT    |
| work_order_id | FK        |
| mechanic_id   | FK        |
| overall_notes | TEXT      |
| created_at    | TIMESTAMP |
| completed_at  | TIMESTAMP |


13. inspection_items

Stores individual inspection results.

| Column             | Type    |
| ------------------ | ------- |
| id                 | BIGINT  |
| inspection_id      | FK      |
| component          | VARCHAR |
| condition          | VARCHAR |
| severity           | VARCHAR |
| notes              | TEXT    |
| recommended_action | TEXT    |


Example:

Component       Condition      Severity
-----------------------------------------
Brake Pads      Worn           HIGH
Air Filter      Dirty          MEDIUM
Battery         Good           LOW
Engine Oil      Low            MEDIUM

This structure gives us flexibility to inspect multiple vehicle components.

14. parts

Workshop inventory.

| Column         | Type    |
| -------------- | ------- |
| id             | BIGINT  |
| part_number    | VARCHAR |
| name           | VARCHAR |
| description    | TEXT    |
| unit_price     | DECIMAL |
| stock_quantity | INTEGER |
| reorder_level  | INTEGER |
| is_active      | BOOLEAN |

Example:

BP001 | Front Brake Pad | ₹3000 | 15
AF001 | Air Filter     | ₹800  | 25
EO001 | Engine Oil     | ₹1200 | 50

15. work_order_parts

Many-to-many relationship between work orders and parts.

Work Order
    │
    └──< work_order_parts >── Part

| Column        | Type    |
| ------------- | ------- |
| id            | BIGINT  |
| work_order_id | FK      |
| part_id       | FK      |
| quantity      | INTEGER |
| unit_price    | DECIMAL |
| total_price   | DECIMAL |

Why store unit_price here?

Because the current inventory price could change later.

Example:

Part current price: ₹3200

But when work was approved:
unit_price = ₹3000

The historical transaction should remain ₹3000.

That's an important real-world database design principle.

16. estimates

Represents the complete estimate sent to the customer.

| Column                     | Type      |
| -------------------------- | --------- |
| id                         | BIGINT    |
| work_order_id              | FK        |
| subtotal                   | DECIMAL   |
| tax_amount                 | DECIMAL   |
| discount_amount            | DECIMAL   |
| total_amount               | DECIMAL   |
| estimated_duration_minutes | INTEGER   |
| status                     | VARCHAR   |
| created_at                 | TIMESTAMP |
| sent_at                    | TIMESTAMP |
| expires_at                 | TIMESTAMP |


Statuses:

DRAFT
SENT
APPROVED
REJECTED
EXPIRED

17. estimate_items

Individual items inside an estimate.

| Column            | Type    |
| ----------------- | ------- |
| id                | BIGINT  |
| estimate_id       | FK      |
| item_type         | VARCHAR |
| description       | VARCHAR |
| quantity          | DECIMAL |
| unit_price        | DECIMAL |
| estimated_minutes | INTEGER |
| total_price       | DECIMAL |


item_type could be:

PART
LABOR
SERVICE

Example:

PART    | Brake Pad Replacement | 1 | ₹3000
LABOR   | Brake Pad Labor       | 1 | ₹1000
SERVICE | Oil Change            | 1 | ₹1200

18. approvals

Records the customer's decision.

| Column      | Type      |
| ----------- | --------- |
| id          | BIGINT    |
| estimate_id | FK        |
| customer_id | FK        |
| decision    | VARCHAR   |
| comments    | TEXT      |
| decided_at  | TIMESTAMP |


Decision:

APPROVED
REJECTED

This is important because we should not simply change the estimate status and lose the approval history.

19. invoices

Final billing document.

| Column          | Type      |
| --------------- | --------- |
| id              | BIGINT    |
| work_order_id   | FK        |
| invoice_number  | VARCHAR   |
| subtotal        | DECIMAL   |
| tax_amount      | DECIMAL   |
| discount_amount | DECIMAL   |
| total_amount    | DECIMAL   |
| status          | VARCHAR   |
| issued_at       | TIMESTAMP |
| due_at          | TIMESTAMP |

20. invoice_items
| Column      | Type    |
| ----------- | ------- |
| id          | BIGINT  |
| invoice_id  | FK      |
| description | VARCHAR |
| quantity    | DECIMAL |
| unit_price  | DECIMAL |
| total_price | DECIMAL |


21. payments
| Column                | Type      |
| --------------------- | --------- |
| id                    | BIGINT    |
| invoice_id            | FK        |
| amount                | DECIMAL   |
| payment_method        | VARCHAR   |
| transaction_reference | VARCHAR   |
| status                | VARCHAR   |
| paid_at               | TIMESTAMP |


For our initial implementation:

CASH
CARD
UPI
ONLINE

22. notifications

Stores customer-facing notifications.

| Column            | Type      |
| ----------------- | --------- |
| id                | BIGINT    |
| user_id           | FK        |
| title             | VARCHAR   |
| message           | TEXT      |
| notification_type | VARCHAR   |
| is_read           | BOOLEAN   |
| created_at        | TIMESTAMP |


Example:

Title:
Service Estimate Ready

Message:
Additional work has been identified for your vehicle.

Type:
ESTIMATE_READY

23. Final Database Relationship

Our core relational structure is now:

                         ┌─────────┐
                         │  Roles  │
                         └────┬────┘
                              │
                              ▼
                         ┌─────────┐
                         │  Users  │
                         └────┬────┘
                              │
                              ▼
                         ┌──────────┐
                         │Customers │
                         └────┬─────┘
                              │
                              ▼
                         ┌──────────┐
                         │ Vehicles │
                         └────┬─────┘
                              │
                              ▼
                         ┌──────────┐
                         │ Bookings │
                         └────┬─────┘
                              │
                              ▼
                       ┌─────────────┐
                       │ Work Orders │
                       └──────┬──────┘
                              │
              ┌───────────────┼────────────────┐
              │               │                │
              ▼               ▼                ▼
        ┌───────────┐   ┌───────────┐   ┌──────────┐
        │Inspection │   │Work Tasks │   │ Estimate │
        └─────┬─────┘   └───────────┘   └────┬─────┘
              │                               │
              ▼                               ▼
        Inspection Items                Estimate Items
                                              │
                                              ▼
                                          Approval
                                              │
                                              ▼
                                          Invoice
                                              │
                                              ▼
                                           Payment



