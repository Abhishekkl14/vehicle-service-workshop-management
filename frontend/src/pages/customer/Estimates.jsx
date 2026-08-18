import { useEffect, useState } from "react";

import {
  CalendarDays,
  Clock3,
  Wrench,
  FileText,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";

import {
  getCustomerEstimates,
} from "../../api/estimateApi";
import AnimatedButton from "../../components/ui/animated-button";


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


const formatDuration = (minutes) => {
  if (
    minutes === null ||
    minutes === undefined ||
    minutes === ""
  ) {
    return "—";
  }

  const mins = Number(minutes);

  if (Number.isNaN(mins)) {
    return "—";
  }

  if (mins <= 0) {
    return "0 minutes";
  }

  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;

  if (hours === 0) {
    return `${remainder} minute${
      remainder === 1 ? "" : "s"
    }`;
  }

  if (remainder === 0) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    }`;
  }

  return `${hours} hour${
    hours === 1 ? "" : "s"
  } ${remainder} minute${
    remainder === 1 ? "" : "s"
  }`;
};


const getStatusClass = (status) => {
  const s = String(
    status || ""
  ).toUpperCase();

  if (s === "APPROVED") {
    return "booking-status confirmed";
  }

  if (s === "REJECTED") {
    return "booking-status cancelled";
  }

  return "booking-status pending";
};


export default function Estimates() {

  const navigate = useNavigate();


  const [estimates, setEstimates] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =====================================================
     LOAD ESTIMATES
  ===================================================== */

  const loadEstimates = async () => {

    try {

      setLoading(true);

      setError("");


      const data =
        await getCustomerEstimates();


      setEstimates(
        Array.isArray(data)
          ? data
          : data?.items || []
      );

    } catch (err) {

      console.error(
        "Failed to load estimates:",
        err
      );


      setError(
        err?.response?.data?.detail ||
          "Unable to load your estimates. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadEstimates();

  }, []);


  /* =====================================================
     VIEW ESTIMATE
  ===================================================== */

  const handleViewEstimate = (
    estimateId
  ) => {

    navigate(
      `/customer/estimates/${estimateId}`
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
              ESTIMATES
            </p>


            <h1>
              My Estimates
            </h1>


            <p>
              Review estimates sent to you
              by the workshop and approve
              them to move work forward.
            </p>

          </div>


          <div className="bookings-actions">

            <AnimatedButton
              type="button"
              className="secondary-action"
              onClick={loadEstimates}
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

            </AnimatedButton>

          </div>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="bookings-error">

            <div>

              <strong>
                Unable to load estimates
              </strong>


              <p>
                {error}
              </p>

            </div>


            <AnimatedButton
              type="button"
              onClick={loadEstimates}
            >
              Try again
            </AnimatedButton>

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
          estimates.length === 0 && (

            <div className="bookings-empty">

              <div className="empty-booking-icon">

                <FileText
                  size={30}
                />

              </div>


              <h2>
                No estimates yet
              </h2>


              <p>
                When the workshop sends you
                an estimate, it will appear
                here for review and approval.
              </p>

            </div>

          )}


        {/* =================================================
            ESTIMATE LIST
        ================================================= */}

        {!loading &&
          !error &&
          estimates.length > 0 && (

            <div className="booking-list">

              {estimates.map(
                (estimate) => (

                  <article
                    className="booking-card"
                    key={estimate.id}
                  >

                    <div className="booking-card-main">


                      <div className="booking-icon">

                        <FileText
                          size={23}
                        />

                      </div>


                      <div className="booking-content">


                        <div className="booking-title-row">

                          <h2>
                            Estimate #
                            {estimate.id}
                          </h2>


                          <span
                            className={getStatusClass(
                              estimate.status
                            )}
                          >

                            {estimate.status ||
                              "DRAFT"}

                          </span>

                        </div>


                        <div className="booking-vehicle">

                          <Wrench
                            size={15}
                          />


                          <span>
                            Work Order #
                            {estimate.work_order_id}
                          </span>

                        </div>


                        <div className="estimate-list-totals">

                          <div className="estimate-list-field">

                            <span>
                              Subtotal
                            </span>

                            <strong>
                              {formatCurrency(
                                estimate.subtotal
                              )}
                            </strong>

                          </div>


                          <div className="estimate-list-field">

                            <span>
                              Tax
                            </span>

                            <strong>
                              {formatCurrency(
                                estimate.tax_amount
                              )}
                            </strong>

                          </div>


                          <div className="estimate-list-field">

                            <span>
                              Discount
                            </span>

                            <strong>
                              {formatCurrency(
                                estimate.discount_amount
                              )}
                            </strong>

                          </div>


                          <div className="estimate-list-field estimate-list-total">

                            <span>
                              Total Amount
                            </span>

                            <strong>
                              {formatCurrency(
                                estimate.total_amount
                              )}
                            </strong>

                          </div>

                        </div>


                        <div className="booking-meta">

                          <div>

                            <CalendarDays
                              size={14}
                            />

                            <span>
                              Created:{" "}
                              {formatDate(
                                estimate.created_at
                              )}
                            </span>

                          </div>


                          <div>

                            <Clock3
                              size={14}
                            />

                            <span>
                              {formatDuration(
                                estimate.estimated_duration_minutes
                              )}
                            </span>

                          </div>


                          <div>

                            <CalendarDays
                              size={14}
                            />

                            <span>
                              Sent:{" "}
                              {formatDate(
                                estimate.sent_at
                              )}
                            </span>

                          </div>


                          <div>

                            <CalendarDays
                              size={14}
                            />

                            <span>
                              Expires:{" "}
                              {formatDate(
                                estimate.expires_at
                              )}
                            </span>

                          </div>

                        </div>

                      </div>


                      {/* =================================================
                          VIEW ESTIMATE
                      ================================================= */}

                      <AnimatedButton
                        type="button"
                        className="booking-view-button"
                        onClick={() =>
                          handleViewEstimate(
                            estimate.id
                          )
                        }
                      >

                        View

                        <ChevronRight
                          size={16}
                        />

                      </AnimatedButton>

                    </div>

                  </article>
                )
              )}

            </div>

          )}

      </div>

    </AppLayout>

  );

}
