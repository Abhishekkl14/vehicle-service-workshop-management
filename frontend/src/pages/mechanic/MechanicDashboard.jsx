import { useEffect, useState } from "react";

import {
  RefreshCw,
  ClipboardList,
  SearchCheck,
  Stethoscope,
  PlayCircle,
  CheckCircle2,
  CheckSquare,
  LoaderCircle,
  Plus,
  AlertCircle,
  MessageSquare,
  Car,
  CalendarDays,
  Clock3,
  Wrench,
  BookOpen,
  X,
  FileText,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";

import {
  getWorkOrdersByStatus,
  startWorkOrder,
  completeWorkOrder,
} from "../../api/workOrderApi";

import {
  createInspection,
  getInspectionItems,
  addInspectionItem,
} from "../../api/inspectionApi";


const WORK_ORDER_STATUSES = [
  "CREATED",
  "INSPECTION",
  "IN_PROGRESS",
  "COMPLETED",
];


const formatDateTime = (value) => {
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

  return "booking-status pending";
};


const getSeverityClass = (
  severity
) => {
  const s = String(
    severity || ""
  ).toUpperCase();

  if (s === "LOW") {
    return "low";
  }

  if (s === "MEDIUM") {
    return "medium";
  }

  if (s === "HIGH") {
    return "high";
  }

  if (s === "CRITICAL") {
    return "critical";
  }

  return "neutral";
};


/* =========================================================
   WORK ORDER CARD
========================================================= */

function WorkOrderCard({
  workOrder,
  currentUserId,
  onUpdated,
  onSuccess,
}) {

  const [inspectionOpen, setInspectionOpen] =
    useState(false);

  const [inspection, setInspection] =
    useState(null);

  const [items, setItems] =
    useState([]);

  const [itemsLoading, setItemsLoading] =
    useState(false);

  const [inspectionError, setInspectionError] =
    useState("");


  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [overallNotes, setOverallNotes] =
    useState("");

  const [creatingInspection, setCreatingInspection] =
    useState(false);

  const [createError, setCreateError] =
    useState("");


  const [showAddForm, setShowAddForm] =
    useState(false);

  const [itemForm, setItemForm] =
    useState({
      component: "",
      condition: "",
      severity: "",
      notes: "",
      recommendedAction: "",
    });

  const [addingItem, setAddingItem] =
    useState(false);

  const [addError, setAddError] =
    useState("");


  const [starting, setStarting] =
    useState(false);

  const [completing, setCompleting] =
    useState(false);

  const [actionError, setActionError] =
    useState("");


  /* =====================================================
     START WORK
  ===================================================== */

  const handleStart = async () => {

    if (starting) {
      return;
    }

    try {

      setStarting(true);

      setActionError("");


      const updated =
        await startWorkOrder(
          workOrder.id
        );


      onUpdated(updated);

      onSuccess(
        `Work order #${updated.id} started.`
      );

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

      setStarting(false);

    }
  };


  /* =====================================================
     COMPLETE WORK
  ===================================================== */

  const handleComplete = async () => {

    if (completing) {
      return;
    }

    try {

      setCompleting(true);

      setActionError("");


      const updated =
        await completeWorkOrder(
          workOrder.id
        );


      onUpdated(updated);

      onSuccess(
        `Work order #${updated.id} completed.`
      );

    } catch (err) {

      console.error(
        "Failed to complete work order:",
        err
      );


      setActionError(
        err?.response?.data?.detail ||
          "Unable to complete work order."
      );

    } finally {

      setCompleting(false);

    }
  };


  /* =====================================================
     LOAD INSPECTION ITEMS
  ===================================================== */

  const loadItems = async (
    inspectionId
  ) => {

    try {

      setItemsLoading(true);

      setInspectionError("");


      const data =
        await getInspectionItems(
          inspectionId
        );


      setItems(
        Array.isArray(data)
          ? data
          : data?.items || []
      );

    } catch (err) {

      console.error(
        "Failed to load inspection findings:",
        err
      );


      setInspectionError(
        err?.response?.data?.detail ||
          "Unable to load inspection findings."
      );

    } finally {

      setItemsLoading(false);

    }
  };


  /* =====================================================
     CREATE INSPECTION
  ===================================================== */

  const handleCreateInspection = async () => {

    if (creatingInspection) {
      return;
    }

    try {

      setCreatingInspection(true);

      setCreateError("");


      const created =
        await createInspection({
          work_order_id: workOrder.id,
          mechanic_id: currentUserId,
          overall_notes:
            overallNotes.trim() || null,
        });


      setInspection(created);

      setShowCreateForm(false);

      setOverallNotes("");


      onSuccess(
        `Inspection #${created.id} created for Work Order #${workOrder.id}.`
      );


      await loadItems(
        created.id
      );

    } catch (err) {

      console.error(
        "Failed to create inspection:",
        err
      );


      setCreateError(
        err?.response?.data?.detail ||
          "Unable to create inspection."
      );

    } finally {

      setCreatingInspection(false);

    }
  };


  /* =====================================================
     ADD INSPECTION ITEM
  ===================================================== */

  const handleAddItem = async () => {

    if (addingItem || !inspection) {
      return;
    }

    if (
      !itemForm.component.trim() ||
      !itemForm.condition.trim() ||
      !itemForm.severity.trim()
    ) {

      setAddError(
        "Component, Condition, and Severity are required."
      );

      return;
    }

    try {

      setAddingItem(true);

      setAddError("");


      await addInspectionItem(
        inspection.id,
        {
          component:
            itemForm.component.trim(),
          condition:
            itemForm.condition.trim(),
          severity:
            itemForm.severity.trim(),
          notes:
            itemForm.notes.trim() || null,
          recommended_action:
            itemForm.recommendedAction.trim() || null,
        }
      );


      setItemForm({
        component: "",
        condition: "",
        severity: "",
        notes: "",
        recommendedAction: "",
      });

      setShowAddForm(false);


      onSuccess(
        `Finding added to Inspection #${inspection.id}.`
      );


      await loadItems(
        inspection.id
      );

    } catch (err) {

      console.error(
        "Failed to add inspection finding:",
        err
      );


      setAddError(
        err?.response?.data?.detail ||
          "Unable to add inspection finding."
      );

    } finally {

      setAddingItem(false);

    }
  };


  /* =====================================================
     ACTION BUTTONS
  ===================================================== */

  const canStart =
    workOrder.status === "IN_PROGRESS" &&
    !workOrder.started_at;

  const canComplete =
    workOrder.status === "IN_PROGRESS" &&
    Boolean(workOrder.started_at);


  return (
    <article className="booking-card">

      <div className="booking-card-main">

        <div className="booking-icon">

          <ClipboardList
            size={23}
          />

        </div>


        <div className="booking-content">

          <div className="booking-title-row">

            <h2>
              Work Order #{workOrder.id}
            </h2>


            <span
              className={getWorkOrderStatusClass(
                workOrder.status
              )}
            >

              {workOrder.status ||
                "UNKNOWN"}

            </span>

          </div>


          <div className="booking-meta">

            <div>

              <CalendarDays
                size={14}
              />

              Booking #{workOrder.booking_id}

            </div>


            <div>

              <Car
                size={14}
              />

              Vehicle #{workOrder.vehicle_id}

            </div>


            <div>

              <Clock3
                size={14}
              />

              Received{" "}
              {formatDateTime(
                workOrder.received_at
              )}

            </div>


            <div>

              <Clock3
                size={14}
              />

              Started{" "}
              {formatDateTime(
                workOrder.started_at
              )}

            </div>


            <div>

              <Clock3
                size={14}
              />

              Completed{" "}
              {formatDateTime(
                workOrder.completed_at
              )}

            </div>

          </div>


          {workOrder.complaint && (

            <p className="booking-notes">

              <BookOpen
                size={13}
              />

              {workOrder.complaint}

            </p>

          )}

        </div>

      </div>


      {actionError && (

        <div className="mechanic-error mechanic-card-error">

          <AlertCircle
            size={15}
          />

          <span>
            {actionError}
          </span>

        </div>

      )}


      <div className="mechanic-card-footer">

        <div className="mechanic-card-actions">

          {canStart && (

            <button
              type="button"
              className="secondary-action"
              onClick={handleStart}
              disabled={starting}
            >

              {starting ? (
                <LoaderCircle
                  size={16}
                  className="spin"
                />
              ) : (
                <PlayCircle
                  size={16}
                />
              )}

              {starting
                ? "Starting..."
                : "Start Work"}

            </button>

          )}


          {canComplete && (

            <button
              type="button"
              className="primary-action"
              onClick={handleComplete}
              disabled={completing}
            >

              {completing ? (
                <LoaderCircle
                  size={16}
                  className="spin"
                />
              ) : (
                <CheckCircle2
                  size={16}
                />
              )}

              {completing
                ? "Completing..."
                : "Complete Work"}

            </button>

          )}


          <button
            type="button"
            className="secondary-action mechanic-inspection-toggle"
            onClick={() =>
              setInspectionOpen(
                (open) => !open
              )
            }
            disabled={starting || completing}
          >

            <Stethoscope
              size={16}
            />

            Inspection
            {inspection ? (
              <CheckCircle2
                size={14}
                className="mechanic-toggle-check"
              />
            ) : null}

          </button>

        </div>

      </div>


      {inspectionOpen && (

        <div className="mechanic-inspection-panel">

          {!inspection ? (

            /* ------------------------------------------------
               NO INSPECTION YET
            ------------------------------------------------ */

            showCreateForm ? (

              <div className="mechanic-create-form">

                <div className="mechanic-form-row">

                  <div className="mechanic-form-field">

                    <label>
                      Work Order ID
                    </label>

                    <input
                      type="text"
                      value={workOrder.id}
                      readOnly
                      disabled
                    />

                  </div>


                  <div className="mechanic-form-field">

                    <label>
                      Mechanic ID
                    </label>

                    <input
                      type="text"
                      value={
                        currentUserId ?? ""
                      }
                      readOnly
                      disabled
                    />

                  </div>

                </div>


                <div className="mechanic-form-field">

                  <label>
                    Overall Notes
                  </label>

                  <textarea
                    rows={3}
                    value={overallNotes}
                    onChange={(e) =>
                      setOverallNotes(
                        e.target.value
                      )
                    }
                    placeholder="Optional — overall inspection notes"
                    disabled={
                      creatingInspection
                    }
                  />

                </div>


                {createError && (

                  <div className="mechanic-error">

                    <AlertCircle
                      size={15}
                    />

                    <span>
                      {createError}
                    </span>

                  </div>

                )}


                <div className="mechanic-form-actions">

                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() =>
                      setShowCreateForm(
                        false
                      )
                    }
                    disabled={
                      creatingInspection
                    }
                  >

                    Cancel

                  </button>


                  <button
                    type="button"
                    className="primary-action"
                    onClick={
                      handleCreateInspection
                    }
                    disabled={
                      creatingInspection
                    }
                  >

                    {creatingInspection ? (
                      <LoaderCircle
                        size={16}
                        className="spin"
                      />
                    ) : (
                      <Plus
                        size={16}
                      />
                    )}

                    {creatingInspection
                      ? "Creating..."
                      : "Create Inspection"}

                  </button>

                </div>

              </div>

            ) : (

              <div className="mechanic-inspection-empty">

                <div className="mechanic-inspection-empty-icon">

                  <FileText
                    size={22}
                  />

                </div>


                <div>

                  <h4>
                    No inspection created yet.
                  </h4>

                  <p>
                    Create an inspection for
                    this work order to record
                    findings.
                  </p>

                </div>


                <button
                  type="button"
                  className="primary-action"
                  onClick={() =>
                    setShowCreateForm(true)
                  }
                >

                  <Plus
                    size={15}
                  />

                  Create Inspection

                </button>

              </div>

            )

          ) : (

            /* ------------------------------------------------
               INSPECTION + FINDINGS
            ------------------------------------------------ */

            <>

              <div className="mechanic-inspection-summary">

                <div className="details-card-header">

                  <div className="details-card-icon">

                    <Stethoscope
                      size={18}
                    />

                  </div>

                  <div>

                    <h3>
                      Inspection #{inspection.id}
                    </h3>

                    <p>
                      Work Order #{inspection.work_order_id}
                    </p>

                  </div>

                </div>


                <div className="mechanic-inspection-meta">

                  <div>

                    <Wrench
                      size={13}
                    />

                    Mechanic #{inspection.mechanic_id}

                  </div>


                  <div>

                    <CalendarDays
                      size={13}
                    />

                    {formatDateTime(
                      inspection.inspected_at
                    )}

                  </div>

                </div>


                {inspection.overall_notes && (

                  <p className="booking-notes mechanic-inspection-notes">

                    <MessageSquare
                      size={13}
                    />

                    {inspection.overall_notes}

                  </p>

                )}

              </div>


              <div className="mechanic-findings">

                <div className="mechanic-findings-header">

                  <div className="details-card-icon mechanic-findings-icon">

                    <SearchCheck
                      size={16}
                    />

                  </div>

                  <div>

                    <h4>
                      Findings
                    </h4>

                    <p>
                      Components checked during
                      this inspection
                    </p>

                  </div>

                </div>


                {itemsLoading ? (

                  <div className="booking-list">

                    {[1, 2].map(
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

                ) : inspectionError ? (

                  <div className="mechanic-error">

                    <AlertCircle
                      size={15}
                    />

                    <span>
                      {inspectionError}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        loadItems(
                          inspection.id
                        )
                      }
                    >

                      Try Again

                    </button>

                  </div>

                ) : items.length === 0 ? (

                  <p className="mechanic-no-findings">
                    No inspection findings yet.
                  </p>

                ) : (

                  <div className="inspection-items-list">

                    {items.map((item) => (

                      <article
                        className="inspection-item-card"
                        key={item.id}
                      >

                        <div className="inspection-item-top">

                          <h3>
                            {item.component}
                          </h3>


                          <div className="inspection-item-badges">

                            <span className="condition-badge">
                              {item.condition}
                            </span>


                            <span
                              className={`severity-badge ${getSeverityClass(
                                item.severity
                              )}`}
                            >

                              {item.severity}

                            </span>

                          </div>

                        </div>


                        <div className="inspection-item-details">

                          <div className="inspection-item-detail">

                            <span>

                              <MessageSquare
                                size={13}
                              />

                              Notes

                            </span>

                            <p>
                              {item.notes ||
                                "No notes recorded."}
                            </p>

                          </div>


                          <div className="inspection-item-detail">

                            <span>

                              <CheckSquare
                                size={13}
                              />

                              Recommended Action

                            </span>

                            <p>
                              {item.recommended_action ||
                                "No recommendation recorded."}
                            </p>

                          </div>

                        </div>

                      </article>

                    ))}

                  </div>

                )}


                <button
                  type="button"
                  className="secondary-action mechanic-add-finding"
                  onClick={() =>
                    setShowAddForm(
                      (open) => !open
                    )
                  }
                  disabled={addingItem}
                >

                  <Plus
                    size={15}
                  />

                  {showAddForm
                    ? "Cancel"
                    : "Add Finding"}

                </button>


                {showAddForm && (

                  <div className="mechanic-item-form">

                    <div className="mechanic-form-row mechanic-form-row-3">

                      <div className="mechanic-form-field">

                        <label>
                          Component
                        </label>

                        <input
                          type="text"
                          value={itemForm.component}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              component:
                                e.target.value,
                            })
                          }
                          placeholder="Required"
                          disabled={addingItem}
                        />

                      </div>


                      <div className="mechanic-form-field">

                        <label>
                          Condition
                        </label>

                        <input
                          type="text"
                          value={itemForm.condition}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              condition:
                                e.target.value,
                            })
                          }
                          placeholder="Required"
                          disabled={addingItem}
                        />

                      </div>


                      <div className="mechanic-form-field">

                        <label>
                          Severity
                        </label>

                        <input
                          type="text"
                          value={itemForm.severity}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              severity:
                                e.target.value,
                            })
                          }
                          placeholder="Required"
                          disabled={addingItem}
                        />

                      </div>

                    </div>


                    <div className="mechanic-form-field">

                      <label>
                        Notes
                      </label>

                      <textarea
                        rows={2}
                        value={itemForm.notes}
                        onChange={(e) =>
                          setItemForm({
                            ...itemForm,
                            notes:
                              e.target.value,
                          })
                        }
                        placeholder="Optional"
                        disabled={addingItem}
                      />

                    </div>


                    <div className="mechanic-form-field">

                      <label>
                        Recommended Action
                      </label>

                      <textarea
                        rows={2}
                        value={itemForm.recommendedAction}
                        onChange={(e) =>
                          setItemForm({
                            ...itemForm,
                            recommendedAction:
                              e.target.value,
                          })
                        }
                        placeholder="Optional"
                        disabled={addingItem}
                      />

                    </div>


                    {addError && (

                      <div className="mechanic-error">

                        <AlertCircle
                          size={15}
                        />

                        <span>
                          {addError}
                        </span>

                      </div>

                    )}


                    <div className="mechanic-form-actions">

                      <button
                        type="button"
                        className="primary-action"
                        onClick={handleAddItem}
                        disabled={addingItem}
                      >

                        {addingItem ? (
                          <LoaderCircle
                            size={16}
                            className="spin"
                          />
                        ) : (
                          <Plus
                            size={16}
                          />
                        )}

                        {addingItem
                          ? "Adding..."
                          : "Add Finding"}

                      </button>

                    </div>

                  </div>

                )}

              </div>

            </>

          )}

        </div>

      )}

    </article>
  );
}


