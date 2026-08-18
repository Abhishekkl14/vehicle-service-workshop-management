import { useEffect, useState } from "react";

import {
  FileText,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  Wrench,
  CalendarDays,
} from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";

import {
  getWorkOrdersByStatus,
} from "../../api/workOrderApi";

import {
  getWorkOrderEstimates,
} from "../../api/estimateApi";
import AnimatedButton from "../../components/ui/animated-button";


const formatCurrency = (amount) => {
  if (
    amount === null ||
    amount === undefined ||
    amount === ""
  ) {
    return "\u2014";
  }

  const value = Number(amount);

  if (Number.isNaN(value)) {
    return "\u2014";
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
    return "\u2014";
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


export default function AdvisorEstimates() {

  const [estimates, setEstimates] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadEstimates = async () => {

    try {

      setLoading(true);
      setError("");

      const statuses = [
        "CREATED",
        "ASSIGNED",
        "INSPECTION",
        "IN_PROGRESS",
        "SUBMITTED_FOR_APPROVAL",
        "COMPLETED",
      ];

      const allWOs = [];

      for (const status of statuses) {

        try {

          const wos =
            await getWorkOrdersByStatus(
              status
            );

          allWOs.push(...wos);

        } catch {
          /* skip */
        }

      }

      const allEstimates = [];

      for (const wo of allWOs) {

        try {

          const estimates =
            await getWorkOrderEstimates(
              wo.id
            );

          if (
            Array.isArray(estimates)
          ) {

            for (const est of estimates) {

              allEstimates.push({
                ...est,
                workOrder: wo,
              });

            }

          }

        } catch {
          /* no estimates */
        }

      }

      setEstimates(allEstimates);

    } catch (err) {

      console.error(
        "Failed to load estimates:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load estimates. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadEstimates();

  }, []);


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
              Estimates
            </h1>

            <p>
              View and manage estimates
              for customer vehicles.
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

          <div className="notice-error">

            <AlertCircle
              size={16}
            />

            <span>
              {error}
            </span>

            <AnimatedButton
              type="button"
              onClick={loadEstimates}
            >
              Try Again
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
                When estimates are created,
                they will appear here for
                review.
              </p>

            </div>

        )}


        {/* =================================================
            ESTIMATE TABLE
        ================================================= */}

        {!loading &&
          !error &&
          estimates.length > 0 && (

            <div className="bookings-table-wrapper">

              <table className="bookings-table">

                <thead>

                  <tr>

                    <th>
                      ID
                    </th>

                    <th>
                      Work Order
                    </th>

                    <th>
                      Total
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Created At
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {estimates.map(
                    (estimate) => (

                      <tr
                        key={estimate.id}
                      >

                        <td>

                          <div className="table-id-cell">

                            <FileText
                              size={16}
                            />

                            <span>
                              #{estimate.id}
                            </span>

                          </div>

                        </td>

                        <td>

                          <div className="table-id-cell">

                            <Wrench
                              size={14}
                            />

                            <span>
                              #{estimate.work_order_id}
                            </span>

                          </div>

                        </td>

                        <td>

                          <strong>
                            {formatCurrency(
                              estimate.total_amount
                            )}
                          </strong>

                        </td>

                        <td>

                          <span
                            className={getStatusClass(
                              estimate.status
                            )}
                          >

                            {estimate.status ||
                              "DRAFT"}

                          </span>

                        </td>

                        <td>

                          <div className="table-date-cell">

                            <CalendarDays
                              size={14}
                            />

                            <span>
                              {formatDate(
                                estimate.created_at
                              )}
                            </span>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

        )}

      </div>

    </AppLayout>
  );

}
