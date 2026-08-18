import { useEffect, useState } from "react";

import {
  Bell,
  BellRing,
  CheckCircle2,
  LoaderCircle,
  AlertCircle,
  MailOpen,
  CalendarDays,
  RefreshCw,
} from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  getNotifications,
  markNotificationRead,
} from "../../api/notificationApi";
import AnimatedButton from "../../components/ui/animated-button";


const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );
};


export default function MechanicNotifications() {

  const { user } = useAuth();


  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [unreadOnly, setUnreadOnly] =
    useState(false);

  const [markingId, setMarkingId] =
    useState(null);

  const [markError, setMarkError] =
    useState("");


  /* =====================================================
     LOAD NOTIFICATIONS
  ===================================================== */

  const loadNotifications = async () => {

    try {

      setLoading(true);

      setError("");


      const data =
        await getNotifications(
          unreadOnly
        );


      setNotifications(
        Array.isArray(data)
          ? data
          : data?.items || []
      );

    } catch (err) {

      console.error(
        "Failed to load notifications:",
        err
      );


      setError(
        err?.response?.data?.detail ||
          "Unable to load notifications."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadNotifications();

  }, [unreadOnly]);


  /* =====================================================
     MARK AS READ
  ===================================================== */

  const handleMarkRead = async (
    notificationId
  ) => {

    if (markingId) {
      return;
    }

    try {

      setMarkingId(notificationId);

      setMarkError("");


      const updated =
        await markNotificationRead(
          notificationId
        );


      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === updated.id
            ? updated
            : notification
        )
      );

    } catch (err) {

      console.error(
        "Failed to mark notification as read:",
        err
      );


      setMarkError(
        err?.response?.data?.detail ||
          "Unable to mark notification as read."
      );

    } finally {

      setMarkingId(null);

    }
  };


  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;


  return (
    <AppLayout>

      <div className="notifications-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="notifications-header">

          <div>

            <p className="page-eyebrow">
              NOTIFICATIONS
            </p>


            <h1>
              Notifications
            </h1>


            <p>
              Updates about your work
              orders and inspections.
            </p>

          </div>


          <AnimatedButton
            type="button"
            className="secondary-action"
            onClick={loadNotifications}
            disabled={loading}
          >

            <RefreshCw
              size={16}
              className={
                loading ? "spin" : ""
              }
            />

            Refresh

          </AnimatedButton>

        </div>


        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="notifications-toolbar">

          <div className="unread-toggle">

            <input
              id="mechanic-unread-only-toggle"
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) =>
                setUnreadOnly(
                  e.target.checked
                )
              }
            />

            <label
              htmlFor="mechanic-unread-only-toggle"
            >

              <BellRing
                size={14}
              />

              Unread only

            </label>

          </div>


          {!unreadOnly && unreadCount > 0 && (

            <span className="notifications-count">

              {unreadCount} unread

            </span>

          )}

        </div>


        {markError && (

          <div className="notice-error">

            <AlertCircle
              size={16}
            />

            <span>
              {markError}
            </span>

          </div>

        )}


        {error && !loading && (

          <div className="notice-error">

            <AlertCircle
              size={16}
            />

            <span>
              {error}
            </span>

            <AnimatedButton
              type="button"
              onClick={loadNotifications}
            >

              Try Again

            </AnimatedButton>

          </div>

        )}


        {/* =================================================
            LIST
        ================================================= */}

        {loading ? (

          <div className="booking-list">

            {[1, 2, 3].map(
              (item) => (

                <div
                  className="booking-skeleton"
                  key={item}
                >

                  <div
                    className="skeleton skeleton-icon"
                  />

                  <div className="booking-skeleton-content">

                    <div
                      className="skeleton skeleton-title"
                    />

                    <div
                      className="skeleton skeleton-line"
                    />

                    <div
                      className="skeleton skeleton-line short"
                    />

                  </div>

                </div>

              )
            )}

          </div>

        ) : error ? null : notifications.length === 0 ? (

          <div className="notifications-empty">

            <div className="notifications-empty-icon">

              <MailOpen
                size={28}
              />

            </div>


            <h3>
              No notifications
            </h3>


            <p>
              You are all caught up.
            </p>

          </div>

        ) : (

          <div className="notification-list">

            {notifications.map(
              (notification) => {

                const unread =
                  !notification.is_read;

                const marking =
                  markingId ===
                  notification.id;

                return (

                  <article
                    className={`notification-card${
                      unread
                        ? " unread"
                        : ""
                    }`}
                    key={notification.id}
                  >

                    <div className="notification-card-top">

                      <div className="notification-card-icon">

                        {unread ? (
                          <BellRing
                            size={18}
                          />
                        ) : (
                          <Bell
                            size={18}
                          />
                        )}

                      </div>


                      <div className="notification-card-heading">

                        <h2>
                          {notification.title}
                        </h2>


                        <span className="notification-card-meta">

                          <CalendarDays
                            size={12}
                          />

                          {formatDate(
                            notification.created_at
                          )}

                        </span>

                      </div>


                      <span
                        className={`notification-badge ${
                          unread
                            ? "unread"
                            : "read"
                        }`}
                      >

                        {unread
                          ? "Unread"
                          : "Read"}

                      </span>

                    </div>


                    <p className="notification-message">
                      {notification.message}
                    </p>


                    <div className="notification-card-footer">

                      <span className="notification-type">
                        {notification.notification_type ||
                          "GENERAL"}
                      </span>


                      {unread && (

                        <AnimatedButton
                          type="button"
                          className="secondary-action notification-read-button"
                          onClick={() =>
                            handleMarkRead(
                              notification.id
                            )
                          }
                          disabled={
                            marking ||
                            Boolean(
                              markingId
                            )
                          }
                        >

                          {marking ? (
                            <LoaderCircle
                              size={14}
                              className="spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={14}
                            />
                          )}

                          {marking
                            ? "Marking..."
                            : "Mark as read"}

                        </AnimatedButton>

                      )}

                    </div>

                  </article>

                );

              }
            )}

          </div>

        )}

      </div>

    </AppLayout>
  );
}
