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
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";

import {
  getCustomerVehicles,
} from "../../api/vehicleApi";

import {
  getActiveServices,
} from "../../api/serviceApi";

import {
  createBooking,
} from "../../api/bookingApi";


export default function CreateBooking() {

  const navigate = useNavigate();

  const { user } = useAuth();

  const customerId =
    user?.customer_id ??
    user?.customer?.id;


  const [vehicles, setVehicles] =
    useState([]);

  const [services, setServices] =
    useState([]);


  const [vehicleId, setVehicleId] =
    useState("");

  const [serviceId, setServiceId] =
    useState("");

  const [bookingDate, setBookingDate] =
    useState("");

  const [bookingTime, setBookingTime] =
    useState("");

  const [customerNotes, setCustomerNotes] =
    useState("");


  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);


  /* =====================================================
     LOAD VEHICLES + SERVICES
  ===================================================== */

  useEffect(() => {

    const loadData = async () => {

      if (!customerId) {

        setError(
          "Customer information is not available."
        );

        setLoading(false);

        return;
      }


      try {

        setLoading(true);

        setError("");


        const [
          vehicleData,
          serviceData,
        ] = await Promise.all([

          getCustomerVehicles(
            customerId
          ),

          getActiveServices(),

        ]);


        const vehicleList =
          Array.isArray(vehicleData)
            ? vehicleData
            : vehicleData?.items || [];


        const serviceList =
          Array.isArray(serviceData)
            ? serviceData
            : serviceData?.items || [];


        setVehicles(vehicleList);

        setServices(serviceList);


        if (vehicleList.length === 1) {
          setVehicleId(
            String(vehicleList[0].id)
          );
        }

      } catch (err) {

        console.error(
          "Failed to load booking data:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            "Unable to load booking information."
        );

      } finally {

        setLoading(false);

      }

    };


    loadData();

  }, [customerId]);


  /* =====================================================
     SELECTED SERVICE
  ===================================================== */

  const selectedService =
    services.find(
      (service) =>
        String(service.id) ===
        String(serviceId)
    );


  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const today =
    new Date()
      .toISOString()
      .split("T")[0];


  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError("");


    if (!customerId) {

      setError(
        "Customer information is not available."
      );

      return;
    }


    if (!vehicleId) {

      setError(
        "Please select a vehicle."
      );

      return;
    }


    if (!serviceId) {

      setError(
        "Please select a service."
      );

      return;
    }


    if (!bookingDate) {

      setError(
        "Please select a booking date."
      );

      return;
    }


    if (!bookingTime) {

      setError(
        "Please select a booking time."
      );

      return;
    }


    try {

      setSubmitting(true);


      await createBooking({

        customer_id:
          Number(customerId),

        vehicle_id:
          Number(vehicleId),

        service_id:
          Number(serviceId),

        booking_date:
          bookingDate,

        booking_time:
          `${bookingTime}:00`,

        customer_notes:
          customerNotes.trim() ||
          null,

      });


      setSuccess(true);


      setTimeout(() => {

        navigate(
          "/customer/bookings"
        );

      }, 1200);


    } catch (err) {

      console.error(
        "Failed to create booking:",
        err
      );


      setError(
        err?.response?.data?.detail ||
          "Unable to create booking. Please try again."
      );

    } finally {

      setSubmitting(false);

    }

  };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <AppLayout>

        <div className="create-booking-page">

          <div className="booking-form-loading">

            <LoaderCircle
              size={28}
              className="spin"
            />

            <p>
              Loading booking options...
            </p>

          </div>

        </div>

      </AppLayout>

    );

  }


  /* =====================================================
     SUCCESS
  ===================================================== */

  if (success) {

    return (

      <AppLayout>

        <div className="booking-success">

          <div className="booking-success-icon">

            <CheckCircle2
              size={38}
            />

          </div>


          <h1>
            Booking created
          </h1>


          <p>
            Your service booking has
            been created successfully.
          </p>


          <span>
            Redirecting to your bookings...
          </span>

        </div>

      </AppLayout>

    );

  }


  return (

    <AppLayout>

      <div className="create-booking-page">


        {/* =================================================
           HEADER
        ================================================= */}

        <div className="create-booking-header">

          <button
            className="back-button"
            onClick={() =>
              navigate(
                "/customer/bookings"
              )
            }
          >

            <ArrowLeft size={17} />

            Back to bookings

          </button>


          <p className="page-eyebrow">
            BOOKINGS
          </p>


          <h1>
            New Booking
          </h1>


          <p>
            Schedule your vehicle for
            workshop service.
          </p>

        </div>


        {/* =================================================
           ERROR
        ================================================= */}

        {error && (

          <div className="create-booking-error">

            <strong>
              Unable to create booking
            </strong>

            <p>
              {error}
            </p>

          </div>

        )}


        {/* =================================================
           FORM
        ================================================= */}

        <form
          className="booking-form"
          onSubmit={handleSubmit}
        >


          {/* VEHICLE */}

          <section className="booking-form-section">

            <div className="booking-form-section-header">

              <div className="booking-form-section-icon">

                <Car size={18} />

              </div>


              <div>

                <h2>
                  Select vehicle
                </h2>

                <p>
                  Choose the vehicle you
                  want to service.
                </p>

              </div>

            </div>


            <label
              htmlFor="vehicle"
            >
              Vehicle
            </label>


            <select
              id="vehicle"
              value={vehicleId}
              onChange={(event) =>
                setVehicleId(
                  event.target.value
                )
              }
              required
            >

              <option value="">
                Select your vehicle
              </option>


              {vehicles.map(
                (vehicle) => (

                  <option
                    key={vehicle.id}
                    value={vehicle.id}
                  >

                    {vehicle.make}{" "}
                    {vehicle.model}
                    {" — "}
                    {
                      vehicle.registration_number
                    }

                  </option>

                )
              )}

            </select>


            {vehicles.length === 0 && (

              <p className="field-help">

                No vehicles are registered
                with your account.

              </p>

            )}

          </section>


          {/* SERVICE */}

          <section className="booking-form-section">

            <div className="booking-form-section-header">

              <div className="booking-form-section-icon">

                <Wrench size={18} />

              </div>


              <div>

                <h2>
                  Select service
                </h2>

                <p>
                  Choose the workshop service
                  you need.
                </p>

              </div>

            </div>


            <label
              htmlFor="service"
            >
              Service
            </label>


            <select
              id="service"
              value={serviceId}
              onChange={(event) =>
                setServiceId(
                  event.target.value
                )
              }
              required
            >

              <option value="">
                Select a service
              </option>


              {services.map(
                (service) => (

                  <option
                    key={service.id}
                    value={service.id}
                  >

                    {service.name}
                    {" — ₹"}
                    {Number(
                      service.base_price
                    ).toLocaleString(
                      "en-IN"
                    )}

                  </option>

                )
              )}

            </select>


            {selectedService && (

              <div className="selected-service">

                <div>

                  <strong>
                    {selectedService.name}
                  </strong>

                  <p>
                    {
                      selectedService.description
                    }
                  </p>

                </div>


                <div className="selected-service-meta">

                  <span>

                    ₹
                    {Number(
                      selectedService.base_price
                    ).toLocaleString(
                      "en-IN"
                    )}

                  </span>


                  <span>

                    <Clock3
                      size={13}
                    />

                    {
                      selectedService
                        .estimated_duration_minutes
                    }{" "}
                    min

                  </span>

                </div>

              </div>

            )}

          </section>


          {/* DATE / TIME */}

          <section className="booking-form-section">

            <div className="booking-form-section-header">

              <div className="booking-form-section-icon">

                <CalendarDays size={18} />

              </div>


              <div>

                <h2>
                  Appointment
                </h2>

                <p>
                  Select your preferred
                  date and time.
                </p>

              </div>

            </div>


            <div className="booking-date-time-grid">

              <div>

                <label
                  htmlFor="bookingDate"
                >
                  Date
                </label>


                <div className="booking-input-icon">

                  <CalendarDays
                    size={17}
                  />


                  <input
                    id="bookingDate"
                    type="date"
                    min={today}
                    value={bookingDate}
                    onChange={(event) =>
                      setBookingDate(
                        event.target.value
                      )
                    }
                    required
                  />

                </div>

              </div>


              <div>

                <label
                  htmlFor="bookingTime"
                >
                  Time
                </label>


                <div className="booking-input-icon">

                  <Clock3
                    size={17}
                  />


                  <input
                    id="bookingTime"
                    type="time"
                    value={bookingTime}
                    onChange={(event) =>
                      setBookingTime(
                        event.target.value
                      )
                    }
                    required
                  />

                </div>

              </div>

            </div>

          </section>


          {/* NOTES */}

          <section className="booking-form-section">

            <div className="booking-form-section-header">

              <div className="booking-form-section-icon">

                <FileText size={18} />

              </div>


              <div>

                <h2>
                  Additional notes
                </h2>

                <p>
                  Tell the workshop anything
                  they should know.
                </p>

              </div>

            </div>


            <label
              htmlFor="notes"
            >
              Customer notes
            </label>


            <textarea
              id="notes"
              rows="5"
              maxLength="1000"
              value={customerNotes}
              placeholder="Example: Please check the front brakes and AC."
              onChange={(event) =>
                setCustomerNotes(
                  event.target.value
                )
              }
            />


            <div className="character-count">

              {customerNotes.length}
              /1000

            </div>

          </section>


          {/* ACTIONS */}

          <div className="booking-form-actions">

            <button
              type="button"
              className="secondary-action"
              onClick={() =>
                navigate(
                  "/customer/bookings"
                )
              }
              disabled={submitting}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="primary-action"
              disabled={
                submitting ||
                vehicles.length === 0 ||
                services.length === 0
              }
            >

              {submitting ? (

                <>
                  <LoaderCircle
                    size={17}
                    className="spin"
                  />

                  Creating...

                </>

              ) : (

                <>
                  <CheckCircle2
                    size={17}
                  />

                  Create Booking

                </>

              )}

            </button>

          </div>

        </form>

      </div>

    </AppLayout>

  );

}