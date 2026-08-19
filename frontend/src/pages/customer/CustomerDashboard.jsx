import { useCallback, useEffect, useState } from "react";

import {
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarDays,
  Car,
  Clock3,
  FileText,
  History,
  Receipt,
  RefreshCw,
  Wrench,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

import AppLayout from "../../components/layout/AppLayout";
import BorderGlow from "../../components/common/BorderGlow";
import ProximityScaleGrid from "../../components/common/ProximityScaleGrid";

import {
  getCustomerBookings,
} from "../../api/bookingApi";

import {
  getCustomerVehicles,
} from "../../api/vehicleApi";

import {
  getWorkOrdersByStatus,
} from "../../api/workOrderApi";

import {
  getCustomerEstimates,
} from "../../api/estimateApi";

import {
  getNotifications,
} from "../../api/notificationApi";

import {
  getCustomerServiceHistory,
} from "../../api/customerHistoryApi";
import AnimatedButton from "../../components/ui/animated-button";


const ACTIVE_WORK_ORDER_STATUSES = [
  "CREATED",
  "INSPECTION",
  "IN_PROGRESS",
  "WAITING_FOR_APPROVAL",
  "SUBMITTED_FOR_APPROVAL",
];


const getErrorMessage = (error) => {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong"
  );
};


const formatCurrency = (amount) => {
  if (
    amount === null ||
    amount === undefined ||
    amount === ""
  ) {
    return "—";
  }

  const value = Number(amount);

  if (Number.isNaN(value)) {
    return "—";
  }

  return (
    "\u20B9" +
    value.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )
  );
};


const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};


const formatDateTime = (value) => {
  if (!value) {
    return "—";
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
    }
  );
};


const formatTime = (time) => {
  if (!time) {
    return "—";
  }

  const parts = String(time).split(":");

  if (parts.length < 2) {
    return time;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return time;
  }

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
};


const getBookingStatusClass = (status) => {
  const normalized = String(
    status || ""
  ).toUpperCase();

  if (
    [
      "COMPLETED",
      "PAID",
      "APPROVED",
    ].includes(normalized)
  ) {
    return "completed";
  }

  if (
    [
      "CANCELLED",
      "REJECTED",
    ].includes(normalized)
  ) {
    return "cancelled";
  }

  if (normalized === "CONFIRMED") {
    return "confirmed";
  }

  return "pending";
};


const getWorkOrderStatusClass = (status) => {
  const normalized = String(
    status || ""
  ).toUpperCase();

  if (normalized === "COMPLETED") {
    return "completed";
  }

  if (normalized === "CANCELLED") {
    return "cancelled";
  }

  return "pending";
};


