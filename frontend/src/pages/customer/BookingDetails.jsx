import { useEffect, useState } from "react";

import {
  ArrowLeft,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  Wrench,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";

import {
  getBooking,
} from "../../api/bookingApi";

import {
  getVehicle,
} from "../../api/vehicleApi";

import {
  getService,
} from "../../api/serviceApi";
import AnimatedButton from "../../components/ui/animated-button";


export default function BookingDetails() {

  const navigate = useNavigate();

  const { bookingId } = useParams();


  const [booking, setBooking] =
    useState(null);

  const [vehicle, setVehicle] =
    useState(null);

  const [service, setService] =
    useState(null);


  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =====================================================
     LOAD BOOKING DETAILS
  ===================================================== */

  useEffect(() => {

    const loadDetails = async () => {

      if (!bookingId) {

        setError(
          "Booking ID is missing."
        );

        setLoading(false);

        return;
      }


      try {

        setLoading(true);

        setError("");


        const bookingData =
          await getBooking(
            bookingId
          );


        setBooking(
          bookingData
        );


        /* -----------------------------------------------
           Load vehicle and service in parallel
        ----------------------------------------------- */

        const [
          vehicleData,
          serviceData,
        ] = await Promise.all([

          getVehicle(
            bookingData.vehicle_id
          ),

          getService(
            bookingData.service_id
          ),

        ]);


        setVehicle(
          vehicleData
        );

        setService(
          serviceData
        );


      } catch (err) {

        console.error(
          "Failed to load booking details:",
          err
        );


        setError(
          err?.response?.data?.detail ||
            "Unable to load booking details."
        );

      } finally {

        setLoading(false);

      }

    };


    loadDetails();

  }, [bookingId]);


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
        weekday: "long",
        day: "numeric",
        month: "long",
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
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <AppLayout>

        <div className="booking-details-loading">

          <LoaderCircle
            size={30}
            className="spin"
          />

          <p>
            Loading booking details...
          </p>

        </div>

      </AppLayout>

    );

  }


  /* =====================================================
     ERROR
  ===================================================== */

  if (error || !booking) {

    return (

      <AppLayout>

        <div className="booking-details-error">

          <div className="booking-details-error-icon">

            <FileText
              size={28}
            />

          </div>


          <h1>
            Booking not found
          </h1>


          <p>
            {error ||
              "We couldn't find this booking."}
          </p>


          <AnimatedButton
            className="primary-action"
            onClick={() =>
              navigate(
                "/customer/bookings"
              )
            }
          >

            <ArrowLeft
              size={17}
            />

            Back to bookings

          </AnimatedButton>

        </div>

      </AppLayout>

    );

  }


  return (

    <AppLayout>

      <div className="booking-details-page">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="booking-details-header">

          <AnimatedButton
            className="back-button"
            onClick={() =>
              navigate(
                "/customer/bookings"
              )
            }
          >

            <ArrowLeft
              size={17}
            />

            Back to bookings

          </AnimatedButton>


          <div className="booking-details-title-row">

            <div>

              <p className="page-eyebrow">
                BOOKING
              </p>


              <h1>
                Booking #{booking.id}
              </h1>

            </div>


            <span
              className={getStatusClass(
                booking.status
              )}
            >

              {booking.status ||
                "PENDING"}

            </span>

          </div>

        </div>


        {/* =================================================
            STATUS TIMELINE
        ================================================= */}

        <section className="booking-timeline-card">

          <div className="booking-timeline-item active">

            <div className="timeline-icon">

              <CheckCircle2
                size={17}
              />

            </div>


            <div>

              <strong>
                Booking Created
              </strong>

              <span>
                Your service request
                has been received.
              </span>

            </div>

          </div>


          <div className="timeline-line" />


          <div
            className={
              booking.status === "CONFIRMED"
                ? "booking-timeline-item active"
                : "booking-timeline-item"
            }
          >

            <div className="timeline-icon">

              <CheckCircle2
                size={17}
              />

            </div>


            <div>

              <strong>
                Confirmed
              </strong>

              <span>
                Workshop confirmation.
              </span>

            </div>

          </div>


          <div className="timeline-line" />


          <div
            className={
              booking.status === "COMPLETED"
                ? "booking-timeline-item active"
                : "booking-timeline-item"
            }
          >

            <div className="timeline-icon">

              <CheckCircle2
                size={17}
              />

            </div>


            <div>

              <strong>
                Completed
              </strong>

              <span>
                Service completed.
              </span>

            </div>

          </div>

        </section>


        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="booking-details-grid">


          {/* VEHICLE */}

          <section className="booking-details-card">

            <div className="details-card-header">

              <div className="details-card-icon">

                <Car
                  size={18}
                />

              </div>


              <div>

                <h2>
                  Vehicle
                </h2>

                <p>
                  Vehicle linked to this
                  booking.
                </p>

              </div>

            </div>


            {vehicle ? (

              <div className="vehicle-detail-content">

                <h3>

                  {vehicle.make}{" "}
                  {vehicle.model}

                </h3>


                <div className="vehicle-registration">

                  {vehicle.registration_number}

                </div>


                <div className="vehicle-detail-grid">

                  <div>

                    <span>
                      VIN
                    </span>

                    <strong>
                      {vehicle.vin ||
                        "—"}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Year
                    </span>

                    <strong>
                      {vehicle.manufacturing_year ||
                        "—"}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Color
                    </span>

                    <strong>
                      {vehicle.color ||
                        "—"}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Mileage
                    </span>

                    <strong>
                      {vehicle.mileage
                        ? `${vehicle.mileage.toLocaleString(
                            "en-IN"
                          )} km`
                        : "—"}
                    </strong>

                  </div>

                </div>

              </div>

            ) : (

              <p className="details-unavailable">
                Vehicle information unavailable.
              </p>

            )}

          </section>


          {/* SERVICE */}

          <section className="booking-details-card">

            <div className="details-card-header">

              <div className="details-card-icon">

                <Wrench
                  size={18}
                />

              </div>


              <div>

                <h2>
                  Service
                </h2>

                <p>
                  Service requested for
                  this booking.
                </p>

              </div>

            </div>


            {service ? (

              <div className="service-detail-content">

                <h3>
                  {service.name}
                </h3>


                <p>
                  {service.description ||
                    "Workshop service"}
                </p>


                <div className="service-detail-meta">

                  <div>

                    <span>
                      Price
                    </span>

                    <strong>
                      ₹
                      {Number(
                        service.base_price
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Duration
                    </span>

                    <strong>
                      {
                        service.estimated_duration_minutes
                      }{" "}
                      min
                    </strong>

                  </div>

                </div>

              </div>

            ) : (

              <p className="details-unavailable">
                Service information unavailable.
              </p>

            )}

          </section>


          {/* APPOINTMENT */}

          <section className="booking-details-card">

            <div className="details-card-header">

              <div className="details-card-icon">

                <CalendarDays
                  size={18}
                />

              </div>


              <div>

                <h2>
                  Appointment
                </h2>

                <p>
                  Scheduled workshop visit.
                </p>

              </div>

            </div>


            <div className="appointment-details">

              <div>

                <CalendarDays
                  size={18}
                />

                <div>

                  <span>
                    Date
                  </span>

                  <strong>
                    {formatDate(
                      booking.booking_date
                    )}
                  </strong>

                </div>

              </div>


              <div>

                <Clock3
                  size={18}
                />

                <div>

                  <span>
                    Time
                  </span>

                  <strong>
                    {formatTime(
                      booking.booking_time
                    )}
                  </strong>

                </div>

              </div>

            </div>

          </section>


          {/* NOTES */}

          <section className="booking-details-card">

            <div className="details-card-header">

              <div className="details-card-icon">

                <FileText
                  size={18}
                />

              </div>


              <div>

                <h2>
                  Customer Notes
                </h2>

                <p>
                  Additional information
                  provided with the booking.
                </p>

              </div>

            </div>


            <div className="booking-notes-detail">

              {booking.customer_notes ? (

                <p>
                  {booking.customer_notes}
                </p>

              ) : (

                <p className="no-notes">
                  No additional notes were
                  provided.
                </p>

              )}

            </div>

          </section>

        </div>


        {/* =================================================
            FOOTER ACTION
        ================================================= */}

        <div className="booking-details-footer">

          <AnimatedButton
            className="secondary-action"
            onClick={() =>
              navigate(
                "/customer/bookings"
              )
            }
          >

            <ArrowLeft
              size={16}
            />

            Back to My Bookings

          </AnimatedButton>

        </div>

      </div>

    </AppLayout>

  );

}