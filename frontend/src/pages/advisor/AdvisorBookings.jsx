import { useEffect, useState } from "react";

import {
  CalendarDays,
  Clock3,
  Car,
  Wrench,
  RefreshCw,
  ClipboardList,
  User,
  Plus,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";

import {
  getBookingsByDate,
} from "../../api/bookingApi";

import {
  createWorkOrder,
} from "../../api/workOrderApi";


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

  if (
    Number.isNaN(date.getTime())
  ) {
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


export default function AdvisorBookings() {

  const navigate = useNavigate();


  const [selectedDate, setSelectedDate] =
    useState(todayStr());


  const [bookings, setBookings] =
    useState([]);

  const [bookingsLoading, setBookingsLoading] =
    useState(true);

  const [bookingsError, setBookingsError] =
    useState("");


  const [creatingId, setCreatingId] =
    useState(null);

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

      setCreateError("");


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
     INITIAL LOAD + DATE CHANGE
  ===================================================== */

  useEffect(() => {

    loadBookings();

  }, []);


  useEffect(() => {

    if (selectedDate) {

      loadBookings();

    }

  }, [selectedDate]);


  /* =====================================================
     CREATE WORK ORDER
  ===================================================== */

  const handleCreateWorkOrder = async (
    booking
  ) => {

    if (creatingId) {
      return;
    }

    try {

      setCreatingId(booking.id);

      setCreateError("");

      setSuccessMessage("");


      await createWorkOrder({
        booking_id: booking.id,
        vehicle_id: booking.vehicle_id,
        complaint: null,
        mechanic_id: null,
      });


      setSuccessMessage(
        `Work order created for Booking #${booking.id}.`
      );

      navigate("/advisor/work-orders");

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

      setCreatingId(null);

    }

  };


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <AppLayout>

      <div className="advisor-dashboard">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="advisor-header">

          <div>

            <p className="page-eyebrow">
              BOOKINGS
            </p>


            <h1>
              Today's Bookings
            </h1>


            <p>
              View bookings by date and
              create work orders for
              customers.
            </p>

          </div>


          <button
            type="button"
            className="secondary-action"
            onClick={loadBookings}
            disabled={bookingsLoading}
          >

            <RefreshCw
              size={16}
              className={
                bookingsLoading
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

            <span>
              {successMessage}
            </span>

          </div>

        )}


        {/* =================================================
            CREATE ERROR
        ================================================= */}

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


        {/* =================================================
            DATE FILTER
        ================================================= */}

        <div className="advisor-date-filter">

          <label htmlFor="advisor-bookings-date">
            Booking Date
          </label>

          <div className="advisor-date-controls">

            <div className="advisor-date-input">

              <CalendarDays
                size={16}
              />

              <input
                id="advisor-bookings-date"
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
            BOOKINGS ERROR
        ================================================= */}

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


        {/* =================================================
            BOOKINGS LOADING
        ================================================= */}

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


          /* =================================================
              EMPTY STATE
          ================================================= */

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
              date to view bookings.
            </p>

          </div>


        ) : (


          /* =================================================
              BOOKINGS LIST
          ================================================= */

          <div className="booking-list">

            {bookings.map((booking) => (

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

                        {booking.customer_notes}

                      </p>

                    )}

                  </div>

                </div>


                <div className="advisor-card-footer">

                  <button
                    type="button"
                    className="primary-action"
                    onClick={() =>
                      handleCreateWorkOrder(
                        booking
                      )
                    }
                    disabled={
                      creatingId !== null
                    }
                  >

                    {creatingId ===
                    booking.id ? (

                      <LoaderCircle
                        size={16}
                        className="spin"
                      />

                    ) : (

                      <ClipboardList
                        size={16}
                      />

                    )}

                    {creatingId ===
                    booking.id
                      ? "Creating..."
                      : "Create Work Order"}

                  </button>

                </div>

              </article>

            ))}

          </div>

        )}

      </div>

    </AppLayout>

  );

}