const getVehicleLabel = (record) => {
  const name = [
    record?.make,
    record?.model,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (name) {
    return name;
  }

  return `Vehicle #${record?.vehicle_id}`;
};


export default function CustomerDashboard() {
  const { user } = useAuth();

  const navigate = useNavigate();

  const customerId =
    user?.customer_id ?? user?.customer?.id;

  const firstName =
    user?.first_name || "there";

  const [vehicles, setVehicles] =
    useState(null);

  const [vehiclesError, setVehiclesError] =
    useState("");

  const [bookings, setBookings] =
    useState(null);

  const [bookingsError, setBookingsError] =
    useState("");

  const [workOrders, setWorkOrders] =
    useState(null);

  const [workOrdersError, setWorkOrdersError] =
    useState("");

  const [estimates, setEstimates] =
    useState(null);

  const [estimatesError, setEstimatesError] =
    useState("");

  const [notifications, setNotifications] =
    useState(null);

  const [notificationsError, setNotificationsError] =
    useState("");

  const [history, setHistory] =
    useState(null);

  const [historyError, setHistoryError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);


  /* =====================================================
     LOADERS
  ===================================================== */

  const loadVehicles = useCallback(
    async () => {
      setVehiclesError("");
      setVehicles(null);

      try {
        const data =
          await getCustomerVehicles(
            customerId
          );

        setVehicles(data || []);
      } catch (error) {
        setVehiclesError(
          getErrorMessage(error)
        );
      }
    },
    [customerId]
  );


  const loadBookings = useCallback(
    async () => {
      setBookingsError("");
      setBookings(null);

      try {
        const data =
          await getCustomerBookings(
            customerId
          );

        setBookings(data || []);
      } catch (error) {
        setBookingsError(
          getErrorMessage(error)
        );
      }
    },
    [customerId]
  );


  const loadWorkOrders = useCallback(
    async () => {
      setWorkOrdersError("");
      setWorkOrders(null);

      try {
        const results =
          await Promise.allSettled(
            ACTIVE_WORK_ORDER_STATUSES.map(
              (status) =>
                getWorkOrdersByStatus(
                  status
                )
            )
          );

        const fulfilled =
          results
            .filter(
              (result) =>
                result.status === "fulfilled"
            )
            .flatMap(
              (result) =>
                result.value || []
            );

        const rejected =
          results.filter(
            (result) =>
              result.status === "rejected"
          );

        if (
          fulfilled.length === 0 &&
          rejected.length > 0
        ) {
          throw new Error(
            "Could not load active work orders"
          );
        }

        const byId = new Map(
          fulfilled.map(
            (workOrder) => [
              workOrder.id,
              workOrder,
            ]
          )
        );

        const merged =
          Array.from(
            byId.values()
          ).sort(
            (a, b) => b.id - a.id
          );

        setWorkOrders(merged);
      } catch (error) {
        setWorkOrdersError(
          getErrorMessage(error)
        );
      }
    },
    []
  );


  const loadEstimates = useCallback(
    async () => {
      setEstimatesError("");
      setEstimates(null);

      try {
        const data =
          await getCustomerEstimates();

        setEstimates(data || []);
      } catch (error) {
        setEstimatesError(
          getErrorMessage(error)
        );
      }
    },
    []
  );


  const loadNotifications = useCallback(
    async () => {
      setNotificationsError("");
      setNotifications(null);

      try {
        const data =
          await getNotifications(false);

        setNotifications(data || []);
      } catch (error) {
        setNotificationsError(
          getErrorMessage(error)
        );
      }
    },
    []
  );


  const loadHistory = useCallback(
    async () => {
      setHistoryError("");
      setHistory(null);

      try {
        const data =
          await getCustomerServiceHistory(
            customerId
          );

        setHistory(data || []);
      } catch (error) {
        setHistoryError(
          getErrorMessage(error)
        );
      }
    },
    [customerId]
  );


  useEffect(() => {
    loadVehicles();
    loadBookings();
    loadWorkOrders();
    loadEstimates();
    loadNotifications();
    loadHistory();
  }, [
    loadVehicles,
    loadBookings,
    loadWorkOrders,
    loadEstimates,
    loadNotifications,
    loadHistory,
  ]);


  const handleRefresh = () => {
    setRefreshing(true);

    Promise.allSettled([
      loadVehicles(),
      loadBookings(),
      loadWorkOrders(),
      loadEstimates(),
      loadNotifications(),
      loadHistory(),
    ]).finally(() => {
      setRefreshing(false);
    });
  };


  const handleViewWorkOrders = () => {
    if (
      workOrders &&
      workOrders.length > 0
    ) {
      navigate(
        `/customer/work-orders/${workOrders[0].id}`
      );

      return;
    }

    navigate(
      "/customer/service-history"
    );
  };


  /* =====================================================
     DERIVED
  ===================================================== */

  const sortedBookings = [
    ...(bookings || []),
  ].sort((a, b) => {
    const first =
      `${a.booking_date || ""} ${
        a.booking_time || ""
      }`;

    const second =
      `${b.booking_date || ""} ${
        b.booking_time || ""
      }`;

    return second.localeCompare(
      first
    );
  });

  const sentEstimates =
    (estimates || []).filter(
      (estimate) =>
        estimate.status === "SENT"
    );

  const sortedEstimates = [
    ...sentEstimates,
  ].sort((a, b) => b.id - a.id);

  const unreadNotifications =
    (notifications || []).filter(
      (notification) =>
        !notification.is_read
    );

  const recentNotifications = [
    ...(notifications || []),
  ].sort((a, b) => {
    const first = new Date(
      a.created_at || 0
    ).getTime();

    const second = new Date(
      b.created_at || 0
    ).getTime();

    return second - first;
  });


  const summaryCards = [
    {
      key: "vehicles",
      label: "MY VEHICLES",
      value: vehicles
        ? vehicles.length
        : null,
      hint: "Vehicles registered",
      onClick: () =>
        navigate("/customer/vehicles"),
      icon: Car,
    },
    {
      key: "bookings",
      label: "BOOKINGS",
      value: bookings
        ? bookings.length
        : null,
      hint: "Total bookings",
      onClick: () =>
        navigate("/customer/bookings"),
      icon: CalendarDays,
    },
    {
      key: "work-orders",
      label: "ACTIVE WORK ORDERS",
      value: workOrders
        ? workOrders.length
        : null,
      hint: workOrders &&
        workOrders.length > 0
        ? "In progress"
        : "No active service",
      onClick: handleViewWorkOrders,
      icon: Wrench,
    },
    {
      key: "estimates",
      label: "PENDING ESTIMATES",
      value: estimates
        ? sentEstimates.length
        : null,
      hint: "Need your approval",
      onClick: () =>
        navigate("/customer/estimates"),
      icon: FileText,
    },
    {
      key: "notifications",
      label: "UNREAD NOTIFICATIONS",
      value: notifications
        ? unreadNotifications.length
        : null,
      hint: "Recent updates",
      onClick: () =>
        navigate("/customer/notifications"),
      icon: Bell,
    },
  ];


  /* =====================================================
     RENDER HELPERS
  ===================================================== */

  const renderSkeleton = (count) => (
    <div className="booking-list">
      {Array.from(
        { length: count },
        (_, index) => (
          <div
            className="booking-card booking-skeleton"
            key={index}
          >
            <div className="booking-icon" />

            <div className="booking-skeleton-content">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line short" />
            </div>
          </div>
        )
      )}
    </div>
  );


  const renderError = (message, onRetry) => (
    <div className="bookings-error">
      <div>
        <strong>
          Unable to load this section
        </strong>

        <p>
          {message}
        </p>
      </div>

      <AnimatedButton
        type="button"
        onClick={onRetry}
      >
        Try again
      </AnimatedButton>
    </div>
  );


  const renderEmpty = (icon, title, text) => (
    <div className="dashboard-empty">
      <div className="dashboard-empty-icon">
        {icon}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>
    </div>
  );


  const SectionHeader = ({
    title,
    subtitle,
    actionLabel,
    onAction,
  }) => (
    <div className="dashboard-section-head">
      <div className="section-header">
        <h2>
          {title}
        </h2>

        <p>
          {subtitle}
        </p>
      </div>

      {actionLabel && onAction && (
        <AnimatedButton
          type="button"
          className="section-view-link"
          onClick={onAction}
        >
          {actionLabel}

          <ArrowRight size={13} />
        </AnimatedButton>
      )}
    </div>
  );


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <AppLayout>
      <div className="dashboard-page">

        {/* =============================================
            HEADER
        ============================================= */}

        <div className="dashboard-page-header">

          <div className="page-header">
            <div>
              <p className="page-eyebrow">
                CUSTOMER DASHBOARD
              </p>

              <h1>
                Welcome back,{" "}
                {firstName}
              </h1>

              <p>
                Here's an overview of your
                vehicle service activity.
              </p>
            </div>
          </div>

          <AnimatedButton
            type="button"
            className="secondary-action"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />

            Refresh
          </AnimatedButton>

        </div>


        {/* =============================================
            SUMMARY CARDS
        ============================================= */}

        <div className="dashboard-grid customer-summary-grid">

          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <BorderGlow
                key={card.key}
                className="dashboard-summary-glow"
                edgeSensitivity={32}
                glowColor="180 70 58"
                backgroundColor="#ffffff"
                borderRadius={16}
                glowRadius={28}
                glowIntensity={0.8}
                coneSpread={25}
                colors={["#00bfa6", "#38bdf8", "#f472b6"]}
                fillOpacity={0.16}
              >
                <AnimatedButton
                  type="button"
                  className="dashboard-card clickable"
                  onClick={card.onClick}
                >
                  <div className="dashboard-card-icon">
                    <Icon size={22} />
                  </div>

                  <span>
                    {card.label}
                  </span>

                  <strong>
                    {card.value === null
                      ? "—"
                      : card.value}
                  </strong>

                  <small>
                    {card.hint}
                  </small>
                </AnimatedButton>
              </BorderGlow>
            );
          })}

        </div>


        {/* =============================================
            PROXIMITY SCALE GRID
        ============================================= */}

        <ProximityScaleGrid />


        {/* =============================================
            CONTENT SECTIONS
        ============================================= */}

        <div className="dashboard-content-grid">

          {/* RECENT BOOKINGS */}

          <section className="dashboard-section">

            <SectionHeader
              title="Recent bookings"
              subtitle="Your latest workshop appointments"
              actionLabel="View all"
              onAction={() =>
                navigate("/customer/bookings")
              }
            />

            {bookingsError ? (
              renderError(
                bookingsError,
                loadBookings
              )
            ) : bookings === null ? (
              renderSkeleton(3)
            ) : bookings.length === 0 ? (
              renderEmpty(
                <CalendarDays size={22} />,
                "No bookings yet",
                "When you book a service appointment it will show up here."
              )
            ) : (
              <div className="booking-list">

                {sortedBookings
                  .slice(0, 4)
                  .map((booking) => (
                    <article
                      className="booking-card"
                      key={booking.id}
                    >
                      <div className="booking-card-main">

                        <div className="booking-icon">
                          <CalendarDays size={23} />
                        </div>

                        <div className="booking-content">

                          <div className="booking-title-row">
                            <h2>
                              Booking #{booking.id}
                            </h2>

                            <span
                              className={`booking-status ${getBookingStatusClass(
                                booking.status
                              )}`}
                            >
                              {booking.status ||
                                "PENDING"}
                            </span>
                          </div>

                          <p className="booking-vehicle">
                            <Car size={15} />

                            <span>
                              Vehicle #{booking.vehicle_id}
                            </span>

                            <span>
                              •
                            </span>

                            <span>
                              Service #{booking.service_id}
                            </span>
                          </p>

                          <div className="booking-meta">
                            <div>
                              <CalendarDays size={14} />

                              <span>
                                {formatDate(
                                  booking.booking_date
                                )}
                              </span>
                            </div>

                            <div>
                              <Clock3 size={14} />

                              <span>
                                {formatTime(
                                  booking.booking_time
                                )}
                              </span>
                            </div>
                          </div>

                        </div>

                      </div>

                      <AnimatedButton
                        type="button"
                        className="booking-view-button"
                        onClick={() =>
                          navigate(
                            `/customer/bookings/${booking.id}`
                          )
                        }
                      >
                        View Booking
                        <ArrowRight size={14} />
                      </AnimatedButton>
                    </article>
                  ))}

              </div>
            )}

          </section>


          {/* RECENT WORK ORDERS */}

          <section className="dashboard-section">

            <SectionHeader
              title="Active work orders"
              subtitle="Service currently underway on your vehicles"
              actionLabel="Service history"
              onAction={() =>
                navigate("/customer/service-history")
              }
            />

            {workOrdersError ? (
              renderError(
                workOrdersError,
                loadWorkOrders
              )
            ) : workOrders === null ? (
              renderSkeleton(3)
            ) : workOrders.length === 0 ? (
              renderEmpty(
                <Wrench size={22} />,
                "No active work orders",
                "When the workshop starts working on your vehicle it will show up here."
              )
            ) : (
              <div className="booking-list">

                {workOrders
                  .slice(0, 4)
                  .map((workOrder) => (
                    <article
                      className="booking-card"
                      key={workOrder.id}
                    >
                      <div className="booking-card-main">

                        <div className="booking-icon">
                          <Wrench size={23} />
                        </div>

                        <div className="booking-content">

                          <div className="booking-title-row">
                            <h2>
                              Work Order #{workOrder.id}
                            </h2>

                            <span
                              className={`booking-status ${getWorkOrderStatusClass(
                                workOrder.status
                              )}`}
                            >
                              {workOrder.status ||
                                "—"}
                            </span>
                          </div>

                          <p className="booking-vehicle">
                            <Car size={15} />

                            <span>
                              Vehicle #{workOrder.vehicle_id}
                            </span>
                          </p>

                          {workOrder.complaint && (
                            <p className="booking-notes">
                              {workOrder.complaint}
                            </p>
                          )}

                          <div className="booking-meta">
                            {workOrder.received_at && (
                              <div>
                                <CalendarDays size={14} />

                                <span>
                                  Received{" "}
                                  {formatDate(
                                    workOrder.received_at
                                  )}
                                </span>
                              </div>
                            )}

                            {workOrder.started_at && (
                              <div>
                                <Clock3 size={14} />

                                <span>
                                  Started{" "}
                                  {formatDate(
                                    workOrder.started_at
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                        </div>

                      </div>

                      <AnimatedButton
                        type="button"
                        className="booking-view-button"
                        onClick={() =>
                          navigate(
                            `/customer/work-orders/${workOrder.id}`
                          )
                        }
                      >
                        View Work Order
                        <ArrowRight size={14} />
                      </AnimatedButton>
                    </article>
                  ))}

              </div>
            )}

          </section>


          {/* PENDING ESTIMATES */}

          <section className="dashboard-section">

            <SectionHeader
              title="Pending estimates"
              subtitle="Estimates waiting for your approval"
              actionLabel="View all"
              onAction={() =>
                navigate("/customer/estimates")
              }
            />

            {estimatesError ? (
              renderError(
                estimatesError,
                loadEstimates
              )
            ) : estimates === null ? (
              renderSkeleton(3)
            ) : sortedEstimates.length === 0 ? (
              renderEmpty(
                <FileText size={22} />,
                "No pending estimates",
                "When the workshop prepares an estimate for your approval, it will appear here."
              )
            ) : (
              <div className="booking-list">

                {sortedEstimates
                  .slice(0, 4)
                  .map((estimate) => (
                    <article
                      className="booking-card"
                      key={estimate.id}
                    >
                      <div className="booking-card-main">

                        <div className="booking-icon">
                          <FileText size={23} />
                        </div>

                        <div className="booking-content">

                          <div className="booking-title-row">
                            <h2>
                              Estimate #{estimate.id}
                            </h2>

                            <span className="booking-status pending">
                              SENT
                            </span>
                          </div>

                          <p className="booking-vehicle">
                            <Wrench size={15} />

                            <span>
                              Work Order #{estimate.work_order_id}
                            </span>
                          </p>

                          <div className="booking-meta">
                            <div>
                              <CalendarDays size={14} />

                              <span>
                                {formatDateTime(
                                  estimate.sent_at ||
                                    estimate.created_at
                                )}
                              </span>
                            </div>

                            <div>
                              <Receipt size={14} />

                              <span>
                                {formatCurrency(
                                  estimate.total_amount
                                )}
                              </span>
                            </div>
                          </div>

                          <p className="dashboard-warn">
                            <AlertCircle size={14} />

                            Approval required
                          </p>

                        </div>

                      </div>

                      <AnimatedButton
                        type="button"
                        className="booking-view-button"
                        onClick={() =>
                          navigate(
                            `/customer/estimates/${estimate.id}`
                          )
                        }
                      >
                        View Estimate
                        <ArrowRight size={14} />
                      </AnimatedButton>
                    </article>
                  ))}

              </div>
            )}

          </section>


          {/* INVOICES & PAYMENTS */}

          <section className="dashboard-section">

            <SectionHeader
              title="Invoices & Payments"
              subtitle="Billing and payment records for completed work"
            />

            <div className="dashboard-info-card">

              <div className="dashboard-info-icon">
                <Receipt size={22} />
              </div>

              <div>
                <h3>
                  View your invoices
                </h3>

                <p>
                  Once work on your vehicle
                  is completed, an invoice is
                  generated. You can review
                  line-item charges, totals
                  and payment status there.
                </p>
              </div>

              <AnimatedButton
                type="button"
                className="primary-action"
                onClick={() =>
                  navigate("/customer/invoices")
                }
              >
                View Invoices
                <ArrowRight size={15} />
              </AnimatedButton>

            </div>

          </section>


          {/* RECENT NOTIFICATIONS */}

          <section className="dashboard-section">

            <SectionHeader
              title="Recent notifications"
              subtitle="Updates from the workshop"
              actionLabel="View all"
              onAction={() =>
                navigate("/customer/notifications")
              }
            />

            {notificationsError ? (
              renderError(
                notificationsError,
                loadNotifications
              )
            ) : notifications === null ? (
              renderSkeleton(3)
            ) : notifications.length === 0 ? (
              renderEmpty(
                <Bell size={22} />,
                "You're all caught up",
                "Workshop notifications will appear here."
              )
            ) : (
              <div className="booking-list">

                {recentNotifications
                  .slice(0, 4)
                  .map((notification) => (
                    <article
                      className="booking-card"
                      key={notification.id}
                    >
                      <div className="booking-card-main">

                        <div className="booking-icon">
                          <Bell size={23} />
                        </div>

                        <div className="booking-content">

                          <div className="booking-title-row">
                            <h2>
                              {notification.title ||
                                "Notification"}
                            </h2>

                            {!notification.is_read && (
                              <span className="booking-status pending">
                                UNREAD
                              </span>
                            )}
                          </div>

                          {notification.message && (
                            <p className="booking-notes">
                              {notification.message}
                            </p>
                          )}

                          <div className="booking-meta">
                            <div>
                              <CalendarDays size={14} />

                              <span>
                                {formatDateTime(
                                  notification.created_at
                                )}
                              </span>
                            </div>
                          </div>

                        </div>

                      </div>
                    </article>
                  ))}

              </div>
            )}

          </section>


          {/* RECENT SERVICE ACTIVITY */}

          <section className="dashboard-section">

            <SectionHeader
              title="Recent service activity"
              subtitle="Your latest completed services"
              actionLabel="View all"
              onAction={() =>
                navigate("/customer/service-history")
              }
            />

            {historyError ? (
              renderError(
                historyError,
                loadHistory
              )
            ) : history === null ? (
              renderSkeleton(2)
            ) : history.length === 0 ? (
              renderEmpty(
                <History size={22} />,
                "No service history yet",
                "Completed services will appear here once your vehicle has been serviced."
              )
            ) : (
              <div className="booking-list">

                {history
                  .slice(0, 2)
                  .map((record, index) => (
                    <article
                      className="booking-card"
                      key={`${record.booking_id}-${record.work_order_id || index}`}
                    >
                      <div className="booking-card-main">

                        <div className="booking-icon">
                          <History size={23} />
                        </div>

                        <div className="booking-content">

                          <div className="booking-title-row">
                            <h2>
                              {record.service_name ||
                                "Service"}
                            </h2>

                            <span
                              className={`booking-status ${getWorkOrderStatusClass(
                                record.work_order_status
                              )}`}
                            >
                              {record.work_order_status ||
                                "COMPLETED"}
                            </span>
                          </div>

                          <p className="booking-vehicle">
                            <Car size={15} />

                            <span>
                              {getVehicleLabel(record)}
                            </span>

                            <span>
                              •
                            </span>

                            <span>
                              Booking #{record.booking_id}
                            </span>
                          </p>

                          <div className="booking-meta">
                            <div>
                              <CalendarDays size={14} />

                              <span>
                                {formatDate(
                                  record.booking_date
                                )}
                              </span>
                            </div>

                            {record.invoice_number && (
                              <div>
                                <Receipt size={14} />

                                <span>
                                  Invoice #{record.invoice_number}
                                </span>
                              </div>
                            )}

                            {record.invoice_total && (
                              <div>
                                <Receipt size={14} />

                                <span>
                                  {formatCurrency(
                                    record.invoice_total
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                        </div>

                      </div>
                    </article>
                  ))}

              </div>
            )}

          </section>

        </div>

      </div>
    </AppLayout>
  );
}