/* =========================================================
   MECHANIC DASHBOARD
========================================================= */

export default function MechanicDashboard() {

  const { user } = useAuth();

  const currentUserId =
    user?.id ?? null;


  const [workOrders, setWorkOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  /* =====================================================
     LOAD ASSIGNED WORK ORDERS
  ===================================================== */

  const loadWorkOrders = async (
    isRefresh = false
  ) => {

    try {

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");


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


      const assigned =
        unique.filter(
          (wo) =>
            wo.assigned_mechanic_id ===
            currentUserId
        );


      setWorkOrders(assigned);

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

      setRefreshing(false);

    }
  };


  useEffect(() => {

    if (currentUserId == null) {
      return;
    }

    loadWorkOrders();

  }, [currentUserId]);


  /* =====================================================
     HANDLERS
  ===================================================== */

  const handleUpdated = (
    updated
  ) => {

    setWorkOrders((prev) =>
      prev.map((wo) =>
        wo.id === updated.id
          ? updated
          : wo
      )
    );
  };


  const handleSuccess = (
    message
  ) => {

    setSuccessMessage(message);

  };


  /* =====================================================
     DERIVED DATA
  ===================================================== */

  const summary = {
    total: workOrders.length,
    inspectionRequired: workOrders.filter(
      (wo) =>
        wo.status === "CREATED" ||
        wo.status === "INSPECTION"
    ).length,
    inProgress: workOrders.filter(
      (wo) =>
        wo.status === "IN_PROGRESS"
    ).length,
    completed: workOrders.filter(
      (wo) =>
        wo.status === "COMPLETED"
    ).length,
  };


  return (
    <AppLayout>

      <div className="mechanic-dashboard">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mechanic-header">

          <div>

            <p className="page-eyebrow">
              MECHANIC
            </p>


            <h1>
              Welcome, {user?.first_name}
            </h1>


            <p>
              Manage your assigned workshop
              jobs and inspections.
            </p>

          </div>


          <button
            type="button"
            className="secondary-action"
            onClick={() =>
              loadWorkOrders(true)
            }
            disabled={loading || refreshing}
          >

            <RefreshCw
              size={16}
              className={
                refreshing ? "spin" : ""
              }
            />

            Refresh

          </button>

        </div>


        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {successMessage && (

          <div className="mechanic-success">

            <CheckCircle2
              size={18}
            />

            <span>
              {successMessage}
            </span>

            <button
              type="button"
              className="mechanic-success-close"
              onClick={() =>
                setSuccessMessage("")
              }
              aria-label="Dismiss"
            >

              <X
                size={16}
              />

            </button>

          </div>

        )}


        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="dashboard-grid mechanic-summary-grid">

          <div className="dashboard-card">

            <span>
              My Work Orders
            </span>

            <strong>
              {loading ? "…" : summary.total}
            </strong>

            <small>
              Assigned to you
            </small>

          </div>


          <div className="dashboard-card">

            <span>
              Inspection Required
            </span>

            <strong>
              {loading
                ? "…"
                : summary.inspectionRequired}
            </strong>

            <small>
              Awaiting inspection
            </small>

          </div>


          <div className="dashboard-card">

            <span>
              In Progress
            </span>

            <strong>
              {loading
                ? "…"
                : summary.inProgress}
            </strong>

            <small>
              Currently being worked on
            </small>

          </div>


          <div className="dashboard-card">

            <span>
              Completed
            </span>

            <strong>
              {loading
                ? "…"
                : summary.completed}
            </strong>

            <small>
              Finished work orders
            </small>

          </div>

        </div>


        {/* =================================================
            WORK ORDER LIST
        ================================================= */}

        <div className="mechanic-section">

          <div className="section-header">

            <div>

              <h2>
                My Work Orders
              </h2>

              <p>
                Work orders assigned to you
              </p>

            </div>

          </div>


          {error && !loading && (

            <div className="mechanic-error">

              <AlertCircle
                size={16}
              />

              <span>
                {error}
              </span>

              <button
                type="button"
                onClick={() =>
                  loadWorkOrders()
                }
              >

                Try Again

              </button>

            </div>

          )}


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

            <div className="mechanic-empty">

              <div className="mechanic-empty-icon">

                <ClipboardList
                  size={26}
                />

              </div>


              <h3>
                No work orders assigned
              </h3>


              <p>
                Work orders assigned to you
                will appear here.
              </p>

            </div>

          ) : (

            <div className="booking-list">

              {workOrders.map((workOrder) => (

                <WorkOrderCard
                  key={workOrder.id}
                  workOrder={workOrder}
                  currentUserId={currentUserId}
                  onUpdated={handleUpdated}
                  onSuccess={handleSuccess}
                />

              ))}

            </div>

          )}

        </div>

      </div>

    </AppLayout>
  );
}
