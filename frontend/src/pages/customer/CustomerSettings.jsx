import { useEffect, useState } from "react";

import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Lock,
  LoaderCircle,
  Save,
  Shield,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";
import AnimatedButton from "../../components/ui/animated-button";

import {
  getCurrentUser,
  updateProfile,
  changePassword,
} from "../../api/authApi";


export default function CustomerSettings() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();


  /* =====================================================
     PROFILE STATE
  ===================================================== */

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [profileLoading, setProfileLoading] =
    useState(true);

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [profileSuccess, setProfileSuccess] =
    useState("");

  const [profileError, setProfileError] =
    useState("");


  /* =====================================================
     PASSWORD STATE
  ===================================================== */

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPw, setShowCurrentPw] =
    useState(false);

  const [showNewPw, setShowNewPw] =
    useState(false);

  const [passwordSaving, setPasswordSaving] =
    useState(false);

  const [passwordSuccess, setPasswordSuccess] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");


  /* =====================================================
     LOAD PROFILE
  ===================================================== */

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);

        const data = await getCurrentUser();

        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setPhone(data.phone || "");
      } catch (err) {
        console.error(
          "Failed to load profile:",
          err
        );
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);


  /* =====================================================
     SAVE PROFILE
  ===================================================== */

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    setProfileError("");
    setProfileSuccess("");
    setProfileSaving(true);

    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        phone: phone.trim() || null,
      });

      setProfileSuccess(
        "Profile updated successfully."
      );
    } catch (err) {
      setProfileError(
        err?.response?.data?.detail ||
          "Failed to update profile."
      );
    } finally {
      setProfileSaving(false);
    }
  };


  /* =====================================================
     CHANGE PASSWORD
  ===================================================== */

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New passwords do not match."
      );
      return;
    }

    setPasswordSaving(true);

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setPasswordSuccess(
        "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(
        err?.response?.data?.detail ||
          "Failed to change password."
      );
    } finally {
      setPasswordSaving(false);
    }
  };


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <AppLayout>
      <div className="advisor-dashboard">

        {/* HEADER */}
        <div className="dashboard-header-row">
          <AnimatedButton
            className="back-btn"
            onClick={() =>
              navigate("/customer/dashboard")
            }
          >
            <ArrowLeft size={18} />
            Back
          </AnimatedButton>

          <h1 className="dashboard-title">
            Settings
          </h1>

          <div />
        </div>

        {profileLoading ? (
          <div className="loading-state">
            <LoaderCircle
              className="spin"
              size={28}
            />

            <p>Loading profile...</p>
          </div>
        ) : (
          <div className="booking-list">

            {/* ============================================
                PROFILE SECTION
            ============================================ */}

            <section className="booking-details-card">

              <div className="details-card-header">

                <div className="details-card-icon">
                  <User size={18} />
                </div>

                <div>
                  <h2>Profile Information</h2>
                  <p>
                    Update your name and phone
                    number
                  </p>
                </div>

              </div>

              {profileSuccess && (
                <div className="success-message">
                  {profileSuccess}
                </div>
              )}

              {profileError && (
                <div className="error-message">
                  {profileError}
                </div>
              )}

              <form
                onSubmit={handleSaveProfile}
              >
                <div className="work-order-grid">

                  {/* First Name */}
                  <div className="work-order-field">
                    <span>First Name</span>
                    <div className="input-box">
                      <User size={16} />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) =>
                          setFirstName(
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="work-order-field">
                    <span>Last Name</span>
                    <div className="input-box">
                      <User size={16} />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) =>
                          setLastName(
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Email (read-only) */}
                  <div className="work-order-field">
                    <span>Email</span>
                    <div className="input-box disabled">
                      <Mail size={16} />
                      <input
                        type="email"
                        value={
                          authUser?.email || ""
                        }
                        disabled
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="work-order-field">
                    <span>Phone</span>
                    <div className="input-box">
                      <Phone size={16} />
                      <input
                        type="tel"
                        value={phone}
                        placeholder="+91 98765 43210"
                        onChange={(e) =>
                          setPhone(
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                </div>

                <div className="settings-actions">
                  <AnimatedButton
                    type="submit"
                    className="submit-btn"
                    disabled={profileSaving}
                  >
                    {profileSaving ? (
                      <>
                        <LoaderCircle
                          className="spin"
                          size={16}
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Profile
                      </>
                    )}
                  </AnimatedButton>
                </div>

              </form>

            </section>


            {/* ============================================
                PASSWORD SECTION
            ============================================ */}

            <section className="booking-details-card">

              <div className="details-card-header">

                <div className="details-card-icon">
                  <Shield size={18} />
                </div>

                <div>
                  <h2>Change Password</h2>
                  <p>
                    Keep your account secure
                  </p>
                </div>

              </div>

              {passwordSuccess && (
                <div className="success-message">
                  {passwordSuccess}
                </div>
              )}

              {passwordError && (
                <div className="error-message">
                  {passwordError}
                </div>
              )}

              <form
                onSubmit={handleChangePassword}
              >
                <div className="work-order-grid">

                  {/* Current Password */}
                  <div className="work-order-field">
                    <span>
                      Current Password
                    </span>
                    <div className="input-box">
                      <Lock size={16} />
                      <input
                        type={
                          showCurrentPw
                            ? "text"
                            : "password"
                        }
                        value={currentPassword}
                        autoComplete="current-password"
                        onChange={(e) =>
                          setCurrentPassword(
                            e.target.value
                          )
                        }
                        required
                      />
                      <AnimatedButton
                        type="button"
                        className="input-toggle"
                        onClick={() =>
                          setShowCurrentPw(
                            (v) => !v
                          )
                        }
                      >
                        {showCurrentPw
                          ? "Hide"
                          : "Show"}
                      </AnimatedButton>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="work-order-field">
                    <span>New Password</span>
                    <div className="input-box">
                      <Lock size={16} />
                      <input
                        type={
                          showNewPw
                            ? "text"
                            : "password"
                        }
                        value={newPassword}
                        autoComplete="new-password"
                        placeholder="Min 6 characters"
                        onChange={(e) =>
                          setNewPassword(
                            e.target.value
                          )
                        }
                        required
                      />
                      <AnimatedButton
                        type="button"
                        className="input-toggle"
                        onClick={() =>
                          setShowNewPw(
                            (v) => !v
                          )
                        }
                      >
                        {showNewPw
                          ? "Hide"
                          : "Show"}
                      </AnimatedButton>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="work-order-field">
                    <span>
                      Confirm New Password
                    </span>
                    <div className="input-box">
                      <Lock size={16} />
                      <input
                        type={
                          showNewPw
                            ? "text"
                            : "password"
                        }
                        value={confirmPassword}
                        autoComplete="new-password"
                        onChange={(e) =>
                          setConfirmPassword(
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>
                  </div>

                </div>

                <div className="settings-actions">
                  <AnimatedButton
                    type="submit"
                    className="submit-btn"
                    disabled={passwordSaving}
                  >
                    {passwordSaving ? (
                      <>
                        <LoaderCircle
                          className="spin"
                          size={16}
                        />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        Change Password
                      </>
                    )}
                  </AnimatedButton>
                </div>

              </form>

            </section>

          </div>
        )}

      </div>
    </AppLayout>
  );
}
