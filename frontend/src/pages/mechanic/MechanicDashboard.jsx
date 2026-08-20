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
  Package,
  Settings,
  FlaskConical,
  HardHat,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";

import {
  getWorkOrdersByStatus,
  startWorkOrder,
  submitWorkOrderForApproval,
} from "../../api/workOrderApi";

import {
  createInspection,
  getInspectionItems,
  addInspectionItem,
  getInspectionByWorkOrderId,
} from "../../api/inspectionApi";

import {
  getActiveParts,
  getWorkOrderParts,
  addWorkOrderPart,
} from "../../api/partApi";

import {
  getActiveServices,
  getWorkOrderServices,
  addWorkOrderService,
} from "../../api/serviceApi";
import AnimatedButton from "../../components/ui/animated-button";


const WORK_ORDER_STATUSES = [
  "CREATED",
  "INSPECTION",
  "IN_PROGRESS",
  "SUBMITTED_FOR_APPROVAL",
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

  const [inspectionLoaded, setInspectionLoaded] =
    useState(false);

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

  // Only allow creating inspections for these work order statuses.
  const canCreateInspection = [
    "CREATED",
    "ASSIGNED",
    "INSPECTION",
  ].includes(
    String(workOrder?.status || "").toUpperCase()
  );


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

  const [submitting, setSubmitting] =
    useState(false);

  const [actionError, setActionError] =
    useState("");


  /* =====================================================
     ACTUAL WORK STATE
  ===================================================== */

  const [actualWorkOpen, setActualWorkOpen] =
    useState(false);

  const [actualLoading, setActualLoading] =
    useState(false);

  const [actualError, setActualError] =
    useState("");

  const [actualParts, setActualParts] =
    useState([]);

  const [actualServices, setActualServices] =
    useState([]);

  const [actualConsumables, setActualConsumables] =
    useState([]);

  const [actualLabor, setActualLabor] =
    useState([]);


  const [partsCatalog, setPartsCatalog] =
    useState([]);

  const [servicesCatalog, setServicesCatalog] =
    useState([]);


  const [showPartForm, setShowPartForm] =
    useState(false);

  const [partForm, setPartForm] =
    useState({ partId: "", quantity: 1 });

  const [addingPart, setAddingPart] =
    useState(false);

  const [partError, setPartError] =
    useState("");


  const [showServiceForm, setShowServiceForm] =
    useState(false);

  const [serviceForm, setServiceForm] =
    useState({ serviceId: "", description: "" });

  const [addingService, setAddingService] =
    useState(false);

  const [serviceError, setServiceError] =
    useState("");


  const [showConsumableForm, setShowConsumableForm] =
    useState(false);

  const [consumableForm, setConsumableForm] =
    useState({ description: "", quantity: 1, unitPrice: "" });

  const [addingConsumable, setAddingConsumable] =
    useState(false);

  const [consumableError, setConsumableError] =
    useState("");


  const [showLaborForm, setShowLaborForm] =
    useState(false);

  const [laborForm, setLaborForm] =
    useState({ description: "", quantity: 1 });

  const [addingLabor, setAddingLabor] =
    useState(false);

  const [laborError, setLaborError] =
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
     SUBMIT FOR APPROVAL
  ===================================================== */

  const handleSubmitForApproval = async () => {

    if (submitting) {
      return;
    }

    try {

      setSubmitting(true);

      setActionError("");


      const updated =
        await submitWorkOrderForApproval(
          workOrder.id
        );


      onUpdated(updated);

      onSuccess(
        `Work order #${updated.id} submitted for advisor approval.`
      );

    } catch (err) {

      console.error(
        "Failed to submit work order for approval:",
        err
      );


      setActionError(
        err?.response?.data?.detail ||
          "Unable to submit work order for approval."
      );

    } finally {

      setSubmitting(false);

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
     LOAD INSPECTION BY WORK ORDER
  ===================================================== */

  const loadInspection = async () => {

    try {

      setInspectionError("");

      const data =
        await getInspectionByWorkOrderId(
          workOrder.id
        );

      setInspection(data);

      setInspectionLoaded(true);

      if (data) {

        await loadItems(data.id);

      }

    } catch (err) {

      if (
        err?.response?.status === 404
      ) {

        setInspection(null);

        setInspectionLoaded(true);

        return;

      }

      console.error(
        "Failed to load inspection:",
        err
      );

      setInspectionError(
        err?.response?.data?.detail ||
          "Unable to load inspection."
      );

      setInspectionLoaded(true);

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

      setInspectionLoaded(true);

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
     ACTUAL WORK — LOAD
  ===================================================== */

  const loadActualWork = async () => {

    try {

      setActualLoading(true);

      setActualError("");


      const [partsData, servicesData] =
        await Promise.all([
          getWorkOrderParts(workOrder.id),
          getWorkOrderServices(workOrder.id),
        ]);


      const parts = Array.isArray(partsData)
        ? partsData
        : [];

      const allServices = Array.isArray(servicesData)
        ? servicesData
        : [];


      setActualParts(
        parts.filter(
          (p) => p.source === "ACTUAL"
        )
      );

      setActualServices(
        allServices.filter(
          (s) => s.item_type === "SERVICE"
        )
      );

      setActualConsumables(
        allServices.filter(
          (s) => s.item_type === "CONSUMABLE"
        )
      );

      setActualLabor(
        allServices.filter(
          (s) => s.item_type === "LABOR"
        )
      );


      const [catalogParts, catalogServices] =
        await Promise.all([
          getActiveParts(),
          getActiveServices(),
        ]);

      setPartsCatalog(
        Array.isArray(catalogParts)
          ? catalogParts
          : []
      );

      setServicesCatalog(
        Array.isArray(catalogServices)
          ? catalogServices
          : []
      );

    } catch (err) {

      console.error(
        "Failed to load actual work:",
        err
      );

      setActualError(
        err?.response?.data?.detail ||
          "Unable to load actual work data."
      );

    } finally {

      setActualLoading(false);

    }
  };


  /* =====================================================
     ACTUAL WORK — AUTO-LOAD ON MOUNT
  ===================================================== */

  useEffect(() => {

    if (
      workOrder.status === "IN_PROGRESS" ||
      workOrder.status === "SUBMITTED_FOR_APPROVAL"
    ) {

      loadActualWork();

    }

  }, [workOrder.id, workOrder.status]);


  /* =====================================================
     ACTUAL WORK — TOGGLE
  ===================================================== */

  const handleToggleActualWork = async () => {

    const opening = !actualWorkOpen;

    setActualWorkOpen(opening);

    if (
      opening &&
      actualParts.length === 0 &&
      actualServices.length === 0 &&
      actualConsumables.length === 0 &&
      actualLabor.length === 0 &&
      !actualLoading
    ) {

      await loadActualWork();

    }
  };


  /* =====================================================
     ACTUAL WORK — ADD PART
  ===================================================== */

  const handleAddPart = async () => {

    if (addingPart) {
      return;
    }

    if (!partForm.partId) {

      setPartError("Please select a part.");

      return;
    }

    try {

      setAddingPart(true);

      setPartError("");


      await addWorkOrderPart(
        workOrder.id,
        {
          part_id: Number(partForm.partId),
          quantity: Number(partForm.quantity) || 1,
        }
      );


      setPartForm({ partId: "", quantity: 1 });

      setShowPartForm(false);

      onSuccess("Part added to work order.");

      await loadActualWork();

    } catch (err) {

      console.error(
        "Failed to add part:",
        err
      );

      setPartError(
        err?.response?.data?.detail ||
          "Unable to add part."
      );

    } finally {

      setAddingPart(false);

    }
  };


  /* =====================================================
     ACTUAL WORK — ADD SERVICE
  ===================================================== */

  const handleAddService = async () => {

    if (addingService) {
      return;
    }

    if (!serviceForm.serviceId) {

      setServiceError(
        "Please select a service."
      );

      return;
    }

    try {

      setAddingService(true);

      setServiceError("");


      await addWorkOrderService(
        workOrder.id,
        {
          service_id: Number(
            serviceForm.serviceId
          ),
          item_type: "SERVICE",
          description:
            serviceForm.description.trim() ||
            null,
        }
      );


      setServiceForm({
        serviceId: "",
        description: "",
      });

      setShowServiceForm(false);

      onSuccess("Service added to work order.");

      await loadActualWork();

    } catch (err) {

      console.error(
        "Failed to add service:",
        err
      );

      setServiceError(
        err?.response?.data?.detail ||
          "Unable to add service."
      );

    } finally {

      setAddingService(false);

    }
  };


  /* =====================================================
     ACTUAL WORK — ADD CONSUMABLE
  ===================================================== */

  const handleAddConsumable = async () => {

    if (addingConsumable) {
      return;
    }

    if (
      !consumableForm.description.trim()
    ) {

      setConsumableError(
        "Description is required."
      );

      return;
    }

    if (
      !consumableForm.unitPrice ||
      Number(consumableForm.unitPrice) <= 0
    ) {

      setConsumableError(
        "Unit price is required and must be greater than zero."
      );

      return;
    }

    try {

      setAddingConsumable(true);

      setConsumableError("");


      await addWorkOrderService(
        workOrder.id,
        {
          item_type: "CONSUMABLE",
          description:
            consumableForm.description.trim(),
          quantity:
            Number(consumableForm.quantity) || 1,
          unit_price: Number(
            consumableForm.unitPrice
          ),
        }
      );


      setConsumableForm({
        description: "",
        quantity: 1,
        unitPrice: "",
      });

      setShowConsumableForm(false);

      onSuccess(
        "Consumable added to work order."
      );

      await loadActualWork();

    } catch (err) {

      console.error(
        "Failed to add consumable:",
        err
      );

      setConsumableError(
        err?.response?.data?.detail ||
          "Unable to add consumable."
      );

    } finally {

      setAddingConsumable(false);

    }
  };


  /* =====================================================
     ACTUAL WORK — ADD LABOR
  ===================================================== */

  const handleAddLabor = async () => {

    if (addingLabor) {
      return;
    }

    if (
      !laborForm.description.trim()
    ) {

      setLaborError(
        "Description is required."
      );

      return;
    }

    try {

      setAddingLabor(true);

      setLaborError("");


      await addWorkOrderService(
        workOrder.id,
        {
          item_type: "LABOR",
          description:
            laborForm.description.trim(),
          quantity:
            Number(laborForm.quantity) || 1,
        }
      );


      setLaborForm({ description: "", quantity: 1 });

      setShowLaborForm(false);

      onSuccess("Labor entry added.");

      await loadActualWork();

    } catch (err) {

      console.error(
        "Failed to add labor:",
        err
      );

      setLaborError(
        err?.response?.data?.detail ||
          "Unable to add labor entry."
      );

    } finally {

      setAddingLabor(false);

    }
  };


  /* =====================================================
     ACTION BUTTONS
  ===================================================== */

  const canStart =
    (workOrder.status === "CREATED" ||
      workOrder.status === "INSPECTION" ||
      workOrder.status === "IN_PROGRESS") &&
    !workOrder.started_at;

  const hasActualWork =
    actualParts.length > 0 ||
    actualServices.length > 0 ||
    actualConsumables.length > 0 ||
    actualLabor.length > 0;

  const canSubmit =
    workOrder.status === "IN_PROGRESS" &&
    Boolean(workOrder.started_at) &&
    hasActualWork;

  const isSubmitted =
    workOrder.status === "SUBMITTED_FOR_APPROVAL";

  const isRejected =
    workOrder.status === "IN_PROGRESS" &&
    Boolean(workOrder.rejection_reason);


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

            <AnimatedButton
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

            </AnimatedButton>

          )}


          {canSubmit && (

            <AnimatedButton
              type="button"
              className="primary-action"
              onClick={handleSubmitForApproval}
              disabled={submitting}
            >

              {submitting ? (
                <LoaderCircle
                  size={16}
                  className="spin"
                />
              ) : (
                <CheckCircle2
                  size={16}
                />
              )}

              {submitting
                ? "Submitting..."
                : "Submit for Approval"}

            </AnimatedButton>

          )}


          {isSubmitted && (

            <span className="mechanic-submitted-chip">

              <CheckCircle2
                size={14}
              />

              Submitted — awaiting advisor approval

            </span>

          )}


          {isRejected && workOrder.rejection_reason && (

            <div className="mechanic-rejection-note">

              <AlertCircle
                size={14}
              />

              <span>

                <strong>Rejected:</strong>{" "}
                {workOrder.rejection_reason}

              </span>

            </div>

          )}


          <AnimatedButton
            type="button"
            className="secondary-action mechanic-inspection-toggle"
            onClick={() => {
              const opening = !inspectionOpen;
              setInspectionOpen(opening);
              if (opening && !inspectionLoaded) {
                loadInspection();
              }
            }}
            disabled={starting || submitting}
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

          </AnimatedButton>


          {(workOrder.status === "IN_PROGRESS" ||
            workOrder.status === "SUBMITTED_FOR_APPROVAL") && (

            <AnimatedButton
              type="button"
              className="secondary-action mechanic-actual-toggle"
              onClick={handleToggleActualWork}
              disabled={starting || submitting}
            >

              <Wrench
                size={16}
              />

              Actual Work
              {hasActualWork ? (
                <CheckCircle2
                  size={14}
                  className="mechanic-toggle-check"
                />
              ) : null}

            </AnimatedButton>

          )}

        </div>

      </div>


      {/* =================================================
          ACTUAL WORK PANEL
      ================================================= */}

      {actualWorkOpen && (

        <div className="mechanic-actual-panel">

          {actualLoading ? (

            <div className="mechanic-actual-loading">

              <LoaderCircle
                size={18}
                className="spin"
              />

              <span>
                Loading actual work data...
              </span>

            </div>

          ) : actualError ? (

            <div className="mechanic-error">

              <AlertCircle
                size={15}
              />

              <span>
                {actualError}
              </span>

              <AnimatedButton
                type="button"
                onClick={loadActualWork}
              >

                Try Again

              </AnimatedButton>

            </div>

          ) : (

            <>

              <div className="mechanic-actual-header">

                <Wrench
                  size={16}
                />

                <div>

                  <h4>
                    Actual Work Performed
                  </h4>

                  <p>
                    Record parts, services,
                    consumables, and labor
                    performed on this work order.
                  </p>

                </div>

              </div>


              {/* -------------------------------------------
                  PARTS CHANGED
              ------------------------------------------- */}

              <div className="mechanic-actual-section">

                <div className="mechanic-actual-section-head">

                  <Package
                    size={14}
                  />

                  <h5>
                    Parts Changed
                  </h5>

                  {workOrder.status === "IN_PROGRESS" && !isSubmitted && (
                    <AnimatedButton
                      type="button"
                      className="secondary-action mechanic-actual-add-btn"
                      onClick={() =>
                        setShowPartForm(
                          (open) => !open
                        )
                      }
                      disabled={addingPart}
                    >
                      <Plus
                        size={14}
                      />
                      {showPartForm
                        ? "Cancel"
                        : "Add Part"}
                    </AnimatedButton>
                  )}

                </div>


                {showPartForm &&
                  workOrder.status === "IN_PROGRESS" &&
                  !isSubmitted && (

                  <div className="mechanic-item-form">

                    <div className="mechanic-form-row mechanic-form-row-3">

                      <div className="mechanic-form-field">

                        <label>
                          Part
                        </label>

                        <select
                          value={partForm.partId}
                          onChange={(e) =>
                            setPartForm({
                              ...partForm,
                              partId:
                                e.target.value,
                            })
                          }
                          disabled={addingPart}
                        >

                          <option value="">
                            Select part...
                          </option>

                          {partsCatalog.map(
                            (part) => (
                              <option
                                key={part.id}
                                value={part.id}
                              >
                                {part.name} ({part.part_number}) — ₹{part.unit_price}
                              </option>
                            )
                          )}

                        </select>

                      </div>


                      <div className="mechanic-form-field">

                        <label>
                          Quantity
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={partForm.quantity}
                          onChange={(e) =>
                            setPartForm({
                              ...partForm,
                              quantity:
                                e.target.value,
                            })
                          }
                          disabled={addingPart}
                        />

                      </div>

                    </div>


                    {partError && (

                      <div className="mechanic-error">

                        <AlertCircle
                          size={15}
                        />

                        <span>
                          {partError}
                        </span>

                      </div>

                    )}


                    <div className="mechanic-form-actions">

                      <AnimatedButton
                        type="button"
                        className="primary-action"
                        onClick={handleAddPart}
                        disabled={addingPart}
                      >

                        {addingPart ? (
                          <LoaderCircle
                            size={16}
                            className="spin"
                          />
                        ) : (
                          <Plus
                            size={16}
                          />
                        )}

                        {addingPart
                          ? "Adding..."
                          : "Add Part"}

                      </AnimatedButton>

                    </div>

                  </div>

                )}


                {actualParts.length === 0 ? (
                  <p className="mechanic-actual-empty">
                    No parts recorded yet.
                  </p>
                ) : (
                  <div className="mechanic-actual-items">

                    {actualParts.map((part) => (

                      <div
                        className="mechanic-actual-item"
                        key={part.id}
                      >

                        <div className="mechanic-actual-item-info">

                          <strong>
                            Part #{part.part_id}
                          </strong>

                          <span>
                            Qty: {part.quantity}
                          </span>

                          <span>
                            ₹{part.unit_price} × {part.quantity} = ₹{part.total_price}
                          </span>

                        </div>

                        <span className="mechanic-actual-badge">
                          ACTUAL
                        </span>

                      </div>

                    ))}

                  </div>
                )}

              </div>


              {/* -------------------------------------------
                  SERVICES PERFORMED
              ------------------------------------------- */}

              <div className="mechanic-actual-section">

                <div className="mechanic-actual-section-head">

                  <Settings
                    size={14}
                  />

                  <h5>
                    Services Performed
                  </h5>

                  {workOrder.status === "IN_PROGRESS" && !isSubmitted && (
                    <AnimatedButton
                      type="button"
                      className="secondary-action mechanic-actual-add-btn"
                      onClick={() =>
                        setShowServiceForm(
                          (open) => !open
                        )
                      }
                      disabled={addingService}
                    >
                      <Plus
                        size={14}
                      />
                      {showServiceForm
                        ? "Cancel"
                        : "Add Service"}
                    </AnimatedButton>
                  )}

                </div>


                {showServiceForm &&
                  workOrder.status === "IN_PROGRESS" &&
                  !isSubmitted && (

                  <div className="mechanic-item-form">

                    <div className="mechanic-form-row mechanic-form-row-3">

                      <div className="mechanic-form-field">

                        <label>
                          Service
                        </label>

                        <select
                          value={serviceForm.serviceId}
                          onChange={(e) =>
                            setServiceForm({
                              ...serviceForm,
                              serviceId:
                                e.target.value,
                            })
                          }
                          disabled={addingService}
                        >

                          <option value="">
                            Select service...
                          </option>

                          {servicesCatalog.map(
                            (svc) => (
                              <option
                                key={svc.id}
                                value={svc.id}
                              >
                                {svc.name} — ₹{svc.base_price} ({svc.estimated_duration_minutes} min)
                              </option>
                            )
                          )}

                        </select>

                      </div>


                      <div className="mechanic-form-field">

                        <label>
                          Description
                        </label>

                        <input
                          type="text"
                          value={
                            serviceForm.description
                          }
                          onChange={(e) =>
                            setServiceForm({
                              ...serviceForm,
                              description:
                                e.target.value,
                            })
                          }
                          placeholder="Optional — defaults to catalog name"
                          disabled={addingService}
                        />

                      </div>

                    </div>


                    {serviceError && (

                      <div className="mechanic-error">

                        <AlertCircle
                          size={15}
                        />

                        <span>
                          {serviceError}
                        </span>

                      </div>

                    )}


                    <div className="mechanic-form-actions">

                      <AnimatedButton
                        type="button"
                        className="primary-action"
                        onClick={handleAddService}
                        disabled={addingService}
                      >

                        {addingService ? (
                          <LoaderCircle
                            size={16}
                            className="spin"
                          />
                        ) : (
                          <Plus
                            size={16}
                          />
                        )}

                        {addingService
                          ? "Adding..."
                          : "Add Service"}

                      </AnimatedButton>

                    </div>

                  </div>

                )}


                {actualServices.length === 0 ? (
                  <p className="mechanic-actual-empty">
                    No services recorded yet.
                  </p>
                ) : (
                  <div className="mechanic-actual-items">

                    {actualServices.map((svc) => (

                      <div
                        className="mechanic-actual-item"
                        key={svc.id}
                      >

                        <div className="mechanic-actual-item-info">

                          <strong>
                            {svc.description}
                          </strong>

                          <span>
                            Qty: {svc.quantity}
                          </span>

                          <span>
                            ₹{svc.unit_price} × {svc.quantity} = ₹{svc.total_price}
                          </span>

                          {svc.estimated_minutes && (
                            <span>
                              Est. {svc.estimated_minutes} min
                            </span>
                          )}

                        </div>

                        <span className="mechanic-actual-badge">
                          ACTUAL
                        </span>

                      </div>

                    ))}

                  </div>
                )}

              </div>


              {/* -------------------------------------------
                  CONSUMABLES USED
              ------------------------------------------- */}

              <div className="mechanic-actual-section">

                <div className="mechanic-actual-section-head">

                  <FlaskConical
                    size={14}
                  />

                  <h5>
                    Consumables Used
                  </h5>

                  {workOrder.status === "IN_PROGRESS" && !isSubmitted && (
                    <AnimatedButton
                      type="button"
                      className="secondary-action mechanic-actual-add-btn"
                      onClick={() =>
                        setShowConsumableForm(
                          (open) => !open
                        )
                      }
                      disabled={addingConsumable}
                    >
                      <Plus
                        size={14}
                      />
                      {showConsumableForm
                        ? "Cancel"
                        : "Add Consumable"}
                    </AnimatedButton>
                  )}

                </div>


                {showConsumableForm &&
                  workOrder.status === "IN_PROGRESS" &&
                  !isSubmitted && (

                  <div className="mechanic-item-form">

                    <div className="mechanic-form-row mechanic-form-row-3">

                      <div className="mechanic-form-field">

                        <label>
                          Description
                        </label>

                        <input
                          type="text"
                          value={
                            consumableForm.description
                          }
                          onChange={(e) =>
                            setConsumableForm({
                              ...consumableForm,
                              description:
                                e.target.value,
                            })
                          }
                          placeholder="Required"
                          disabled={addingConsumable}
                        />

                      </div>


                      <div className="mechanic-form-field">

                        <label>
                          Quantity
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={
                            consumableForm.quantity
                          }
                          onChange={(e) =>
                            setConsumableForm({
                              ...consumableForm,
                              quantity:
                                e.target.value,
                            })
                          }
                          disabled={addingConsumable}
                        />

                      </div>


                      <div className="mechanic-form-field">

                        <label>
                          Unit Price (₹)
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            consumableForm.unitPrice
                          }
                          onChange={(e) =>
                            setConsumableForm({
                              ...consumableForm,
                              unitPrice:
                                e.target.value,
                            })
                          }
                          placeholder="Required"
                          disabled={addingConsumable}
                        />

                      </div>

                    </div>


                    {consumableError && (

                      <div className="mechanic-error">

                        <AlertCircle
                          size={15}
                        />

                        <span>
                          {consumableError}
                        </span>

                      </div>

                    )}


                    <div className="mechanic-form-actions">

                      <AnimatedButton
                        type="button"
                        className="primary-action"
                        onClick={
                          handleAddConsumable
                        }
                        disabled={addingConsumable}
                      >

                        {addingConsumable ? (
                          <LoaderCircle
                            size={16}
                            className="spin"
                          />
                        ) : (
                          <Plus
                            size={16}
                          />
                        )}

                        {addingConsumable
                          ? "Adding..."
                          : "Add Consumable"}

                      </AnimatedButton>

                    </div>

                  </div>

                )}


                {actualConsumables.length === 0 ? (
                  <p className="mechanic-actual-empty">
                    No consumables recorded yet.
                  </p>
                ) : (
                  <div className="mechanic-actual-items">

                    {actualConsumables.map((c) => (

                      <div
                        className="mechanic-actual-item"
                        key={c.id}
                      >

                        <div className="mechanic-actual-item-info">

                          <strong>
                            {c.description}
                          </strong>

                          <span>
                            Qty: {c.quantity}
                          </span>

                          <span>
                            ₹{c.unit_price} × {c.quantity} = ₹{c.total_price}
                          </span>

                        </div>

                        <span className="mechanic-actual-badge">
                          ACTUAL
                        </span>

                      </div>

                    ))}

                  </div>
                )}

              </div>


              {/* -------------------------------------------
                  LABOR
              ------------------------------------------- */}

              <div className="mechanic-actual-section">

                <div className="mechanic-actual-section-head">

                  <HardHat
                    size={14}
                  />

                  <h5>
                    Labor
                  </h5>

                  {workOrder.status === "IN_PROGRESS" && !isSubmitted && (
                    <AnimatedButton
                      type="button"
                      className="secondary-action mechanic-actual-add-btn"
                      onClick={() =>
                        setShowLaborForm(
                          (open) => !open
                        )
                      }
                      disabled={addingLabor}
                    >
                      <Plus
                        size={14}
                      />
                      {showLaborForm
                        ? "Cancel"
                        : "Add Labor"}
                    </AnimatedButton>
                  )}

                </div>


                {showLaborForm &&
                  workOrder.status === "IN_PROGRESS" &&
                  !isSubmitted && (

                  <div className="mechanic-item-form">

                    <div className="mechanic-form-field">

                      <label>
                        Description
                      </label>

                      <input
                        type="text"
                        value={
                          laborForm.description
                        }
                        onChange={(e) =>
                          setLaborForm({
                            ...laborForm,
                            description:
                              e.target.value,
                          })
                        }
                        placeholder="Required — e.g. Brake pad replacement"
                        disabled={addingLabor}
                      />

                    </div>


                    <div className="mechanic-form-field">

                      <label>
                        Hours
                      </label>

                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={
                          laborForm.quantity
                        }
                        onChange={(e) =>
                          setLaborForm({
                            ...laborForm,
                            quantity:
                              e.target.value,
                          })
                        }
                        disabled={addingLabor}
                      />

                    </div>


                    <p className="mechanic-actual-hint">
                      Labor rate: ₹1,000/hr
                      (backend-controlled).
                    </p>


                    {laborError && (

                      <div className="mechanic-error">

                        <AlertCircle
                          size={15}
                        />

                        <span>
                          {laborError}
                        </span>

                      </div>

                    )}


                    <div className="mechanic-form-actions">

                      <AnimatedButton
                        type="button"
                        className="primary-action"
                        onClick={handleAddLabor}
                        disabled={addingLabor}
                      >

                        {addingLabor ? (
                          <LoaderCircle
                            size={16}
                            className="spin"
                          />
                        ) : (
                          <Plus
                            size={16}
                          />
                        )}

                        {addingLabor
                          ? "Adding..."
                          : "Add Labor"}

                      </AnimatedButton>

                    </div>

                  </div>

                )}


                {actualLabor.length === 0 ? (
                  <p className="mechanic-actual-empty">
                    No labor entries recorded yet.
                  </p>
                ) : (
                  <div className="mechanic-actual-items">

                    {actualLabor.map((l) => (

                      <div
                        className="mechanic-actual-item"
                        key={l.id}
                      >

                        <div className="mechanic-actual-item-info">

                          <strong>
                            {l.description}
                          </strong>

                          <span>
                            Qty: {l.quantity}
                          </span>

                          <span>
                            ₹{l.unit_price} × {l.quantity} = ₹{l.total_price}
                          </span>

                          {l.estimated_minutes && (
                            <span>
                              Est. {l.estimated_minutes} min
                            </span>
                          )}

                        </div>

                        <span className="mechanic-actual-badge">
                          ACTUAL
                        </span>

                      </div>

                    ))}

                  </div>
                )}

              </div>


              {/* -------------------------------------------
                  ACTUAL WORK SUMMARY
              ------------------------------------------- */}

              {hasActualWork && (

                <div className="mechanic-actual-summary">

                  <h5>
                    Actual Work Summary
                  </h5>

                  <div className="mechanic-actual-summary-grid">

                    <div>
                      <span>Parts</span>
                      <strong>
                        {actualParts.length}
                      </strong>
                    </div>

                    <div>
                      <span>Services</span>
                      <strong>
                        {actualServices.length}
                      </strong>
                    </div>

                    <div>
                      <span>Consumables</span>
                      <strong>
                        {actualConsumables.length}
                      </strong>
                    </div>

                    <div>
                      <span>Labor Entries</span>
                      <strong>
                        {actualLabor.length}
                      </strong>
                    </div>

                  </div>

                  {!hasActualWork && workOrder.status === "IN_PROGRESS" && (
                    <p className="mechanic-actual-hint">
                      At least one actual work
                      item is required before
                      submitting for approval.
                    </p>
                  )}

                </div>

              )}

            </>

          )}

        </div>

      )}


      {/* =================================================
          INSPECTION PANEL
      ================================================= */}

      {inspectionOpen && (

        <div className="mechanic-inspection-panel">

          {!inspectionLoaded ? (

            <div className="mechanic-actual-loading">

              <LoaderCircle
                size={18}
                className="spin"
              />

              <span>
                Loading inspection...
              </span>

            </div>

          ) : !inspection ? (

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

                  <AnimatedButton
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

                  </AnimatedButton>


                  <AnimatedButton
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

                  </AnimatedButton>

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


                {canCreateInspection ? (
                  <AnimatedButton
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

                  </AnimatedButton>
                ) : (
                  <AnimatedButton
                    type="button"
                    className="primary-action"
                    disabled
                    title={`Cannot create inspection for work order status: ${workOrder?.status || "UNKNOWN"}`}
                  >
                    <Plus size={15} />
                    Create Inspection
                  </AnimatedButton>
                )}

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

                    <AnimatedButton
                      type="button"
                      onClick={() =>
                        loadItems(
                          inspection.id
                        )
                      }
                    >

                      Try Again

                    </AnimatedButton>

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


                <AnimatedButton
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

                </AnimatedButton>


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

                        <select
                          value={itemForm.severity}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              severity:
                                e.target.value,
                            })
                          }
                          disabled={addingItem}
                        >
                          <option value="">
                            Select severity
                          </option>
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>

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

                      <AnimatedButton
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

                      </AnimatedButton>

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

  const [partialWarning, setPartialWarning] =
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

      setPartialWarning("");


      const results =
        await Promise.allSettled(
          WORK_ORDER_STATUSES.map(
            (status) =>
              getWorkOrdersByStatus(
                status
              )
          )
        );


      const failedStatuses = [];

      const allItems = [];


      results.forEach(
        (result, index) => {

          if (
            result.status === "fulfilled"
          ) {

            const value =
              result.value;

            if (
              Array.isArray(value)
            ) {

              allItems.push(
                ...value
              );

            } else if (
              value != null &&
              typeof value ===
                "object"
            ) {

              console.warn(
                `Unexpected response for status ${WORK_ORDER_STATUSES[index]}:`,
                value
              );

              failedStatuses.push(
                WORK_ORDER_STATUSES[index]
              );

            }

          } else {

            console.error(
              `Failed to load work orders for status ${WORK_ORDER_STATUSES[index]}:`,
              result.reason
            );

            failedStatuses.push(
              WORK_ORDER_STATUSES[index]
            );

          }

        }
      );


      const seen = new Set();

      const unique =
        allItems
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


      if (
        failedStatuses.length ===
        WORK_ORDER_STATUSES.length
      ) {

        setError(
          "Unable to load work orders. All status requests failed."
        );

      } else if (
        failedStatuses.length > 0
      ) {

        setPartialWarning(
          `Some work orders could not be loaded (${failedStatuses.join(
            ", "
          )}). Showing available results.`
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
    submitted: workOrders.filter(
      (wo) =>
        wo.status === "SUBMITTED_FOR_APPROVAL"
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


          <AnimatedButton
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

          </AnimatedButton>

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

            <AnimatedButton
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

            </AnimatedButton>

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
              Submitted
            </span>

            <strong>
              {loading
                ? "…"
                : summary.submitted}
            </strong>

            <small>
              Awaiting advisor approval
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

              <AnimatedButton
                type="button"
                onClick={() =>
                  loadWorkOrders()
                }
              >

                Try Again

              </AnimatedButton>

            </div>

          )}


          {partialWarning && !loading && !error && (

            <div className="mechanic-warning">

              <AlertCircle
                size={16}
              />

              <span>
                {partialWarning}
              </span>

              <AnimatedButton
                type="button"
                onClick={() =>
                  loadWorkOrders()
                }
              >

                Retry

              </AnimatedButton>

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
