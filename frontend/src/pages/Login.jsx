import { useState, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Car,
  Lock,
  Mail,
} from "lucide-react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import AnimatedButton from "../components/ui/animated-button";
import LoadingScreen from "../components/common/LoadingScreen";


// =====================================================
// ROLE → DASHBOARD
// =====================================================

const getDashboardPath = (role) => {
  switch (role) {
    case "CUSTOMER":
      return "/customer/dashboard";

    case "SERVICE_ADVISOR":
      return "/advisor/dashboard";

    case "TECHNICIAN":
    case "MECHANIC":
      return "/mechanic/dashboard";

    default:
      return "/login";
  }
};


export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [showLoading, setShowLoading] =
    useState(false);

  const [pendingUser, setPendingUser] =
    useState(null);


  // =====================================================
  // LOADING COMPLETE
  // IMPORTANT: ALL HOOKS MUST BE ABOVE CONDITIONAL RETURNS
  // =====================================================

  const handleLoadingComplete = useCallback(() => {
    if (!pendingUser) {
      return;
    }

    navigate(
      getDashboardPath(pendingUser.role),
      {
        replace: true,
      }
    );
  }, [pendingUser, navigate]);


  // =====================================================
  // ALREADY AUTHENTICATED
  // =====================================================

  if (user && !showLoading) {
    return (
      <Navigate
        to={getDashboardPath(user.role)}
        replace
      />
    );
  }


  // =====================================================
  // LOGIN
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const loggedInUser = await login(
        email.trim(),
        password
      );

      setPendingUser(loggedInUser);
      setShowLoading(true);

    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        "Unable to sign in. Please check your credentials.";

      setError(
        Array.isArray(message)
          ? "Invalid login details."
          : message
      );

    } finally {
      setSubmitting(false);
    }
  };


  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="login-page">

      {/* ================================================
          LEFT BRAND PANEL
      ================================================= */}

      <section className="login-brand-panel">

        <div className="brand-content">

          <div className="brand-mark">
            <Car
              size={30}
              strokeWidth={2.2}
            />
          </div>

          <div className="brand-name">
            Garage<span> 360</span>
          </div>

          <h1>
            Smarter service.
            <br />
            Better workshops.
          </h1>

          <p>
            Manage vehicles, bookings,
            inspections, estimates,
            invoices and payments from
            one connected workshop platform.
          </p>

          <div className="brand-feature">
            <span>01</span>

            <div>
              <strong>
                Connected workflow
              </strong>

              <small>
                From booking to payment.
              </small>
            </div>
          </div>

          <div className="brand-feature">
            <span>02</span>

            <div>
              <strong>
                Real-time visibility
              </strong>

              <small>
                Keep every service step
                organized.
              </small>
            </div>
          </div>

        </div>

      </section>


      {/* ================================================
          LOGIN PANEL
      ================================================= */}

      <section className="login-form-panel">

        <div className="login-card">

          {/* Mobile branding */}

          <div className="mobile-brand">

            <div className="brand-mark">
              <Car size={26} />
            </div>

            <div className="brand-name">
              Garage<span> 360</span>
            </div>

          </div>


          {/* Heading */}

          <div className="login-heading">

            <p className="eyebrow">
              WORKSHOP MANAGEMENT
            </p>

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to continue to your
              workspace.
            </p>

          </div>


          {/* Login form */}

          <form onSubmit={handleSubmit}>

            {/* Email */}

            <div className="form-field">

              <label htmlFor="email">
                Email address
              </label>

              <div className="input-box">

                <Mail size={18} />

                <input
                  id="email"
                  type="email"
                  value={email}
                  placeholder="you@example.com"
                  autoComplete="email"
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  required
                />

              </div>

            </div>


            {/* Password */}

            <div className="form-field">

              <div className="password-label">

                <label htmlFor="password">
                  Password
                </label>

                <AnimatedButton
                  type="button"
                  className="forgot-button"
                  onClick={() =>
                    setError(
                      "Please contact your workshop administrator to reset your password."
                    )
                  }
                >
                  Forgot password?
                </AnimatedButton>

              </div>

              <div className="input-box">

                <Lock size={18} />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  required
                />

                <AnimatedButton
                  type="button"
                  className="icon-button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </AnimatedButton>

              </div>

            </div>


            {/* Error */}

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}


            {/* Submit */}

            <AnimatedButton
              className="login-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Signing in..."
                : "Sign in"}
            </AnimatedButton>

          </form>


          <p className="login-footer">

            Don't have an account?{" "}

            <Link
              to="/register"
              style={{
                color: "var(--quantum-blue)",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Sign up
            </Link>

          </p>

        </div>

      </section>


      {/* Loading */}

      {showLoading && (
        <LoadingScreen
          onComplete={handleLoadingComplete}
        />
      )}

    </main>
  );
}