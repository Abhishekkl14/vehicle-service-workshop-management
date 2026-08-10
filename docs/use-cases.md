1. Actors

Our system has four primary actors:

Customer
Service Advisor
Mechanic
Admin

2. Customer Use Cases
| ID     | Use Case             | Description                  |
| ------ | -------------------- | ---------------------------- |
| CUS-01 | Register             | Create an account            |
| CUS-02 | Login                | Authenticate into the system |
| CUS-03 | Manage Profile       | Update personal information  |
| CUS-04 | Add Vehicle          | Register a vehicle           |
| CUS-05 | Manage Vehicles      | Update/view vehicle details  |
| CUS-06 | Book Service         | Create a service booking     |
| CUS-07 | View Booking         | Track booking                |
| CUS-08 | Cancel Booking       | Cancel eligible booking      |
| CUS-09 | View Service Status  | Track current service        |
| CUS-10 | View Inspection      | View issues found            |
| CUS-11 | View Estimate        | Review additional work       |
| CUS-12 | Approve Estimate     | Approve recommended work     |
| CUS-13 | Reject Estimate      | Reject recommended work      |
| CUS-14 | View Notifications   | View service notifications   |
| CUS-15 | View Invoice         | View final invoice           |
| CUS-16 | View Service History | View previous services       |


Customer journey
Login
  ↓
My Vehicles
  ↓
Book Service
  ↓
View Booking
  ↓
Drop Vehicle
  ↓
Receive Inspection Notification
  ↓
View Estimate
  ↓
Approve / Reject
  ↓
Track Service
  ↓
Receive Completion Notification
  ↓
View Invoice
  ↓
Pickup Vehicle

3. Service Advisor Use Cases
| ID     | Use Case          | Description               |
| ------ | ----------------- | ------------------------- |
| ADV-01 | Login             | Login as service advisor  |
| ADV-02 | View Customers    | Search/manage customers   |
| ADV-03 | View Vehicles     | View customer vehicles    |
| ADV-04 | Manage Bookings   | Confirm/manage bookings   |
| ADV-05 | Receive Vehicle   | Mark vehicle as received  |
| ADV-06 | Create Work Order | Create service work order |
| ADV-07 | Assign Mechanic   | Assign mechanic           |
| ADV-08 | Review Inspection | Review mechanic findings  |
| ADV-09 | Create Estimate   | Create/review estimate    |
| ADV-10 | Monitor Work      | Track work progress       |
| ADV-11 | Generate Invoice  | Create final invoice      |
| ADV-12 | View Reports      | View workshop statistics  |


4. Mechanic Use Cases
| ID     | Use Case           | Description                 |
| ------ | ------------------ | --------------------------- |
| MEC-01 | Login              | Login as mechanic           |
| MEC-02 | View Assigned Jobs | View assigned work          |
| MEC-03 | Start Work         | Start a work order          |
| MEC-04 | Inspect Vehicle    | Perform inspection          |
| MEC-05 | Add Diagnosis      | Record issues               |
| MEC-06 | Add Work Task      | Add required work           |
| MEC-07 | Recommend Parts    | Recommend replacement parts |
| MEC-08 | Record Labor       | Record labor information    |
| MEC-09 | Add Work Notes     | Add notes                   |
| MEC-10 | Update Task        | Update task status          |
| MEC-11 | Complete Work      | Mark assigned work complete |


5. Admin Use Cases
| ID     | Use Case             | Description                    |
| ------ | -------------------- | ------------------------------ |
| ADM-01 | Login                | Login as administrator         |
| ADM-02 | Manage Users         | Create/update/deactivate users |
| ADM-03 | Manage Roles         | Manage access                  |
| ADM-04 | Manage Services      | Add/update services            |
| ADM-05 | Manage Parts         | Manage parts catalog           |
| ADM-06 | Manage Mechanics     | Manage mechanic accounts       |
| ADM-07 | View All Bookings    | Monitor bookings               |
| ADM-08 | View All Work Orders | Monitor workshop               |
| ADM-09 | View Reports         | View system reports            |
| ADM-10 | Manage Configuration | Manage workshop settings       |


6. Most Important Use Case — Book Service

UC-01: Book Vehicle Service

Actor: Customer

Preconditions
Customer is authenticated.
Customer has at least one vehicle.
Service is available.

    Main Flow
    1. Customer opens Book Service.
    2. Customer selects vehicle.
    3. Customer selects service.
    4. Customer selects preferred date.
    5. Customer selects available time.
    6. System validates booking.
    7. System creates booking.
    8. System sends confirmation notification.
    Alternative Flow

If the selected slot is unavailable:

System
  ↓
Reject selected slot
  ↓
Show available slots
  ↓
Customer selects another slot

7. Important Use Case — Vehicle Inspection
UC-02: Inspect Vehicle

Actor: Mechanic

    Main Flow
    1. Mechanic opens assigned work order.
    2. Mechanic starts inspection.
    3. Mechanic checks vehicle components.
    4. Mechanic records inspection results.
    5. Mechanic records issues.
    6. Mechanic recommends parts/services.
    7. System calculates estimated cost.
    8. System calculates estimated duration.
    9. System creates estimate.
    10. Customer receives notification.


8. Important Use Case — Approve Estimate
UC-03: Approve Additional Work

Actor: Customer

Customer
   ↓
Receives notification
   ↓
Opens Estimate
   ↓
Reviews:
   - Issues
   - Parts
   - Labor
   - Cost
   - Duration
   ↓
Approve
   ↓
System changes status
   ↓
Workshop can start additional work
Rejection
Customer
   ↓
Reject
   ↓
System records rejection
   ↓
Workshop is notified
   ↓
Rejected work is not performed

9. Use Case — Complete Service
UC-04: Complete Vehicle Service

Actor: Mechanic / Service Advisor

Work in Progress
      ↓
All Tasks Completed
      ↓
Quality Check
      ↓
Mark Completed
      ↓
Generate Invoice
      ↓
Notify Customer
      ↓
Ready for Pickup


Core Entities
User
Role
Customer
Vehicle
VehicleType

Service
Booking

WorkOrder
WorkTask
Inspection
InspectionItem

Mechanic
Part
WorkOrderPart

Estimate
EstimateItem
Approval

Invoice
InvoiceItem
Payment

Notification
ActivityLog


Core relationship

User
 │
 ├── Customer
 │      │
 │      └── Vehicle
 │             │
 │             └── Booking
 │                    │
 │                    └── WorkOrder
 │                           │
 │             ┌─────────────┼─────────────┐
 │             │             │             │
 │         Inspection     WorkTasks       Parts
 │             │             │             │
 │             └─────────────┼─────────────┘
 │                           │
 │                        Estimate
 │                           │
 │                       Approval
 │                           │
 │                        Invoice
 │                           │
 │                        Payment

