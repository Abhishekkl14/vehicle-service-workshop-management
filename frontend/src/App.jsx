import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import MyVehicles from "./pages/customer/MyVehicles";
import VehicleDetails from "./pages/customer/VehicleDetails";
import Bookings from "./pages/customer/Bookings";
import CreateBooking from "./pages/customer/CreateBooking";
import BookingDetails from "./pages/customer/BookingDetails";
import ServiceHistory from "./pages/customer/ServiceHistory";
import EstimateDetails from "./pages/customer/EstimateDetails";
import Estimates from "./pages/customer/Estimates";
import WorkOrderDetails from "./pages/customer/WorkOrderDetails";
import InspectionDetails from "./pages/customer/InspectionDetails";
import Invoices from "./pages/customer/Invoices";
import InvoiceDetails from "./pages/customer/InvoiceDetails";
import Notifications from "./pages/customer/Notifications";
import CustomerWorkOrders from "./pages/customer/CustomerWorkOrders";
import CustomerInspections from "./pages/customer/CustomerInspections";

import AdvisorDashboard from "./pages/advisor/AdvisorDashboard";
import AdvisorBookings from "./pages/advisor/AdvisorBookings";
import AdvisorWorkOrders from "./pages/advisor/AdvisorWorkOrders";
import AdvisorApprovals from "./pages/advisor/AdvisorApprovals";
import AdvisorCustomers from "./pages/advisor/AdvisorCustomers";
import AdvisorVehicles from "./pages/advisor/AdvisorVehicles";
import AdvisorInspections from "./pages/advisor/AdvisorInspections";
import AdvisorEstimates from "./pages/advisor/AdvisorEstimates";
import AdvisorInvoices from "./pages/advisor/AdvisorInvoices";
import AdvisorPayments from "./pages/advisor/AdvisorPayments";
import AdvisorNotifications from "./pages/advisor/AdvisorNotifications";

import MechanicDashboard from "./pages/mechanic/MechanicDashboard";
import MechanicWorkOrders from "./pages/mechanic/MechanicWorkOrders";
import MechanicInspections from "./pages/mechanic/MechanicInspections";
import MechanicNotifications from "./pages/mechanic/MechanicNotifications";


function RoleRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        Loading AutoFlow...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  switch (user.role) {
    case "CUSTOMER":
      return (
        <Navigate
          to="/customer/dashboard"
          replace
        />
      );

    case "SERVICE_ADVISOR":
      return (
        <Navigate
          to="/advisor/dashboard"
          replace
        />
      );

    case "MECHANIC":
      return (
        <Navigate
          to="/mechanic/dashboard"
          replace
        />
      );

    default:
      return (
        <Navigate
          to="/login"
          replace
        />
      );
  }
}


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        <Routes>

          {/* =================================================
              LOGIN
          ================================================= */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />


          {/* =================================================
              ROOT / ROLE REDIRECT
          ================================================= */}

          <Route
            path="/"
            element={<RoleRedirect />}
          />


          {/* =================================================
              CUSTOMER
          ================================================= */}

          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={["CUSTOMER"]}
              >
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />


          <Route
            path="/customer/vehicles"
            element={
              <ProtectedRoute
                allowedRoles={["CUSTOMER"]}
              >
                <MyVehicles />
              </ProtectedRoute>
            }
          />


          <Route
            path="/customer/vehicles/:vehicleId"
            element={
              <ProtectedRoute
                allowedRoles={["CUSTOMER"]}
              >
                <VehicleDetails />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              CUSTOMER BOOKINGS
          ================================================= */}

                <Route
          path="/customer/bookings"
          element={
            <ProtectedRoute
              allowedRoles={["CUSTOMER"]}
            >
              <Bookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/bookings/new"
          element={
            <ProtectedRoute
              allowedRoles={["CUSTOMER"]}
            >
              <CreateBooking />
            </ProtectedRoute>
          }
        />

          <Route
            path="/customer/bookings/:bookingId"
            element={
              <ProtectedRoute
                allowedRoles={["CUSTOMER"]}
              >
                <BookingDetails />
              </ProtectedRoute>
            }
          />


          <Route
            path="/customer/service-history"
            element={
              <ProtectedRoute
                allowedRoles={["CUSTOMER"]}
              >
                <ServiceHistory />
              </ProtectedRoute>
            }
          />


          <Route
            path="/customer/estimates"
            element={
              <ProtectedRoute
                allowedRoles={["CUSTOMER"]}
              >
                <Estimates />
              </ProtectedRoute>
            }
          />


          <Route
            path="/customer/estimates/:estimateId"
            element={
              <ProtectedRoute
                allowedRoles={["CUSTOMER"]}
              >
                <EstimateDetails />
              </ProtectedRoute>
            }
          />


          <Route
            path="/customer/work-orders/:workOrderId"
            element={
              <ProtectedRoute
                allowedRoles={["CUSTOMER"]}
              >
                <WorkOrderDetails />
              </ProtectedRoute>
            }
          />


          <Route
            path="/customer/inspections/:inspectionId"
            element={
              <ProtectedRoute
                allowedRoles={["CUSTOMER"]}
              >
                <InspectionDetails />
              </ProtectedRoute>
            }
          />


          <Route
            path="/customer/invoices"
            element={
              <ProtectedRoute
                allowedRoles={["CUSTOMER"]}
              >
                <Invoices />
              </ProtectedRoute>
            }
          />


          <Route
            path="/customer/invoices/:invoiceId"
            element={
              <ProtectedRoute
                allowedRoles={["CUSTOMER"]}
              >
                <InvoiceDetails />
              </ProtectedRoute>
            }
          />


          <Route
            path="/customer/notifications"
            element={
              <ProtectedRoute
                allowedRoles={["CUSTOMER"]}
              >
                <Notifications />
              </ProtectedRoute>
            }
          />


          <Route
            path="/customer/work-orders"
            element={
              <ProtectedRoute
                allowedRoles={["CUSTOMER"]}
              >
                <CustomerWorkOrders />
              </ProtectedRoute>
            }
          />


          <Route
            path="/customer/inspections"
            element={
              <ProtectedRoute
                allowedRoles={["CUSTOMER"]}
              >
                <CustomerInspections />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              SERVICE ADVISOR
          ================================================= */}

          <Route
            path="/advisor/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={["SERVICE_ADVISOR"]}
              >
                <AdvisorDashboard />
              </ProtectedRoute>
            }
          />


          <Route
            path="/advisor/bookings"
            element={
              <ProtectedRoute
                allowedRoles={["SERVICE_ADVISOR"]}
              >
                <AdvisorBookings />
              </ProtectedRoute>
            }
          />


          <Route
            path="/advisor/work-orders"
            element={
              <ProtectedRoute
                allowedRoles={["SERVICE_ADVISOR"]}
              >
                <AdvisorWorkOrders />
              </ProtectedRoute>
            }
          />


          <Route
            path="/advisor/approvals"
            element={
              <ProtectedRoute
                allowedRoles={["SERVICE_ADVISOR"]}
              >
                <AdvisorApprovals />
              </ProtectedRoute>
            }
          />


          <Route
            path="/advisor/customers"
            element={
              <ProtectedRoute
                allowedRoles={["SERVICE_ADVISOR"]}
              >
                <AdvisorCustomers />
              </ProtectedRoute>
            }
          />


          <Route
            path="/advisor/vehicles"
            element={
              <ProtectedRoute
                allowedRoles={["SERVICE_ADVISOR"]}
              >
                <AdvisorVehicles />
              </ProtectedRoute>
            }
          />


          <Route
            path="/advisor/inspections"
            element={
              <ProtectedRoute
                allowedRoles={["SERVICE_ADVISOR"]}
              >
                <AdvisorInspections />
              </ProtectedRoute>
            }
          />


          <Route
            path="/advisor/inspections/:inspectionId"
            element={
              <ProtectedRoute
                allowedRoles={["SERVICE_ADVISOR"]}
              >
                <InspectionDetails />
              </ProtectedRoute>
            }
          />


          <Route
            path="/advisor/estimates"
            element={
              <ProtectedRoute
                allowedRoles={["SERVICE_ADVISOR"]}
              >
                <AdvisorEstimates />
              </ProtectedRoute>
            }
          />


          <Route
            path="/advisor/invoices"
            element={
              <ProtectedRoute
                allowedRoles={["SERVICE_ADVISOR"]}
              >
                <AdvisorInvoices />
              </ProtectedRoute>
            }
          />


          <Route
            path="/advisor/invoices/:invoiceId"
            element={
              <ProtectedRoute
                allowedRoles={["SERVICE_ADVISOR"]}
              >
                <InvoiceDetails />
              </ProtectedRoute>
            }
          />


          <Route
            path="/advisor/payments"
            element={
              <ProtectedRoute
                allowedRoles={["SERVICE_ADVISOR"]}
              >
                <AdvisorPayments />
              </ProtectedRoute>
            }
          />


          <Route
            path="/advisor/notifications"
            element={
              <ProtectedRoute
                allowedRoles={["SERVICE_ADVISOR"]}
              >
                <AdvisorNotifications />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              MECHANIC
          ================================================= */}

          <Route
            path="/mechanic/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={["MECHANIC"]}
              >
                <MechanicDashboard />
              </ProtectedRoute>
            }
          />


          <Route
            path="/mechanic/work-orders"
            element={
              <ProtectedRoute
                allowedRoles={["MECHANIC"]}
              >
                <MechanicWorkOrders />
              </ProtectedRoute>
            }
          />


          <Route
            path="/mechanic/inspections"
            element={
              <ProtectedRoute
                allowedRoles={["MECHANIC"]}
              >
                <MechanicInspections />
              </ProtectedRoute>
            }
          />


          <Route
            path="/mechanic/notifications"
            element={
              <ProtectedRoute
                allowedRoles={["MECHANIC"]}
              >
                <MechanicNotifications />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              UNKNOWN URL
          ================================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </AuthProvider>
    </BrowserRouter>
  );
}