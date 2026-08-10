# Vehicle Service & Workshop Management System

## 1. Project Overview

The Vehicle Service & Workshop Management System is a web-based application
designed to manage vehicle servicing operations between customers and
automobile workshops.

The system allows customers to book vehicle services remotely, drop their
vehicles at the workshop, receive inspection results, review estimated
repair costs and duration, approve or reject additional work, track service
progress, receive notifications, and view invoices.

Workshop staff can manage bookings, receive vehicles, create work orders,
assign mechanics, perform inspections, recommend parts and services, create
estimates, track repair progress, and manage billing.

---

## 2. Problem Statement

Traditional vehicle workshops often depend on phone calls, paper records,
spreadsheets, and manual communication for service bookings, vehicle
inspection, repair estimates, customer approvals, and billing.

This can result in:

- Delayed communication
- Poor visibility into service progress
- Manual estimation
- Miscommunication about additional repairs
- Difficulty tracking service history
- Inefficient workshop operations
- Delayed customer approvals

The proposed system provides a centralized platform for managing the complete
vehicle service lifecycle.

---

## 3. Project Objectives

The main objectives are:

1. Allow customers to book vehicle services online.
2. Allow customers to manage their vehicles.
3. Allow workshop staff to manage service bookings.
4. Track vehicle reception and service status.
5. Allow mechanics to perform vehicle inspections.
6. Allow mechanics to recommend required parts and services.
7. Automatically calculate estimated cost and service duration.
8. Allow customers to approve or reject additional work.
9. Track work order progress.
10. Notify customers about important service events.
11. Generate final invoices.
12. Maintain complete vehicle service history.
13. Provide workshop reports and dashboards.
14. Implement secure authentication and role-based access.
15. Demonstrate SQL, NoSQL, REST APIs, testing, Git, deployment, and AI.

---

# 4. User Roles

## 4.1 Customer

The customer can:

- Register and log in.
- Manage their profile.
- Add and manage vehicles.
- View available services.
- Book a service.
- Select preferred date and time.
- View booking status.
- View vehicle service status.
- View inspection results.
- View repair estimates.
- Approve or reject additional work.
- View notifications.
- View invoices.
- View service history.

---

## 4.2 Service Advisor

The service advisor manages customer-facing workshop operations.

The service advisor can:

- View customers.
- Manage customer vehicles.
- View service bookings.
- Confirm bookings.
- Receive vehicles.
- Create work orders.
- Assign mechanics.
- Review inspection results.
- Create/review estimates.
- Track work orders.
- Generate invoices.

---

## 4.3 Mechanic

The mechanic manages vehicle inspection and repair activities.

The mechanic can:

- View assigned work orders.
- Start assigned work.
- Perform vehicle inspection.
- Record diagnosis.
- Add service tasks.
- Recommend parts.
- Record labor.
- Add work notes.
- Update task status.
- Mark assigned work as completed.

---

## 4.4 Administrator

The administrator manages the overall system.

The administrator can:

- Manage users.
- Manage roles.
- Manage services.
- Manage parts.
- Manage mechanics.
- View all bookings.
- View all work orders.
- Manage workshop configuration.
- View reports.
- Manage invoices.
- Monitor system activity.

---

# 5. Core Business Workflow

The main business workflow is:

Customer
    |
    v
Select Vehicle
    |
    v
Select Service
    |
    v
Select Date and Time
    |
    v
Create Booking
    |
    v
Booking Confirmation
    |
    v
Customer Drops Vehicle
    |
    v
Vehicle Received
    |
    v
Work Order Created
    |
    v
Mechanic Assigned
    |
    v
Vehicle Inspection
    |
    v
Issues Identified
    |
    v
Estimate Created
    |
    v
Customer Notified
    |
    +-------------------+
    |                   |
    v                   v
  APPROVE             REJECT
    |                   |
    v                   v
Repair Begins      Additional Work
    |               Not Performed
    v
Quality Check
    |
    v
Service Completed
    |
    v
Invoice Generated
    |
    v
Payment
    |
    v
Ready for Pickup
    |
    v
Customer Picks Up Vehicle

---

# 6. Functional Requirements

## FR-01 User Registration

The system shall allow customers and authorized staff to create accounts.

## FR-02 Authentication

The system shall authenticate users using email and password.

JWT-based authentication shall be used for protected APIs.

## FR-03 Role-Based Access Control

The system shall restrict system functionality based on user role.

## FR-04 Vehicle Management

Customers shall be able to add, update and view their vehicles.

## FR-05 Service Booking

Customers shall be able to select a vehicle, service, date and time and
create a service booking.

## FR-06 Booking Management

Service advisors shall be able to view, confirm and manage bookings.

## FR-07 Vehicle Reception

Workshop staff shall be able to mark a vehicle as received.

## FR-08 Work Order Management

The system shall create a work order for a received vehicle.

## FR-09 Mechanic Assignment

Authorized workshop staff shall be able to assign mechanics to work orders.

## FR-10 Vehicle Inspection

Mechanics shall be able to record vehicle inspection results.

