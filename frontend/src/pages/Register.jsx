import { useState } from "react";
import {
  Eye,
  EyeOff,
  Car,
  Lock,
  Mail,
  User,
  Phone,
} from "lucide-react";
import {
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import AnimatedButton from "../components/ui/animated-button";

export default function Register() {
  const navigate = useNavigate();
  const { user, register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  // =====================================================
  // ALREADY AUTHENTICATED
  // =====================================================

  if (user) {
    return (
      <Navigate
        to="/customer/dashboard"
        replace
      />
    );
  }

  // =====================================================
  // REGISTER
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await register({
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        email: email.trim(),
        phone: phone.trim() || null,
        password,
      });

      navigate(
        "/customer/dashboard",
        { replace: true }
      );
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        "Unable to create account. Please try again.";

      setError(
        Array.isArray(message)
          ? message.join(" ")
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
            Auto<span>Flow</span>
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
          REGISTER PANEL
      ================================================= */}

      <section className="login-form-panel">

        <div className="login-card">

          {/* Mobile branding */}

          <div className="mobile-brand">

            <div className="brand-mark">
              <Car size={26} />
            </div>

            <div className="brand-name">
              Auto<span>Flow</span>
            </div>

          </div>

          {/* Heading */}

          <div className="login-heading">

            <p className="eyebrow">
              WORKSHOP MANAGEMENT
            </p>

            <h2>
              Create your account
            </h2>

            <p>
              Register to start booking
              workshop services.
            </p>

          </div>

          {/* Register form */}

          <form onSubmit={handleSubmit}>

            {/* First Name */}

            <div className="form-field">

              <label htmlFor="firstName">
                First name
              </label>

              <div className="input-box">

                <User size={18} />

                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  placeholder="John"
                  autoComplete="given-name"
                  onChange={(event) =>
                    setFirstName(
                      event.target.value
                    )
                  }
                  required
                />

              </div>

            </div>

            {/* Last Name */}

            <div className="form-field">

              <label htmlFor="lastName">
                Last name
              </label>

              <div className="input-box">

                <User size={18} />

                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  placeholder="Doe"
                  autoComplete="family-name"
                  onChange={(event) =>
                    setLastName(
                      event.target.value
                    )
                  }
                />

              </div>

            </div>

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

            {/* Phone */}

            <div className="form-field">

              <label htmlFor="phone">
                Phone number
              </label>

              <div className="input-box">

                <Phone size={18} />

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                />

              </div>

            </div>

            {/* Password */}

            <div className="form-field">

              <label htmlFor="password">
                Password
              </label>

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
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  required
                  minLength={6}
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
                ? "Creating account..."
                : "Create account"}
            </AnimatedButton>

          </form>

          <p className="login-footer">
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "var(--quantum-blue)",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </p>

        </div>

      </section>

    </main>
  );
}
