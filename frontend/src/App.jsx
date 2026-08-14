import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/Login";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import MyVehicles from "./pages/customer/MyVehicles";
import VehicleDetails from "./pages/customer/VehicleDetails";
import Bookings from "./pages/customer/Bookings";
import CreateBooking from "./pages/customer/CreateBooking";
import AdvisorDashboard from "./pages/advisor/AdvisorDashboard";
import MechanicDashboard from "./pages/mechanic/MechanicDashboard";
import BookingDetails from "./pages/customer/BookingDetails";
import ServiceHistory from "./pages/customer/ServiceHistory";
import EstimateDetails from "./pages/customer/EstimateDetails";
import WorkOrderDetails from "./pages/customer/WorkOrderDetails";
import InspectionDetails from "./pages/customer/InspectionDetails";
import Invoices from "./pages/customer/Invoices";
import InvoiceDetails from "./pages/customer/InvoiceDetails";
import Notifications from "./pages/customer/Notifications";


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