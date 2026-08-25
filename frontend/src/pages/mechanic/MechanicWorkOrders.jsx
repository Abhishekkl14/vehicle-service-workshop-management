import {
  useEffect,
  useState,
} from "react";

import {
  RefreshCw,
  ClipboardList,
  ChevronRight,
  Car,
  CalendarDays,
  Clock3,
  LoaderCircle,
  AlertCircle,
  ListFilter,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";

import {
  getWorkOrdersByStatus,
  startWorkOrder,
  submitWorkOrderForApproval,
} from "../../api/workOrderApi";
import AnimatedButton from "../../components/ui/animated-button";


const TABS = [
  { label: "All", status: "ALL" },
  { label: "Assigned", status: "CREATED" },
  { label: "In Progress", status: "IN_PROGRESS" },
  { label: "Submitted", status: "SUBMITTED_FOR_APPROVAL" },
  { label: "Completed", status: "COMPLETED" },
];


const WORK_ORDER_STATUSES = [
  "CREATED",
  "INSPECTION",
  "IN_PROGRESS",
  "SUBMITTED_FOR_APPROVAL",
  "COMPLETED",
];


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


const getStatusClass = (
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

  if (
    s === "CANCELLED" ||
    s === "REJECTED"
  ) {
    return "booking-status cancelled";
  }

  return "booking-status pending";
};


export default function MechanicWorkOrders() {

  const navigate = useNavigate();

  const { user } = useAuth();


  const [activeTab, setActiveTab] =
    useState("ALL");

  const [workOrders, setWorkOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionId, setActionId] =
    useState(null);

  const [actionError, setActionError] =
    useState("");


  const mechanicId =
    user?.mechanic_id ??
    user?.mechanic?.id ??
    user?.id;


  /* =====================================================
     LOAD WORK ORDERS
  ===================================================== */

  const loadWorkOrders = async () => {

    try {

      setLoading(true);

      setError("");


      if (activeTab === "ALL") {

        const allResults = [];

        const statusesToFetch = [
          "CREATED",
          "IN_PROGRESS",
          "SUBMITTED_FOR_APPROVAL",
          "COMPLETED",
        ];

        const results = await Promise.all(
          statusesToFetch.map(
            (status) =>
              getWorkOrdersByStatus(
                status
              )
                .then(
                  (data) =>
                    Array.isArray(data)
                      ? data
                      : data?.items || []
                )
                .catch(() => [])
          )
        );

        results.forEach(
          (items) =>
            allResults.push(...items)
        );

        setWorkOrders(allResults);

      } else {

        const data =
          await getWorkOrdersByStatus(
            activeTab
          );

        setWorkOrders(
          Array.isArray(data)
            ? data
            : data?.items || []
        );

      }

    } catch (err) {

      console.error(
        "Failed to load work orders:",
        err
      );


      setError(
        err?.response?.data?.detail ||
          "Unable to load work orders. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadWorkOrders();

  }, [activeTab]);


  /* =====================================================
     FILTER BY MECHANIC
  ===================================================== */

  const filteredWorkOrders =
    mechanicId
      ? workOrders.filter(
          (wo) =>
            Number(
              wo.assigned_mechanic_id
            ) === Number(mechanicId)
        )
      : workOrders;


  /* =====================================================
     START WORK
  ===================================================== */

  const handleStart = async (
    woId
  ) => {

    if (actionId) {
      return;
    }

    try {

      setActionId(woId);
      setActionError("");

      await startWorkOrder(woId);

      await loadWorkOrders();

    } catch (err) {

      console.error(
        "Failed to start work order:",
        err
      );

      setActionError(
        err?.response?.data?.detail ||
          "Unable to start work order."
      );

    } finally {

      setActionId(null);

    }
  };


  /* =====================================================
     SUBMIT FOR APPROVAL
  ===================================================== */

  const handleSubmit = async (
    woId
  ) => {

    if (actionId) {
      return;
    }

    try {

      setActionId(woId);
      setActionError("");

      await submitWorkOrderForApproval(
        woId
      );

      await loadWorkOrders();

    } catch (err) {

      console.error(
        "Failed to submit:",
        err
      );

      setActionError(
        err?.response?.data?.detail ||
          "Unable to submit work order for approval."
      );

    } finally {

      setActionId(null);

    }
  };


  /* =====================================================
     VIEW WORK ORDER
  ===================================================== */

  const handleView = (
    workOrderId
  ) => {

    navigate(
      `/mechanic/work-orders/${workOrderId}`
    );

  };


  return (
    <AppLayout>

      <div className="history-page mechanic-work-orders-scope">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="history-header">

          <div>

            <p className="page-eyebrow">
              MECHANIC WORK ORDERS
            </p>

            <h1>
              My Work Orders
            </h1>

            <p>
              Work orders assigned to you
              and their current status.
            </p>

          </div>

          <div className="history-actions">

            <AnimatedButton
              type="button"
              className="secondary-action"
              onClick={loadWorkOrders}
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
            STATUS TABS
        ================================================= */}

        <div
          className="mechanic-tabs"
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >

          {TABS.map(
            (tab) => (
              <AnimatedButton
                key={tab.status}
                type="button"
                className={
                  activeTab === tab.status
                    ? "primary-action"
                    : "secondary-action"
                }
                onClick={() =>
                  setActiveTab(
                    tab.status
                  )
                }
                disabled={loading}
                style={{
                  fontSize: "13px",
                }}
              >

                <ListFilter
                  size={14}
                />

                {tab.label}

              </AnimatedButton>
            )
          )}

        </div>


        {/* =================================================
            ACTION ERROR
        ================================================= */}

        {actionError && (

          <div className="history-error">

            <div>

              <strong>
                Action failed
              </strong>

              <p>
                {actionError}
              </p>

            </div>

            <AnimatedButton
              type="button"
              onClick={() =>
                setActionError("")
              }
            >
              Dismiss
            </AnimatedButton>

          </div>

        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="history-error">

            <div>

              <strong>
                Unable to load work orders
              </strong>

              <p>
                {error}
              </p>

            </div>

            <AnimatedButton
              type="button"
              onClick={loadWorkOrders}
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
          filteredWorkOrders.length === 0 && (

            <div className="history-empty">

              <div className="history-empty-icon">

                <ClipboardList
                  size={30}
                />

              </div>

              <h2>
                No work orders found
              </h2>

              <p>
                {activeTab === "ALL"
                  ? "You have no assigned work orders yet."
                  : `No work orders with status "${activeTab}".`}
              </p>

            </div>

        )}


        {/* =================================================
            WORK ORDER LIST
        ================================================= */}

        {!loading &&
          !error &&
          filteredWorkOrders.length > 0 && (

            <div className="booking-list">

              {filteredWorkOrders.map(
                (wo) => {

                  const canStart =
                    (wo.status === "CREATED" ||
                      wo.status === "INSPECTION" ||
                      wo.status === "IN_PROGRESS") &&
                    !wo.started_at;

                  const canSubmit =
                    wo.status === "IN_PROGRESS" &&
                    Boolean(wo.started_at);

                  const isSubmitted =
                    wo.status === "SUBMITTED_FOR_APPROVAL";

                  const isActionBusy =
                    actionId === wo.id;

                  return (
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

                            <span
                              className={getStatusClass(
                                wo.status
                              )}
                            >

                              {wo.status ||
                                "UNKNOWN"}

                            </span>

                          </div>

                          <div className="booking-meta">

                            <div>

                              <Car
                                size={14}
                              />

                              Vehicle #{wo.vehicle_id}

                            </div>

                            {wo.started_at && (

                              <div>

                                <Clock3
                                  size={14}
                                />

                                Started{" "}
                                {formatDate(
                                  wo.started_at
                                )}

                              </div>

                            )}

                            {!wo.started_at && wo.created_at && (

                              <div>

                                <CalendarDays
                                  size={14}
                                />

                                Created{" "}
                                {formatDate(
                                  wo.created_at
                                )}

                              </div>

                            )}

                          </div>

                        </div>

                      </div>


                      <div className="advisor-card-footer">

                        <div className="mechanic-card-actions">

                          {canStart && (

                            <AnimatedButton
                              type="button"
                              className="secondary-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStart(wo.id);
                              }}
                              disabled={isActionBusy}
                            >

                              {isActionBusy ? (
                                <LoaderCircle
                                  size={16}
                                  className="spin"
                                />
                              ) : (
                                <PlayCircle
                                  size={16}
                                />
                              )}

                              {isActionBusy
                                ? "Starting..."
                                : "Start Work"}

                            </AnimatedButton>

                          )}

                          {canSubmit && (

                            <AnimatedButton
                              type="button"
                              className="primary-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubmit(wo.id);
                              }}
                              disabled={isActionBusy}
                            >

                              {isActionBusy ? (
                                <LoaderCircle
                                  size={16}
                                  className="spin"
                                />
                              ) : (
                                <CheckCircle2
                                  size={16}
                                />
                              )}

                              {isActionBusy
                                ? "Submitting..."
                                : "Submit for Approval"}

                            </AnimatedButton>

                          )}

                          {isSubmitted && (

                            <span
                              className="mechanic-submitted-chip"
                            >

                              <CheckCircle2
                                size={14}
                              />

                              Submitted

                            </span>

                          )}

                          <AnimatedButton
                            type="button"
                            className="secondary-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(wo.id);
                            }}
                            disabled={isActionBusy}
                          >

                            View Details

                            <ChevronRight
                              size={16}
                            />

                          </AnimatedButton>

                        </div>

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
