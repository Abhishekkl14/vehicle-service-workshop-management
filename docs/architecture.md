1. Overall Architecture

Our application will follow a 3-tier architecture with a separate data-access layer.

┌─────────────────────────────────────────────┐
│              PRESENTATION LAYER             │
│                                             │
│           React + TypeScript                │
│                                             │
│  Customer UI │ Workshop UI │ Admin UI       │
└──────────────────────┬──────────────────────┘
                       │
                    HTTPS
                       │
                       ▼
┌─────────────────────────────────────────────┐
│             APPLICATION LAYER               │
│                                             │
│                  FastAPI                    │
│                                             │
│  Routers │ Schemas │ Authentication │ RBAC │
│                    │                        │
│                    ▼                        │
│             Business Services               │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              DATA ACCESS LAYER              │
│                                             │
│             Repository Layer               │
│                                             │
│        SQLAlchemy │ MongoDB Driver          │
└──────────────────────┬──────────────────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
       ┌─────────────┐   ┌─────────────┐
       │ PostgreSQL  │   │   MongoDB   │
       │             │   │             │
       │ Transaction │   │ Logs        │
       │ Data        │   │ Notifications│
       │             │   │ AI Data     │
       └─────────────┘   └─────────────┘

2. Why We Are Using This Architecture

We don't want to put everything inside main.py.

Instead:

Router
  ↓
Service
  ↓
Repository
  ↓
Database

For example, when a customer books a service:

POST /api/bookings
       ↓
Booking Router
       ↓
Booking Service
       ↓
Booking Repository
       ↓
PostgreSQL

Router
Handles:

HTTP request
Authentication
Request validation
HTTP response

Service
Handles:

Business rules
Booking availability
Status transitions
Estimate calculation
Customer approval logic

Repository
Handles:

Database queries
Insert
Update
Delete
Select

This separation will directly demonstrate the 3-tier architecture + dependency injection + OOP topics from your training.

3. Customer Booking Flow

Customer
   │
   ▼
React Booking Page
   │
   │ POST /api/bookings
   ▼
FastAPI Router
   │
   ▼
Authentication
   │
   ▼
Booking Service
   │
   ├── Validate customer
   ├── Validate vehicle
   ├── Check service
   ├── Check date/time
   └── Create booking
   │
   ▼
Booking Repository
   │
   ▼
PostgreSQL
   │
   ▼
Booking Created
   │
   ▼
Notification
   │
   ▼
Customer

4. Authentication Architecture

We'll use JWT authentication.

             LOGIN
               │
               ▼
        FastAPI Auth API
               │
               ▼
        Verify Password
               │
               ▼
          Generate JWT
               │
               ▼
            Client
               │
               │ Authorization: Bearer <token>
               ▼
          Protected API
               │
               ▼
        JWT Verification
               │
               ▼
        Current User
               │
               ▼
          RBAC Check
               │
               ▼
          API Endpoint

Example:

Authorization: Bearer eyJhbGciOi...
customer@example.com
        │
        │ password
        ▼
POST /api/v1/auth/login
        │
        ▼
   Verify bcrypt
        │
        ▼
      JWT
        │
        ▼
 Swagger Authorize 🔒
        │
        ▼
 Authorization: Bearer JWT
        │
        ▼
GET /api/v1/auth/me
        │
        ▼
   Current User
        │
        ▼
     CUSTOMER

5. RBAC Architecture

We'll enforce authorization at the backend.

                    User
                     │
                     ▼
                  JWT
                     │
                     ▼
              Current User
                     │
                     ▼
                  Role
            ┌────────┼────────┐
            ▼        ▼        ▼
        Customer  Mechanic  Admin
            │        │        │
            ▼        ▼        ▼
        Customer   Work     Everything
         APIs      APIs       allowed

For example:

POST /api/estimates/{id}/approve

requires:

CUSTOMER

while:

POST /api/work-orders/{id}/inspection

requires:

MECHANIC

6. Main Business Workflow Architecture

This is the workflow we will actually implement.

┌──────────────┐
│   Customer   │
└──────┬───────┘
       │
       │ Book Service
       ▼
┌──────────────┐
│   Booking    │
└──────┬───────┘
       │
       │ Vehicle Drop-off
       ▼
┌──────────────┐
│Vehicle        │
│Received       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Work Order   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Inspection  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Issues Found │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Estimate   │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ Customer Approval   │
└─────────┬───────────┘
          │
     ┌────┴────┐
     │         │
  APPROVE    REJECT
     │         │
     ▼         ▼
  Repair    Skip Extra
     │        Work
     ▼
Quality Check
     │
     ▼
Completed
     │
     ▼
Invoice
     │
     ▼
Payment
     │
     ▼
Ready for Pickup


7. Status Management

We'll treat status changes as controlled business operations.

Booking

PENDING
   ↓
CONFIRMED
   ↓
VEHICLE_RECEIVED

or:

PENDING → CANCELLED

Work Order

CREATED
   ↓
ASSIGNED
   ↓
INSPECTION
   ↓
WAITING_FOR_APPROVAL
   ↓
IN_PROGRESS
   ↓
QUALITY_CHECK
   ↓
COMPLETED

Estimate

DRAFT
 ↓
SENT
 ↓
APPROVED

or:

SENT
 ↓
REJECTED

We'll implement these transitions in the service layer, not directly in the database/API route.

8. PostgreSQL vs MongoDB

We'll intentionally use both databases for different purposes.

* PostgreSQL

Use PostgreSQL for structured transactional data:

Users
Customers
Vehicles
Bookings
Work Orders
Inspections
Parts
Estimates
Invoices
Payments

These require:

Foreign keys
Transactions
Relationships
Constraints
Joins

* MongoDB

Use MongoDB for flexible/unstructured information:

Activity Logs
Notification Logs
AI Recommendation Logs
Inspection Notes

This gives us a meaningful reason to demonstrate SQL + NoSQL.

9. Backend Folder Architecture

Our backend will eventually look like:

backend/
│
├── app/
│   │
│   ├── main.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   │
│   ├── database/
│   │   ├── postgres.py
│   │   └── mongodb.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── vehicle.py
│   │   ├── booking.py
│   │   ├── work_order.py
│   │   ├── estimate.py
│   │   └── invoice.py
│   │
│   ├── schemas/
│   │
│   ├── repositories/
│   │
│   ├── services/
│   │
│   ├── routers/
│   │
│   └── dependencies/
│
├── tests/
│
├── requirements.txt
└── .env

We don't need to create all these files now. We'll create them when implementing each module.

10. Frontend Architecture

React will follow a component-based structure:

frontend/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   ├── types/
│   ├── utils/
│   └── App.tsx
│
├── package.json
└── tsconfig.json

Example:

Customer Dashboard
      │
      ├── VehicleCard
      ├── BookingCard
      ├── ServiceStatus
      ├── EstimateCard
      └── NotificationPanel