## FR-11 Diagnosis

Mechanics shall be able to record problems identified during inspection.

## FR-12 Service Recommendation

Mechanics shall be able to recommend additional services and parts.

## FR-13 Estimate Generation

The system shall calculate estimated cost and duration.

## FR-14 Customer Approval

Customers shall be able to approve or reject recommended additional work.

## FR-15 Work Progress

Mechanics shall be able to update the progress of assigned work.

## FR-16 Notifications

The system shall notify customers about important service events.

## FR-17 Invoice

The system shall generate an invoice after service completion.

## FR-18 Payment

The system shall record payment information and payment status.

## FR-19 Service History

The system shall maintain service history for each vehicle.

## FR-20 Reports

Authorized staff shall be able to view workshop reports.

---

# 7. Non-Functional Requirements

## Security

- Passwords must never be stored as plain text.
- JWT authentication shall protect secured APIs.
- RBAC shall restrict access to resources.
- Secrets shall be stored using environment variables.
- Customers shall only access their own vehicles and service records.

## Performance

- APIs should respond efficiently under normal workshop load.
- Database indexes shall be used for frequently searched fields.
- Large result sets shall support pagination.

## Reliability

- Invalid requests shall return appropriate HTTP status codes.
- Database transactions shall maintain data consistency.
- Important status changes shall be logged.

## Maintainability

The backend shall follow a layered architecture:

Router
    |
Service
    |
Repository
    |
Database

Business logic shall not be placed directly inside API route handlers.

## Scalability

The system should be designed so additional workshop branches, users,
vehicles and service records can be added without major architectural changes.

---

# 8. Main Service Statuses

The vehicle service lifecycle shall use the following statuses:

BOOKED
    |
CONFIRMED
    |
VEHICLE_RECEIVED
    |
INSPECTION
    |
WAITING_FOR_APPROVAL
    |
APPROVED
    |
IN_PROGRESS
    |
QUALITY_CHECK
    |
COMPLETED
    |
READY_FOR_PICKUP
    |
DELIVERED

Possible alternative paths:

WAITING_FOR_APPROVAL
    |
    +--> APPROVED
    |
    +--> REJECTED

---

# 9. Core Business Rules

1. A customer can only book a vehicle owned by that customer.

2. A customer cannot access another customer's vehicle or service records.

3. A mechanic can only modify work orders assigned to that mechanic.

4. Additional repair work must not begin before customer approval.

5. A rejected recommendation must not be included as completed additional work.

6. A cancelled booking cannot be converted into a work order.

7. A vehicle cannot have multiple active work orders at the same time.

8. Only authorized staff can modify service and part pricing.

9. An invoice can only be finalized after required work is completed.

10. Important status changes shall generate activity/notification records.

11. Every work order must belong to a vehicle.

12. Every vehicle must belong to a customer.

13. Every estimate must belong to a work order.

14. Every invoice must belong to a completed work order.

---

# 10. Estimate Calculation

The estimated amount will be based on:

Parts Cost
+ Labor Cost
+ Service Charges
- Discount
+ Tax
= Estimated Total

Estimated duration will be calculated from the estimated duration of
individual service tasks.

Example:

Brake Pad Replacement     2 hours
Air Filter Replacement    30 minutes
Engine Oil Change         30 minutes
-----------------------------------
Estimated Duration        3 hours

---

# 11. Notifications

The system should generate notifications for:

- Booking confirmation
- Booking confirmation/update
- Vehicle received
- Inspection completed
- Estimate generated
- Estimate approved
- Estimate rejected
- Work started
- Work completed
- Invoice generated
- Vehicle ready for pickup

---

# 12. Technology Stack

## Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic

## Relational Database

- PostgreSQL

## NoSQL Database

- MongoDB

## Frontend

- React
- TypeScript

## Authentication

- JWT
- Password hashing

## Testing

- Pytest
- FastAPI TestClient

## Version Control

- Git
- GitHub

## Containerization

- Docker

## Deployment

- Cloud platform

## AI

- LLM-based service recommendation

---

# 13. Architecture

The system will follow a layered three-tier architecture.

Presentation Layer
    |
    v
Application/API Layer
    |
    v
Business/Service Layer
    |
    v
Data Access Layer
    |
    +----------------+
    |                |
    v                v
PostgreSQL        MongoDB

Frontend:
React + TypeScript

Backend:
FastAPI

---

# 14. Project Scope

## Included

- Customer management
- Vehicle management
- Service booking
- Work orders
- Mechanic assignment
- Vehicle inspection
- Service recommendations
- Parts management
- Estimate calculation
- Customer approval
- Service tracking
- Notifications
- Invoice
- Payment records
- Service history
- Reports
- Authentication
- RBAC
- SQL
- NoSQL
- Testing
- Git/GitHub
- Docker
- Deployment
- AI recommendation

## Optional / Future Enhancements

- Online payment gateway
- WhatsApp integration
- SMS gateway
- Multiple workshop branches
- Live vehicle location tracking
- Advanced analytics
- Mobile application
- Inventory purchase management