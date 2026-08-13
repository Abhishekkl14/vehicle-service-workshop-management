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