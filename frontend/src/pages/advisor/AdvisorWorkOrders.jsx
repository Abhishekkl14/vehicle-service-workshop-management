import { useEffect, useState } from "react";

import {
  ClipboardList,
  CalendarDays,
  Car,
  Wrench,
  RefreshCw,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";

import {
  getWorkOrdersByStatus,
} from "../../api/workOrderApi";
import AnimatedButton from "../../components/ui/animated-button";


const WORK_ORDER_TABS = [
  { key: "ALL", label: "All" },
  { key: "CREATED", label: "Created" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "SUBMITTED_FOR_APPROVAL", label: "Submitted" },
  { key: "COMPLETED", label: "Completed" },
];


const formatDate = (value) => {
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
    }
  );
};


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


const getWorkOrderStatusClass = (
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

  if (s === "SUBMITTED_FOR_APPROVAL") {
    return "booking-status pending";
  }

  return "booking-status pending";
};


const WORK_ORDER_STATUSES = [
  "CREATED",
  "IN_PROGRESS",
  "SUBMITTED_FOR_APPROVAL",
  "COMPLETED",
];


export default function AdvisorWorkOrders() {

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

        const results =
          await Promise.all(
            WORK_ORDER_STATUSES.map(
              (status) =>
                getWorkOrdersByStatus(
                  status
                )
            )
          );


        const seen = new Set();

        const unique =
          results
            .flat()
            .filter(Boolean)
            .filter((wo) => {
              if (seen.has(wo.id)) {
                return false;
              }

              seen.add(wo.id);

              return true;
            });


        setWorkOrders(unique);

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
          "Unable to load work orders."
      );

    } finally {

      setLoading(false);

    }

  };


  /* =====================================================
     LOAD ON MOUNT + TAB CHANGE
  ===================================================== */

  useEffect(() => {

    loadWorkOrders();

  }, [activeTab]);


  /* =====================================================
     NAVIGATE TO DASHBOARD
  ===================================================== */

  const handleViewDetails = (
    workOrderId
  ) => {

    navigate(
      "/advisor/dashboard"
    );

  };


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <AppLayout>

      <div className="advisor-dashboard advisor-work-orders-scope">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="advisor-header">

          <div>

            <p className="page-eyebrow">
              WORK ORDERS
            </p>


            <h1>
              Work Orders
            </h1>


            <p>
              View and manage all workshop
              work orders across all statuses.
            </p>

          </div>


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


        {/* =================================================
            STATUS TABS
        ================================================= */}

        <div className="advisor-date-filter">

          <label>
            Filter by Status
          </label>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginTop: "8px",
            }}
          >

            {WORK_ORDER_TABS.map(
              (tab) => (

                <AnimatedButton
                  key={tab.key}
                  type="button"
                  className={
                    activeTab === tab.key
                      ? "primary-action"
                      : "secondary-action"
                  }
                  onClick={() =>
                    setActiveTab(
                      tab.key
                    )
                  }
                >

                  {tab.label}

                </AnimatedButton>

              )
            )}

          </div>

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
              onClick={loadWorkOrders}
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


        ) : error ? null : workOrders.length === 0 ? (


          /* =================================================
              EMPTY STATE
          ================================================= */

          <div className="advisor-empty">

            <div className="advisor-empty-icon">

              <ClipboardList
                size={26}
              />

            </div>


            <h3>
              No work orders found
            </h3>


            <p>
              {activeTab === "ALL"
                ? "Work orders will appear here once they are created."
                : `No work orders with status "${WORK_ORDER_TABS.find(
                    (t) =>
                      t.key === activeTab
                  )?.label || activeTab}".`
              }
            </p>

          </div>


        ) : (


          /* =================================================
              WORK ORDERS TABLE
          ================================================= */

          <div className="advisor-section">

            <div className="section-header">

              <div>

                <h2>
                  {activeTab === "ALL"
                    ? `All Work Orders (${workOrders.length})`
                    : `${WORK_ORDER_TABS.find(
                        (t) =>
                          t.key === activeTab
                      )?.label || activeTab
                      } (${workOrders.length})`
                  }
                </h2>

              </div>

            </div>


            <div className="advisor-part-table-wrap">

              <table className="advisor-part-table">

                <thead>

                  <tr>

                    <th>
                      ID
                    </th>

                    <th>
                      Vehicle
                    </th>

                    <th>
                      Mechanic
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Created At
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {workOrders.map(
                    (wo) => (

                      <tr
                        key={wo.id}
                        style={{
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          handleViewDetails(
                            wo.id
                          )
                        }
                      >

                        <td>

                          <strong>
                            #{wo.id}
                          </strong>

                        </td>


                        <td>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >

                            <Car
                              size={14}
                            />

                            Vehicle #{wo.vehicle_id}

                          </div>

                        </td>


                        <td>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >

                            <Wrench
                              size={14}
                            />

                            {wo.assigned_mechanic_id
                              ? `Mechanic #${wo.assigned_mechanic_id}`
                              : "Not assigned"
                            }

                          </div>

                        </td>


                        <td>

                          <span
                            className={getWorkOrderStatusClass(
                              wo.status
                            )}
                          >

                            {wo.status ||
                              "UNKNOWN"}

                          </span>

                        </td>


                        <td>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >

                            <CalendarDays
                              size={14}
                            />

                            {formatDateTime(
                              wo.created_at
                            )}

                          </div>

                        </td>


                        <td>

                          <AnimatedButton
                            type="button"
                            className="secondary-action"
                            onClick={(e) => {

                              e.stopPropagation();

                              handleViewDetails(
                                wo.id
                              );

                            }}
                          >

                            View Details

                          </AnimatedButton>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </div>

    </AppLayout>

  );

}
