import { useEffect, useState } from "react";

import {
  CheckCircle2,
  ClipboardList,
  CalendarDays,
  Car,
  Wrench,
  RefreshCw,
  AlertCircle,
  Clock3,
  ChevronRight,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";

import {
  getPendingApprovalWorkOrders,
} from "../../api/workOrderApi";
import AnimatedButton from "../../components/ui/animated-button";


const formatDateTime = (value) => {
  if (!value) {
    return "Not available";
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
      hour: "numeric",
      minute: "2-digit",
    }
  );
};


export default function AdvisorApprovals() {

  const navigate = useNavigate();


  const [approvals, setApprovals] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =====================================================
     LOAD PENDING APPROVALS
  ===================================================== */

  const loadApprovals = async () => {

    try {

      setLoading(true);

      setError("");


      const data =
        await getPendingApprovalWorkOrders();


      setApprovals(
        Array.isArray(data)
          ? data
          : data?.items || []
      );

    } catch (err) {

      console.error(
        "Failed to load pending approvals:",
        err
      );


      setError(
        err?.response?.data?.detail ||
          "Unable to load pending approvals."
      );

    } finally {

      setLoading(false);

    }

  };


  /* =====================================================
     LOAD ON MOUNT
  ===================================================== */

  useEffect(() => {

    loadApprovals();

  }, []);


  /* =====================================================
     NAVIGATE TO DASHBOARD
  ===================================================== */

  const handleViewDetails = () => {

    navigate(
      "/advisor/dashboard"
    );

  };


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <AppLayout>

      <div className="advisor-dashboard advisor-approvals-scope">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="advisor-header">

          <div>

            <p className="page-eyebrow">
              APPROVALS
            </p>


            <h1>
              Pending Approvals
            </h1>


            <p>
              Review work orders submitted
              by mechanics for your approval.
            </p>

          </div>


          <AnimatedButton
            type="button"
            className="secondary-action"
            onClick={loadApprovals}
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


        {/* =================================================
            ERROR
        ================================================= */}

        {error && !loading && (

          <div className="advisor-error">

            <AlertCircle
              size={16}
            />

            <span>
              {error}
            </span>

            <AnimatedButton
              type="button"
              onClick={loadApprovals}
            >
              Try Again
            </AnimatedButton>

          </div>

        )}


        {/* =================================================
            LOADING
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


        ) : error ? null : approvals.length === 0 ? (


          /* =================================================
              EMPTY STATE
          ================================================= */

          <div className="advisor-empty">

            <div className="advisor-empty-icon">

              <CheckCircle2
                size={26}
              />

            </div>


            <h3>
              No pending approvals
            </h3>


            <p>
              Work orders submitted by mechanics
              will appear here for your review.
            </p>

          </div>


        ) : (


          /* =================================================
              APPROVALS LIST
          ================================================= */

          <div className="booking-list">

            {approvals.map((wo) => (

              <article
                className="booking-card"
                key={wo.id}
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
                        Work Order #{wo.id}
                      </h2>


                      <span className="booking-status confirmed">

                        SUBMITTED FOR APPROVAL

                      </span>

                    </div>


                    <div className="booking-meta">

                      <div>

                        <Car
                          size={14}
                        />

                        Vehicle #{wo.vehicle_id}

                      </div>


                      <div>

                        <Wrench
                          size={14}
                        />

                        Mechanic #{wo.assigned_mechanic_id || "—"}


                      </div>


                      <div>

                        <Clock3
                          size={14}
                        />

                        Submitted {formatDateTime(
                          wo.submitted_at
                        )}

                      </div>

                    </div>


                    {wo.complaint && (

                      <p className="booking-notes">

                        {wo.complaint}

                      </p>

                    )}

                  </div>

                </div>


                <div className="advisor-card-footer">

                  <AnimatedButton
                    type="button"
                    className="primary-action"
                    onClick={handleViewDetails}
                  >

                    View Details

                    <ChevronRight
                      size={16}
                    />

                  </AnimatedButton>

                </div>

              </article>

            ))}

          </div>

        )}

      </div>

    </AppLayout>

  );

}
