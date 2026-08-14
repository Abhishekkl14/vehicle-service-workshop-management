import { useEffect, useState } from "react";

import {
  CalendarDays,
  Clock3,
  Car,
  Wrench,
  RefreshCw,
  Plus,
  ChevronRight,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";

import {
  getCustomerBookings,
} from "../../api/bookingApi";

import {
  getCustomerVehicles,
} from "../../api/vehicleApi";


export default function Bookings() {

  const navigate = useNavigate();

  const { user } = useAuth();


  const [bookings, setBookings] =
    useState([]);

  const [vehicles, setVehicles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const customerId =
    user?.customer_id ??
    user?.customer?.id;


  /* =====================================================
     LOAD BOOKINGS
  ===================================================== */

  const loadBookings = async () => {

    if (!customerId) {

      setLoading(false);

      setError(
        "Customer information is not available for this account."
      );

      return;
    }


    try {

      setLoading(true);

      setError("");


      const [
        bookingData,
        vehicleData,
      ] = await Promise.all([

        getCustomerBookings(
          customerId
        ),

        getCustomerVehicles(
          customerId
        ),

      ]);


      setBookings(
        Array.isArray(bookingData)
          ? bookingData
          : bookingData?.items || []
      );


      setVehicles(
        Array.isArray(vehicleData)
          ? vehicleData
          : vehicleData?.items || []
      );

    } catch (err) {

      console.error(
        "Failed to load bookings:",
        err
      );


      setError(
        err?.response?.data?.detail ||
          "Unable to load your bookings. Please try again."
      );

    } finally {

      setLoading(false);

    }

  };


  /* =====================================================
     LOAD ON PAGE OPEN
  ===================================================== */

  useEffect(() => {

    loadBookings();

  }, [customerId]);


  /* =====================================================
     GET VEHICLE
  ===================================================== */

  const getVehicle = (
    vehicleId
  ) => {

    return vehicles.find(
      (vehicle) =>
        vehicle.id === vehicleId
    );

  };


  /* =====================================================
     STATUS CLASS
  ===================================================== */

  const getStatusClass = (
    status
  ) => {

    const normalized =
      String(status || "")
        .toUpperCase();


    if (
      normalized === "CONFIRMED" ||
      normalized === "APPROVED"
    ) {

      return "booking-status confirmed";

    }


    if (
      normalized === "COMPLETED"
    ) {

      return "booking-status completed";

    }


    if (
      normalized === "CANCELLED" ||
      normalized === "REJECTED"
    ) {

      return "booking-status cancelled";

    }


    return "booking-status pending";

  };


  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (
    date
  ) => {

    if (!date) {
      return "—";
    }


    const parsed =
      new Date(
        `${date}T00:00:00`
      );


    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {

      return date;

    }


    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );

  };


  /* =====================================================
     FORMAT TIME
  ===================================================== */

  const formatTime = (
    time
  ) => {

    if (!time) {
      return "—";
    }


    const parts =
      String(time).split(":");


    if (parts.length < 2) {
      return time;
    }


    const hours =
      Number(parts[0]);

    const minutes =
      Number(parts[1]);


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


  /* =====================================================
     SORT BOOKINGS
  ===================================================== */

  const sortedBookings = [
    ...bookings,
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


  /* =====================================================
     CREATE BOOKING
  ===================================================== */

  const handleCreateBooking = () => {

    navigate(
      "/customer/bookings/new"
    );

  };


  /* =====================================================
     VIEW BOOKING
  ===================================================== */

  const handleViewBooking = (
    bookingId
  ) => {

    navigate(
      `/customer/bookings/${bookingId}`
    );

  };


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <AppLayout>

      <div className="bookings-page">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="bookings-header">

          <div>

            <p className="page-eyebrow">
              BOOKINGS
            </p>


            <h1>
              My Bookings
            </h1>


            <p>
              Manage your workshop
              appointments and service
              bookings.
            </p>

          </div>


          <div className="bookings-actions">

            <button
              type="button"
              className="secondary-action"
              onClick={loadBookings}
              disabled={loading}
            >

              <RefreshCw
                size={16}
                className={
                  loading
                    ? "spin"
                    : ""
                }
              />

              Refresh

            </button>


            <button
              type="button"
              className="primary-action"
              onClick={
                handleCreateBooking
              }
            >

              <Plus
                size={17}
              />

              New Booking

            </button>

          </div>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="bookings-error">

            <div>

              <strong>
                Unable to load bookings
              </strong>


              <p>
                {error}
              </p>

            </div>


            <button
              type="button"
              onClick={loadBookings}
            >
              Try again
            </button>

          </div>

        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && !error && (

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

        )}


        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {!loading &&
          !error &&
          bookings.length === 0 && (

            <div className="bookings-empty">

              <div className="empty-booking-icon">

                <CalendarDays
                  size={30}
                />

              </div>


              <h2>
                No bookings yet
              </h2>


              <p>
                You don't have any workshop
                appointments yet.
              </p>


              <button
                type="button"
                className="primary-action"
                onClick={
                  handleCreateBooking
                }
              >

                <Plus
                  size={17}
                />

                Create your first booking

              </button>

            </div>

          )}


        {/* =================================================
            BOOKING LIST
        ================================================= */}

        {!loading &&
          !error &&
          bookings.length > 0 && (

            <div className="booking-list">

              {sortedBookings.map(
                (booking) => {

                  const vehicle =
                    getVehicle(
                      booking.vehicle_id
                    );


                  const vehicleName =
                    vehicle
                      ? `${vehicle.make || ""} ${
                          vehicle.model || ""
                        }`.trim()
                      : `Vehicle #${booking.vehicle_id}`;


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
                              Booking #
                              {booking.id}
                            </h2>


                            <span
                              className={getStatusClass(
                                booking.status
                              )}
                            >

                              {booking.status ||
                                "PENDING"}

                            </span>

                          </div>


                          <div className="booking-vehicle">

                            <Car
                              size={15}
                            />


                            <span>
                              {vehicleName}
                            </span>


                            {vehicle
                              ?.registration_number && (

                              <>

                                <span>
                                  •
                                </span>


                                <span>
                                  {
                                    vehicle.registration_number
                                  }
                                </span>

                              </>

                            )}

                          </div>


                          <div className="booking-meta">

                            <div>

                              <CalendarDays
                                size={14}
                              />


                              <span>
                                {formatDate(
                                  booking.booking_date
                                )}
                              </span>

                            </div>


                            <div>

                              <Clock3
                                size={14}
                              />


                              <span>
                                {formatTime(
                                  booking.booking_time
                                )}
                              </span>

                            </div>


                            <div>

                              <Wrench
                                size={14}
                              />


                              <span>
                                Service #
                                {
                                  booking.service_id
                                }
                              </span>

                            </div>

                          </div>


                          {booking.customer_notes && (

                            <p className="booking-notes">

                              {booking.customer_notes}

                            </p>

                          )}

                        </div>


                        {/* =================================================
                            VIEW BOOKING
                        ================================================= */}

                        <button
                          type="button"
                          className="booking-view-button"
                          onClick={() =>
                            handleViewBooking(
                              booking.id
                            )
                          }
                        >

                          View

                          <ChevronRight
                            size={16}
                          />

                        </button>


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