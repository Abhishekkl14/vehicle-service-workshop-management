import { useEffect, useState } from "react";

import {
  RefreshCw,
  Stethoscope,
  ChevronRight,
  ClipboardList,
  CalendarDays,
  AlertCircle,
  SearchCheck,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";

import {
  getWorkOrdersByStatus,
} from "../../api/workOrderApi";

import {
  getInspectionByWorkOrderId,
} from "../../api/inspectionApi";
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


const getInspectionStatusClass = (
  status
) => {
  const s = String(
    status || ""
  ).toUpperCase();

  if (
    s === "COMPLETED" ||
    s === "IN_PROGRESS"
  ) {
    return "booking-status confirmed";
  }

  return "booking-status pending";
};


export default function CustomerInspections() {

  const navigate = useNavigate();


  const [inspections, setInspections] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =====================================================
     LOAD INSPECTIONS
  ===================================================== */

  const loadInspections = async () => {

    try {

      setLoading(true);

      setError("");


      const statusesToFetch = [
        "IN_PROGRESS",
        "SUBMITTED_FOR_APPROVAL",
        "COMPLETED",
      ];


      const allWorkOrders = [];

      const woResults = await Promise.all(
        statusesToFetch.map(
          (status) =>
            getWorkOrdersByStatus(status)
              .then(
                (data) =>
                  Array.isArray(data)
                    ? data
                    : data?.items || []
              )
              .catch(() => [])
        )
      );

      woResults.forEach(
        (items) =>
          allWorkOrders.push(...items)
      );


      const inspectionResults =
        await Promise.allSettled(
          allWorkOrders.map(
            (wo) =>
              getInspectionByWorkOrderId(
                wo.id
              ).then(
                (inspection) => ({
                  workOrder: wo,
                  inspection,
                })
              )
          )
        );


      const found = inspectionResults
        .filter(
          (result) =>
            result.status ===
            "fulfilled" &&
            result.value.inspection
        )
        .map(
          (result) =>
            result.value
        );

      setInspections(found);

    } catch (err) {

      console.error(
        "Failed to load inspections:",
        err
      );


      setError(
        err?.response?.data?.detail ||
          "Unable to load inspections. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadInspections();

  }, []);


  /* =====================================================
     VIEW INSPECTION
  ===================================================== */

  const handleView = (
    inspectionId
  ) => {

    navigate(
      `/customer/inspections/${inspectionId}`
    );

  };


  return (
    <AppLayout>

      <div className="history-page customer-inspections">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="history-header">

          <div>

            <p className="page-eyebrow">
              INSPECTIONS
            </p>


            <h1>
              My Inspections
            </h1>


            <p>
              Inspection reports for your
              vehicle work orders.
            </p>

          </div>


          <div className="history-actions">

            <AnimatedButton
              type="button"
              className="secondary-action"
              onClick={loadInspections}
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

          <div className="history-error">

            <div>

              <strong>
                Unable to load inspections
              </strong>


              <p>
                {error}
              </p>

            </div>


            <AnimatedButton
              type="button"
              onClick={loadInspections}
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
          inspections.length === 0 && (

            <div className="history-empty">

              <div className="history-empty-icon">

                <Stethoscope
                  size={30}
                />

              </div>


              <h2>
                No inspections found
              </h2>


              <p>
                Inspection reports for your
                work orders will appear
                here once available.
              </p>

            </div>

        )}


        {/* =================================================
            INSPECTION LIST
        ================================================= */}

        {!loading &&
          !error &&
          inspections.length > 0 && (

            <div className="booking-list">

              {inspections.map(
                ({ workOrder, inspection }) => (

                  <article
                    className="booking-card"
                    key={inspection.id}
                  >

                    <div className="booking-card-main">

                      <div className="booking-icon">

                        <Stethoscope
                          size={23}
                        />

                      </div>


                      <div className="booking-content">

                        <div className="booking-title-row">

                          <h2>
                            Inspection #{inspection.id}
                          </h2>


                          <span
                            className={getInspectionStatusClass(
                              inspection.status
                            )}
                          >

                            {inspection.status ||
                              "UNKNOWN"}

                          </span>

                        </div>


                        <div className="booking-meta">

                          <div>

                            <ClipboardList
                              size={14}
                            />

                            Work Order #{workOrder.id}

                          </div>


                          <div>

                            <CalendarDays
                              size={14}
                            />

                            {formatDate(
                              inspection.inspected_at
                            )}

                          </div>

                        </div>

                      </div>


                      <AnimatedButton
                        type="button"
                        className="booking-view-button"
                        onClick={() =>
                          handleView(
                            inspection.id
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
