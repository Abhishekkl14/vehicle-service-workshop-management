import { useEffect, useState } from "react";

import {
  RefreshCw,
  CalendarDays,
  Clock3,
  Car,
  User,
  Wrench,
  ClipboardList,
  CheckCircle2,
  LoaderCircle,
  Plus,
  X,
  AlertCircle,
  MessageSquare,
  BookOpen,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";

import {
  getBookingsByDate,
} from "../../api/bookingApi";

import {
  getWorkOrdersByStatus,
  createWorkOrder,
} from "../../api/workOrderApi";


const WORK_ORDER_STATUSES = [
  "CREATED",
  "INSPECTION",
  "IN_PROGRESS",
  "COMPLETED",
  "WAITING_FOR_APPROVAL",
];


const todayStr = () => {
  const now = new Date();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
};


const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const dateOnly =
    /^\d{4}-\d{2}-\d{2}$/.test(
      String(value)
    );

  if (dateOnly) {
    const [year, month, day] =
      String(value)
        .split("-")
        .map(Number);

    if (
      !year ||
      !month ||
      !day
    ) {
      return value;
    }

    return new Date(
      year,
      month - 1,
      day
    ).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};


const formatTime = (value) => {
  if (!value) {
    return "Not available";
  }

  const [hours, minutes] =
    String(value)
      .split(":")
      .map(Number);

  if (
    hours === undefined ||
    minutes === undefined ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return value;
  }

  const period =
    hours >= 12
      ? "PM"
      : "AM";

  const hour12 =
    hours % 12 === 0
      ? 12
      : hours % 12;

  return `${hour12}:${String(
    minutes
  ).padStart(2, "0")} ${period}`;
};


const getBookingStatusClass = (
  status
) => {
  const s = String(
    status || ""
  ).toUpperCase();

  if (s === "CONFIRMED") {
    return "booking-status confirmed";
  }

  if (
    s === "COMPLETED" ||
    s === "VEHICLE_RECEIVED"
  ) {
    return "booking-status completed";
  }

  if (s === "CANCELLED") {
    return "booking-status cancelled";
  }

  return "booking-status pending";
};


const getWorkOrderStatusClass = (
  status
) => {
  const s = String(
    status || ""
  ).toUpperCase();

  if (s === "COMPLETED") {
    return "booking-status confirmed";
  }

  if (s === "IN_PROGRESS") {
    return "booking-status completed";
  }

  return "booking-status pending";
};


export default function AdvisorDashboard() {

  const { user } = useAuth();


  const [selectedDate, setSelectedDate] =
    useState(todayStr());


  const [bookings, setBookings] =
    useState([]);

  const [bookingsLoading, setBookingsLoading] =
    useState(true);

  const [bookingsError, setBookingsError] =
    useState("");


  const [workOrders, setWorkOrders] =
    useState([]);

  const [workOrdersLoading, setWorkOrdersLoading] =
    useState(true);

  const [workOrdersError, setWorkOrdersError] =
    useState("");


  const [modalBooking, setModalBooking] =
    useState(null);

  const [complaint, setComplaint] =
    useState("");

  const [mechanicId, setMechanicId] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  const [createError, setCreateError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  /* =====================================================
     LOAD BOOKINGS FOR DATE
  ===================================================== */

  const loadBookings = async () => {

    try {

      setBookingsLoading(true);

      setBookingsError("");


      const data =
        await getBookingsByDate(
          selectedDate
        );


      setBookings(
        Array.isArray(data)
          ? data
          : data?.items || []
      );

    } catch (err) {

      console.error(
        "Failed to load bookings:",
        err
      );


      setBookingsError(
        err?.response?.data?.detail ||
          "Unable to load bookings."
      );

    } finally {

      setBookingsLoading(false);

    }
  };


  /* =====================================================
     LOAD WORK ORDERS BY STATUS
  ===================================================== */

  const loadWorkOrders = async () => {

    try {

      setWorkOrdersLoading(true);

      setWorkOrdersError("");


      const results =
        await Promise.all(
          WORK_ORDER_STATUSES.map(
            (status) =>
              getWorkOrdersByStatus(
                status
              )
          )
        );


      const seen = new Set();

      const unique =
        results
          .flat()
          .filter(Boolean)
          .filter((wo) => {
            if (seen.has(wo.id)) {
              return false;
            }

            seen.add(wo.id);

            return true;
          });


      setWorkOrders(unique);

    } catch (err) {

      console.error(
        "Failed to load work orders:",
        err
      );


      setWorkOrdersError(
        err?.response?.data?.detail ||
          "Unable to load work orders."
      );

    } finally {

      setWorkOrdersLoading(false);

    }
  };


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    loadBookings();

    loadWorkOrders();

  }, []);


  /* =====================================================
     DATE CHANGE
  ===================================================== */

  useEffect(() => {

    if (selectedDate) {

      loadBookings();

    }

  }, [selectedDate]);


  const handleRefresh = () => {

    loadBookings();

    loadWorkOrders();

  };


  /* =====================================================
     DERIVED DATA
  ===================================================== */

  const workOrderBookingIds =
    new Set(
      workOrders.map(
        (wo) => wo.booking_id
      )
    );


  const summary = {
    bookings: bookings.length,
    workOrders: workOrders.length,
    inProgress: workOrders.filter(
      (wo) =>
        wo.status === "IN_PROGRESS"
    ).length,
    completed: workOrders.filter(
      (wo) =>
        wo.status === "COMPLETED"
    ).length,
  };


  /* =====================================================
     CREATE WORK ORDER
  ===================================================== */

  const openCreateModal = (
    booking
  ) => {

    setModalBooking(booking);

    setComplaint("");

    setMechanicId("");

    setCreateError("");

  };


  const closeCreateModal = () => {

    if (creating) {
      return;
    }

    setModalBooking(null);

    setCreateError("");

  };


  const handleCreateWorkOrder = async () => {

    if (!modalBooking || creating) {
      return;
    }

    const mechanicValue =
      mechanicId.trim();

    let parsedMechanic = null;

    if (mechanicValue) {

      parsedMechanic =
        Number(mechanicValue);

      if (
        !Number.isInteger(
          parsedMechanic
        ) ||
        parsedMechanic <= 0
      ) {

        setCreateError(
          "Mechanic ID must be a positive number."
        );

        return;
      }

    }


    try {

      setCreating(true);

      setCreateError("");


      const created =
        await createWorkOrder({
          booking_id: modalBooking.id,
          vehicle_id: modalBooking.vehicle_id,
          complaint:
            complaint.trim() || null,
          mechanic_id: parsedMechanic,
        });


      setSuccessMessage(
        `Work order #${created.id} created for Booking #${modalBooking.id}.`
      );

      setModalBooking(null);

      setComplaint("");

      setMechanicId("");


      await Promise.all([
        loadBookings(),
        loadWorkOrders(),
      ]);

    } catch (err) {

      console.error(
        "Failed to create work order:",
        err
      );


      setCreateError(
        err?.response?.data?.detail ||
          "Unable to create work order. Please try again."
      );

    } finally {

      setCreating(false);

    }
  };


  return (
    <AppLayout>

      <div className="advisor-dashboard">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="advisor-header">

          <div>

            <p className="page-eyebrow">
              SERVICE ADVISOR
            </p>


            <h1>
              Welcome, {user?.first_name}
            </h1>


            <p>
              Manage today's workshop
              operations and service workflow.
            </p>

          </div>


          <button
            type="button"
            className="secondary-action"
            onClick={handleRefresh}
            disabled={
              bookingsLoading ||
              workOrdersLoading
            }
          >

            <RefreshCw
              size={16}
              className={
                bookingsLoading ||
                workOrdersLoading
                  ? "spin"
                  : ""
              }
            />

            Refresh

          </button>

        </div>


        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {successMessage && (

          <div className="advisor-success">

            <CheckCircle2
              size={18}
            />

            <span>
              {successMessage}
            </span>

            <button
              type="button"
              className="advisor-success-close"
              onClick={() =>
                setSuccessMessage("")
              }
              aria-label="Dismiss"
            >

              <X
                size={16}
              />

            </button>

          </div>

        )}


        {/* =================================================
            DATE FILTER
        ================================================= */}

        <div className="advisor-date-filter">

          <label htmlFor="advisor-booking-date">
            Booking Date
          </label>

          <div className="advisor-date-controls">

            <div className="advisor-date-input">

              <CalendarDays
                size={16}
              />

              <input
                id="advisor-booking-date"
                type="date"
                value={selectedDate}
                onChange={(e) =>
                  setSelectedDate(
                    e.target.value
                  )
                }
              />

            </div>


            <button
              type="button"
              className="secondary-action"
              onClick={() =>
                setSelectedDate(
                  todayStr()
                )
              }
              disabled={
                selectedDate ===
                todayStr()
              }
            >

              Today

            </button>

          </div>

        </div>


        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="dashboard-grid advisor-summary-grid">

          <div className="dashboard-card">

            <span>
              Today's Bookings
            </span>

            <strong>
              {bookingsLoading
                ? "…"
                : summary.bookings}
            </strong>

            <small>
              On {formatDate(selectedDate)}
            </small>

          </div>


          <div className="dashboard-card">

            <span>
              Work Orders
            </span>

            <strong>
              {workOrdersLoading
                ? "…"
                : summary.workOrders}
            </strong>

            <small>
              Across the workshop
            </small>

          </div>


          <div className="dashboard-card">

            <span>
              In Progress
            </span>

            <strong>
              {workOrdersLoading
                ? "…"
                : summary.inProgress}
            </strong>

            <small>
              Currently being worked on
            </small>

          </div>


          <div className="dashboard-card">

            <span>
              Completed
            </span>

            <strong>
              {workOrdersLoading
                ? "…"
                : summary.completed}
            </strong>

            <small>
              Finished work orders
            </small>

          </div>

        </div>


        {/* =================================================
            BOOKINGS SECTION
        ================================================= */}

        <div className="advisor-section">

          <div className="section-header">

            <div>

              <h2>
                Today's Bookings
              </h2>

              <p>
                Bookings for {formatDate(selectedDate)}
              </p>

            </div>

          </div>


          {bookingsError && !bookingsLoading && (

            <div className="advisor-error">

              <AlertCircle
                size={16}
              />

              <span>
                {bookingsError}
              </span>

              <button
                type="button"
                onClick={loadBookings}
              >
                Try Again
              </button>

            </div>

          )}


          {bookingsLoading ? (

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

          ) : bookingsError ? null : bookings.length === 0 ? (

            <div className="advisor-empty">

              <div className="advisor-empty-icon">

                <CalendarDays
                  size={26}
                />

              </div>


              <h3>
                No bookings for this date
              </h3>


              <p>
                Try selecting a different
                date.
              </p>

            </div>

          ) : (

            <div className="booking-list">

              {bookings.map((booking) => {

                const hasWorkOrder =
                  workOrderBookingIds.has(
                    booking.id
                  );

                return (

                  <article
                    className="booking-card"
                    key={booking.id}
                  >

                    <div className="booking-card-main">

                      <div className="booking-icon">

                        <CalendarDays
                          size={23}
                        />

                      </div>


                      <div className="booking-content">

                        <div className="booking-title-row">

                          <h2>
                            Booking #{booking.id}
                          </h2>


                          <span
                            className={getBookingStatusClass(
                              booking.status
                            )}
                          >

                            {booking.status ||
                              "PENDING"}

                          </span>

                        </div>


                        <div className="booking-meta">

                          <div>

                            <User
                              size={14}
                            />

                            Customer #{booking.customer_id}

                          </div>


                          <div>

                            <Car
                              size={14}
                            />

                            Vehicle #{booking.vehicle_id}

                          </div>


                          <div>

                            <Wrench
                              size={14}
                            />

                            Service #{booking.service_id}

                          </div>


                          <div>

                            <CalendarDays
                              size={14}
                            />

                            {formatDate(
                              booking.booking_date
                            )}

                          </div>


                          <div>

                            <Clock3
                              size={14}
                            />

                            {formatTime(
                              booking.booking_time
                            )}

                          </div>

                        </div>


                        {booking.customer_notes && (

                          <p className="booking-notes">

                            <MessageSquare
                              size={13}
                            />

                            {booking.customer_notes}

                          </p>

                        )}

                      </div>

                    </div>


                    <div className="advisor-card-footer">

                      {hasWorkOrder ? (

                        <span className="advisor-created-chip">

                          <CheckCircle2
                            size={14}
                          />

                          Work order created

                        </span>

                      ) : (

                        <button
                          type="button"
                          className="primary-action"
                          onClick={() =>
                            openCreateModal(
                              booking
                            )
                          }
                        >

                          <Plus
                            size={16}
                          />

                          Create Work Order

                        </button>

                      )}

                    </div>

                  </article>

                );

              })}

            </div>

          )}

        </div>


        {/* =================================================
            WORK ORDERS SECTION
        ================================================= */}

        <div className="advisor-section">

          <div className="section-header">

            <div>

              <h2>
                Work Orders
              </h2>

              <p>
                All workshop work orders
              </p>

            </div>

          </div>


          {workOrdersError && !workOrdersLoading && (

            <div className="advisor-error">

              <AlertCircle
                size={16}
              />

              <span>
                {workOrdersError}
              </span>

              <button
                type="button"
                onClick={loadWorkOrders}
              >
                Try Again
              </button>

            </div>

          )}


          {workOrdersLoading ? (

            <div className="booking-list">

              {[1, 2].map(
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

          ) : workOrdersError ? null : workOrders.length === 0 ? (

            <div className="advisor-empty">

              <div className="advisor-empty-icon">

                <ClipboardList
                  size={26}
                />

              </div>


              <h3>
                No work orders found
              </h3>


              <p>
                Work orders will appear
                here once they are created.
              </p>

            </div>

          ) : (

            <div className="booking-list">

              {workOrders.map((workOrder) => (

                <article
                  className="booking-card"
                  key={workOrder.id}
                >

                  <div className="booking-card-main">

                    <div className="booking-icon">

                      <ClipboardList
                        size={23}
                      />

                    </div>


                    <div className="booking-content">

                      <div className="booking-title-row">

                        <h2>
                          Work Order #{workOrder.id}
                        </h2>


                        <span
                          className={getWorkOrderStatusClass(
                            workOrder.status
                          )}
                        >

                          {workOrder.status ||
                            "UNKNOWN"}

                        </span>

                      </div>


                      <div className="booking-meta">

                        <div>

                          <CalendarDays
                            size={14}
                          />

                          Booking #{workOrder.booking_id}

                        </div>


                        <div>

                          <Car
                            size={14}
                          />

                          Vehicle #{workOrder.vehicle_id}

                        </div>


                        <div>

                          <Wrench
                            size={14}
                          />

                          Mechanic {workOrder.assigned_mechanic_id
                            ? `#${workOrder.assigned_mechanic_id}`
                            : "Not assigned"}

                        </div>

                      </div>


                      {workOrder.complaint && (

                        <p className="booking-notes">

                          <BookOpen
                            size={13}
                          />

                          {workOrder.complaint}

                        </p>

                      )}

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </div>

      </div>


      {/* =================================================
          CREATE WORK ORDER MODAL
      ================================================= */}

      {modalBooking && (

        <div
          className="modal-overlay"
          onClick={closeCreateModal}
        >

          <div
            className="modal-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  Create Work Order
                </h2>

                <p>
                  Booking #{modalBooking.id}
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={closeCreateModal}
                disabled={creating}
                aria-label="Close"
              >

                <X
                  size={18}
                />

              </button>

            </div>


            <div className="modal-body">

              {createError && (

                <div className="advisor-error">

                  <AlertCircle
                    size={16}
                  />

                  <span>
                    {createError}
                  </span>

                </div>

              )}


              <div className="modal-field">

                <label>
                  Booking ID
                </label>

                <input
                  type="text"
                  value={modalBooking.id}
                  readOnly
                  disabled
                />

              </div>


              <div className="modal-field">

                <label>
                  Vehicle ID
                </label>

                <input
                  type="text"
                  value={modalBooking.vehicle_id}
                  readOnly
                  disabled
                />

              </div>


              <div className="modal-field">

                <label>
                  Complaint
                </label>

                <textarea
                  rows={3}
                  value={complaint}
                  onChange={(e) =>
                    setComplaint(
                      e.target.value
                    )
                  }
                  placeholder="Optional — describe the issue"
                  disabled={creating}
                />

              </div>


              <div className="modal-field">

                <label>
                  Mechanic ID (optional)
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={mechanicId}
                  onChange={(e) =>
                    setMechanicId(
                      e.target.value
                    )
                  }
                  placeholder="Optional — numeric mechanic ID"
                  disabled={creating}
                />

              </div>

            </div>


            <div className="modal-actions">

              <button
                type="button"
                className="secondary-action"
                onClick={closeCreateModal}
                disabled={creating}
              >

                Cancel

              </button>


              <button
                type="button"
                className="primary-action"
                onClick={handleCreateWorkOrder}
                disabled={creating}
              >

                {creating ? (
                  <LoaderCircle
                    size={17}
                    className="spin"
                  />
                ) : (
                  <Plus
                    size={17}
                  />
                )}

                {creating
                  ? "Creating..."
                  : "Create Work Order"}

              </button>

            </div>

          </div>

        </div>

      )}

    </AppLayout>
  );
}
