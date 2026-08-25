import { useEffect, useState } from "react";

import {
  RefreshCw,
  Stethoscope,
  ChevronRight,
  ClipboardList,
  CalendarDays,
  LoaderCircle,
  AlertCircle,
  SearchCheck,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
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


export default function MechanicInspections() {

  const navigate = useNavigate();

  const { user } = useAuth();


  const [inspections, setInspections] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const mechanicId =
    user?.mechanic_id ??
    user?.mechanic?.id ??
    user?.id;


  /* =====================================================
     LOAD INSPECTIONS
  ===================================================== */

  const loadInspections = async () => {

    try {

      setLoading(true);

      setError("");


      const statusesToFetch = [
        "CREATED",
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


      const mechanicWorkOrders =
        mechanicId
          ? allWorkOrders.filter(
              (wo) =>
                Number(
                  wo.assigned_mechanic_id
                ) === Number(mechanicId)
            )
          : allWorkOrders;


      const inspectionResults =
        await Promise.allSettled(
          mechanicWorkOrders.map(
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

  }, [mechanicId]);


  /* =====================================================
     VIEW
  ===================================================== */

  const handleView = (inspectionId) => {

    navigate(
      `/mechanic/inspections/${inspectionId}`
    );

  };


  return (
    <AppLayout>

      <div className="history-page mechanic-inspections-scope">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="history-header">

          <div>

            <p className="page-eyebrow">
              MECHANIC INSPECTIONS
            </p>


            <h1>
              My Inspections
            </h1>


            <p>
              Inspections you have
              completed or are in progress.
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
                You have no inspections
                recorded yet.
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
                        onClick={() => handleView(inspection.id)}
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
