import { useEffect, useState } from "react";

import {
  RefreshCw,
  ClipboardList,
  ChevronRight,
  Car,
  CalendarDays,
  AlertCircle,
  ListFilter,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";

import {
  getWorkOrdersByStatus,
} from "../../api/workOrderApi";


const TABS = [
  { label: "All", status: "ALL" },
  { label: "In Progress", status: "IN_PROGRESS" },
  { label: "Submitted", status: "SUBMITTED_FOR_APPROVAL" },
  { label: "Completed", status: "COMPLETED" },
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


export default function CustomerWorkOrders() {

  const navigate = useNavigate();


  const [activeTab, setActiveTab] =
    useState("ALL");

  const [workOrders, setWorkOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


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
     VIEW WORK ORDER
  ===================================================== */

  const handleView = (
    workOrderId
  ) => {

    navigate(
      `/customer/work-orders/${workOrderId}`
    );

  };


  return (
    <AppLayout>

      <div className="history-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="history-header">

          <div>

            <p className="page-eyebrow">
              WORK ORDERS
            </p>


            <h1>
              My Work Orders
            </h1>


            <p>
              Track the status of your
              vehicle work orders.
            </p>

          </div>


          <div className="history-actions">

            <button
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

            </button>

          </div>

        </div>


        {/* =================================================
            STATUS TABS
        ================================================= */}

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >

          {TABS.map(
            (tab) => (
              <button
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

              </button>
            )
          )}

        </div>


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


            <button
              type="button"
              onClick={loadWorkOrders}
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
          workOrders.length === 0 && (

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
                  ? "You have no work orders yet."
                  : `No work orders with status "${activeTab}".`}
              </p>

            </div>

        )}


        {/* =================================================
            WORK ORDER LIST
        ================================================= */}

        {!loading &&
          !error &&
          workOrders.length > 0 && (

            <div className="booking-list">

              {workOrders.map(
                (wo) => (

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


                          <div>

                            <CalendarDays
                              size={14}
                            />

                            {formatDate(
                              wo.created_at ||
                              wo.received_at
                            )}

                          </div>

                        </div>

                      </div>


                      <button
                        type="button"
                        className="booking-view-button"
                        onClick={() =>
                          handleView(
                            wo.id
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

                )
              )}

            </div>

        )}

      </div>

    </AppLayout>
  );
}
