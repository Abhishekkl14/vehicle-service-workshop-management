import { useEffect, useState } from "react";

import {
  RefreshCw,
  CalendarDays,
  Clock3,
  Car,
  User,
  Wrench,
  ClipboardList,
  CheckCircle2,
  LoaderCircle,
  Plus,
  X,
  AlertCircle,
  MessageSquare,
  BookOpen,
  Settings2,
  ChevronUp,
  Package,
  FileText,
  Receipt,
  Send,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";

import {
  getBookingsByDate,
} from "../../api/bookingApi";

import {
  getWorkOrdersByStatus,
  createWorkOrder,
  getPendingApprovalWorkOrders,
  approveWorkOrder,
  rejectWorkOrder,
} from "../../api/workOrderApi";

import {
  getActiveParts,
  getWorkOrderParts,
  addWorkOrderPart,
} from "../../api/partApi";

import {
  getWorkOrderServices,
} from "../../api/serviceApi";

import {
  createEstimate,
  getWorkOrderEstimates,
  sendEstimate,
} from "../../api/estimateApi";

import {
  getWorkOrderInvoice,
  generateInvoice,
} from "../../api/invoiceApi";

import {
  getInspectionByWorkOrderId,
  getInspectionItems,
} from "../../api/inspectionApi";
import AnimatedButton from "../../components/ui/animated-button";


const WORK_ORDER_STATUSES = [
  "CREATED",
  "INSPECTION",
  "IN_PROGRESS",
  "SUBMITTED_FOR_APPROVAL",
  "COMPLETED",
];


const todayStr = () => {
  const now = new Date();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
};


const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const dateOnly =
    /^\d{4}-\d{2}-\d{2}$/.test(
      String(value)
    );

  if (dateOnly) {
    const [year, month, day] =
      String(value)
        .split("-")
        .map(Number);

    if (
      !year ||
      !month ||
      !day
    ) {
      return value;
    }

    return new Date(
      year,
      month - 1,
      day
    ).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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


const formatTime = (value) => {
  if (!value) {
    return "Not available";
  }

  const [hours, minutes] =
    String(value)
      .split(":")
      .map(Number);

  if (
    hours === undefined ||
    minutes === undefined ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return value;
  }

  const period =
    hours >= 12
      ? "PM"
      : "AM";

  const hour12 =
    hours % 12 === 0
      ? 12
      : hours % 12;

  return `${hour12}:${String(
    minutes
  ).padStart(2, "0")} ${period}`;
};


const formatCustomerName = (customer) => {
  const user = customer?.user;

  if (!user?.first_name) {
    return null;
  }

  return [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ");
};


const formatVehicleLabel = (vehicle) => {
  if (!vehicle?.registration_number) {
    return null;
  }

  const descriptor = [
    vehicle.make,
    vehicle.model,
    vehicle.manufacturing_year,
  ]
    .filter(Boolean)
    .join(" ");

  return descriptor
    ? `${vehicle.registration_number} · ${descriptor}`
    : vehicle.registration_number;
};


const getBookingStatusClass = (
  status
) => {
  const s = String(
    status || ""
  ).toUpperCase();

  if (s === "CONFIRMED") {
    return "booking-status confirmed";
  }

  if (
    s === "COMPLETED" ||
    s === "VEHICLE_RECEIVED"
  ) {
    return "booking-status completed";
  }

  if (s === "CANCELLED") {
    return "booking-status cancelled";
  }

  return "booking-status pending";
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


const getEstimateStatusClass = (
  status
) => {
  const s = String(
    status || ""
  ).toUpperCase();

  if (s === "APPROVED") {
    return "booking-status confirmed";
  }

  if (s === "SENT") {
    return "booking-status completed";
  }

  if (s === "REJECTED") {
    return "booking-status cancelled";
  }

  return "booking-status pending";
};


const getInvoiceStatusClass = (
  status
) => {
  const s = String(
    status || ""
  ).toUpperCase();

  if (s === "PAID") {
    return "booking-status confirmed";
  }

  return "booking-status pending";
};


/* =====================================================
   WORK ORDER WORKFLOW
   Parts management + estimate creation/sending
   ===================================================== */

function WorkOrderWorkflow({ workOrder }) {

  const workOrderId = workOrder.id;

  const isCompleted =
    workOrder.status === "COMPLETED";

  const [expanded, setExpanded] = useState(false);

  const [parts, setParts] = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [partsError, setPartsError] = useState("");

  const [activeParts, setActiveParts] = useState([]);
  const [activePartsLoading, setActivePartsLoading] = useState(false);

  const [selectedPartId, setSelectedPartId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [addingPart, setAddingPart] = useState(false);
  const [partFormError, setPartFormError] = useState("");
  const [partSuccess, setPartSuccess] = useState("");

  const [estimates, setEstimates] = useState([]);
  const [estimatesLoading, setEstimatesLoading] = useState(false);
  const [estimatesError, setEstimatesError] = useState("");

  const [discount, setDiscount] = useState("");
  const [creatingEstimate, setCreatingEstimate] = useState(false);
  const [estimateFormError, setEstimateFormError] = useState("");
  const [estimateSuccess, setEstimateSuccess] = useState("");
  const [createdEstimateId, setCreatedEstimateId] = useState(null);

  const [sendingEstimateId, setSendingEstimateId] = useState(null);
  const [sendError, setSendError] = useState("");

  const [invoice, setInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [invoiceSuccess, setInvoiceSuccess] = useState("");

  const hasParts = parts.length > 0;

  const partById = new Map(
    activeParts.map((part) => [part.id, part])
  );


  const loadParts = async () => {

    setPartsLoading(true);

    setPartsError("");

    try {

      const data =
        await getWorkOrderParts(
          workOrderId
        );

      setParts(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        `Failed to load parts for work order #${workOrderId}:`,
        err
      );

      setPartsError(
        err?.response?.data?.detail ||
          "Unable to load parts."
      );

    } finally {

      setPartsLoading(false);

    }
  };


  const loadEstimates = async () => {

    setEstimatesLoading(true);

    setEstimatesError("");

    try {

      const data =
        await getWorkOrderEstimates(
          workOrderId
        );

      setEstimates(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        `Failed to load estimates for work order #${workOrderId}:`,
        err
      );

      setEstimatesError(
        err?.response?.data?.detail ||
          "Unable to load estimates."
      );

    } finally {

      setEstimatesLoading(false);

    }
  };


  const loadActiveParts = async () => {

    setActivePartsLoading(true);

    try {

      const data =
        await getActiveParts();

      setActiveParts(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        "Failed to load active parts catalog:",
        err
      );

    } finally {

      setActivePartsLoading(false);

    }
  };


  const loadInvoice = async () => {

    setInvoiceLoading(true);

    setInvoiceError("");

    try {

      const data =
        await getWorkOrderInvoice(
          workOrderId
        );

      setInvoice(data);

    } catch (err) {

      if (err?.response?.status === 404) {

        setInvoice(null);

      } else {

        console.error(
          `Failed to load invoice for work order #${workOrderId}:`,
          err
        );

        setInvoiceError(
          err?.response?.data?.detail ||
            "Unable to load the invoice."
        );

      }

    } finally {

      setInvoiceLoading(false);

    }
  };


  const loadAll = () => {

    loadParts();

    loadEstimates();

    loadActiveParts();

    if (isCompleted) {

      loadInvoice();

    }

  };


  useEffect(() => {

    if (expanded) {

      loadAll();

    }

  }, [expanded]);


  const handleToggle = () => {

    setExpanded(
      (prev) => !prev
    );

  };


  const handleAddPart = async () => {

    if (addingPart) {
      return;
    }

    const partId =
      Number(selectedPartId);

    if (
      !Number.isInteger(partId) ||
      partId <= 0
    ) {

      setPartFormError(
        "Select a part."
      );

      return;
    }

    const quantityValue =
      Number(quantity);

    if (
      !Number.isInteger(quantityValue) ||
      quantityValue < 1
    ) {

      setPartFormError(
        "Quantity must be a whole number of at least 1."
      );

      return;
    }

    setAddingPart(true);

    setPartFormError("");

    setPartSuccess("");

    try {

      await addWorkOrderPart(
        workOrderId,
        {
          part_id: partId,
          quantity: quantityValue,
        }
      );

      setSelectedPartId("");

      setQuantity("1");

      setPartSuccess(
        "Part added to the work order."
      );

      await loadParts();

    } catch (err) {

      console.error(
        `Failed to add part to work order #${workOrderId}:`,
        err
      );

      setPartFormError(
        err?.response?.data?.detail ||
          "Unable to add the part. Please try again."
      );

    } finally {

      setAddingPart(false);

    }
  };


  const handleCreateEstimate = async () => {

    if (creatingEstimate) {
      return;
    }

    if (!hasParts) {

      setEstimateFormError(
        "Add at least one part before creating an estimate."
      );

      return;
    }

    let discountValue = 0;

    if (discount.trim() !== "") {

      discountValue =
        Number(discount);

      if (
        Number.isNaN(discountValue) ||
        discountValue < 0
      ) {

        setEstimateFormError(
          "Discount must be zero or more."
        );

        return;
      }

    }

    setCreatingEstimate(true);

    setEstimateFormError("");

    setEstimateSuccess("");

    try {

      const created =
        await createEstimate({
          work_order_id: workOrderId,
          discount_amount: discountValue,
        });

      setCreatedEstimateId(
        created.id
      );

      setDiscount("");

      setEstimateSuccess(
        `Estimate #${created.id} created as DRAFT.`
      );

      await loadEstimates();

    } catch (err) {

      console.error(
        `Failed to create estimate for work order #${workOrderId}:`,
        err
      );

      setEstimateFormError(
        err?.response?.data?.detail ||
          "Unable to create the estimate. Please try again."
      );

    } finally {

      setCreatingEstimate(false);

    }
  };


  const handleSendEstimate = async (
    estimateId
  ) => {

    if (sendingEstimateId) {
      return;
    }

    setSendingEstimateId(
      estimateId
    );

    setSendError("");

    try {

      await sendEstimate(
        estimateId
      );

      setEstimateSuccess(
        `Estimate #${estimateId} sent to the customer.`
      );

      await loadEstimates();

    } catch (err) {

      console.error(
        `Failed to send estimate #${estimateId}:`,
        err
      );

      setSendError(
        err?.response?.data?.detail ||
          "Unable to send the estimate. Please try again."
      );

    } finally {

      setSendingEstimateId(null);

    }
  };


  const openConfirm = () => {

    setGenerationError("");

    setConfirmOpen(true);

  };


  const closeConfirm = () => {

    if (generating) {
      return;
    }

    setConfirmOpen(false);

    setGenerationError("");

  };


  const handleGenerateInvoice = async () => {

    if (generating) {
      return;
    }

    setGenerating(true);

    setGenerationError("");

    setInvoiceSuccess("");

    try {

      const created =
        await generateInvoice(
          workOrderId
        );

      setInvoice(created);

      setConfirmOpen(false);

      setInvoiceSuccess(
        `Invoice ${created.invoice_number} generated for Work Order #${workOrderId}.`
      );

    } catch (err) {

      const detail =
        err?.response?.data?.detail ||
          "Unable to generate the invoice. Please try again.";

      console.error(
        `Failed to generate invoice for work order #${workOrderId}:`,
        err
      );

      setGenerationError(detail);

      if (
        err?.response?.status === 400 &&
        /already exists/i.test(detail)
      ) {

        setConfirmOpen(false);

        loadInvoice();

      }

    } finally {

      setGenerating(false);

    }
  };


  const selectedPart =
    partById.get(
      Number(selectedPartId)
    );


  return (
    <>

      <div className="advisor-card-footer">

        <AnimatedButton
          type="button"
          className="secondary-action"
          onClick={handleToggle}
        >

          {expanded ? (
            <ChevronUp
              size={16}
            />
          ) : (
            <Settings2
              size={16}
            />
          )}

          {expanded
            ? "Hide Workflow"
            : "Manage Workflow"}

        </AnimatedButton>

      </div>


      {expanded && (

        <div className="advisor-workflow">

          <div className="advisor-workflow-grid">

            {/* =============================================
                PARTS PANEL
            ============================================= */}

            <div className="advisor-workflow-panel">

              <div className="advisor-workflow-panel-head">

                <h3>

                  <Package
                    size={16}
                  />

                  Work Order Parts

                </h3>


                <AnimatedButton
                  type="button"
                  className="secondary-action advisor-workflow-reload"
                  onClick={loadParts}
                  disabled={partsLoading}
                >

                  <RefreshCw
                    size={14}
                    className={
                      partsLoading
                        ? "spin"
                        : ""
                    }
                  />

                  Refresh

                </AnimatedButton>

              </div>


              {partSuccess && (

                <div className="advisor-success">

                  <CheckCircle2
                    size={16}
                  />

                  <span>
                    {partSuccess}
                  </span>

                </div>

              )}


              {partFormError && (

                <div className="advisor-error">

                  <AlertCircle
                    size={16}
                  />

                  <span>
                    {partFormError}
                  </span>

                </div>

              )}


              {partsError && !partsLoading && (

                <div className="advisor-error">

                  <AlertCircle
                    size={16}
                  />

                  <span>
                    {partsError}
                  </span>

                  <AnimatedButton
                    type="button"
                    onClick={loadParts}
                  >
                    Try Again
                  </AnimatedButton>

                </div>

              )}


              {partsLoading ? (

                <div className="advisor-workflow-loading">

                  <LoaderCircle
                    size={18}
                    className="spin"
                  />

                  Loading parts...

                </div>

              ) : parts.length === 0 ? (

                <div className="advisor-workflow-empty">

                  <Package
                    size={22}
                  />

                  <p>
                    No parts have been added
                    to this work order yet.
                  </p>

                </div>

              ) : (

                <div className="advisor-part-table-wrap">

                  <table className="advisor-part-table">

                    <thead>

                      <tr>

                        <th>
                          Part Number
                        </th>

                        <th>
                          Part Name
                        </th>

                        <th>
                          Qty
                        </th>

                        <th>
                          Unit Price
                        </th>

                        <th>
                          Total Price
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {parts.map((wop) => {

                        const catalog =
                          partById.get(
                            wop.part_id
                          );

                        return (

                          <tr key={wop.id}>

                            <td>
                              {catalog?.part_number ??
                                `#${wop.part_id}`}
                            </td>

                            <td>
                              {catalog?.name ??
                                `Part #${wop.part_id}`}
                            </td>

                            <td>
                              {wop.quantity}
                            </td>

                            <td>
                              {formatCurrency(
                                wop.unit_price
                              )}
                            </td>

                            <td>
                              {formatCurrency(
                                wop.total_price
                              )}
                            </td>

                          </tr>

                        );

                      })}

                    </tbody>

                  </table>

                </div>

              )}


              {/* ADD PART */}

              <div className="advisor-create-estimate">

                <h4>
                  Add Part
                </h4>

                <div className="advisor-part-form-row">

                  <div className="advisor-form-field">

                    <label htmlFor={`part-select-${workOrderId}`}>
                      Part
                    </label>

                    <select
                      id={`part-select-${workOrderId}`}
                      value={selectedPartId}
                      onChange={(e) => {

                        setSelectedPartId(
                          e.target.value
                        );

                        setPartFormError("");

                      }}
                      disabled={
                        addingPart ||
                        activePartsLoading
                      }
                    >

                      <option value="">
                        {activePartsLoading
                          ? "Loading parts..."
                          : "Select a part"}
                      </option>

                      {activeParts.map((part) => {

                        const unavailable =
                          !part.is_active ||
                          part.stock_quantity < 1;

                        return (

                          <option
                            key={part.id}
                            value={part.id}
                            disabled={unavailable}
                          >

                            {part.part_number} ·{" "}
                            {part.name} ·{" "}
                            {formatCurrency(
                              part.unit_price
                            )}

                            {unavailable
                              ? " (out of stock)"
                              : ""}

                          </option>

                        );

                      })}

                    </select>

                  </div>


                  <div className="advisor-form-field advisor-quantity-field">

                    <label htmlFor={`part-qty-${workOrderId}`}>
                      Quantity
                    </label>

                    <input
                      id={`part-qty-${workOrderId}`}
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => {

                        setQuantity(
                          e.target.value
                        );

                        setPartFormError("");

                      }}
                      disabled={addingPart}
                    />

                  </div>


                  <AnimatedButton
                    type="button"
                    className="primary-action"
                    onClick={handleAddPart}
                    disabled={
                      addingPart ||
                      activePartsLoading
                    }
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


                {selectedPart && (

                  <div className="advisor-stock-hint">

                    In stock:{" "}
                    {selectedPart.stock_quantity}{" "}
                    · Unit price:{" "}
                    {formatCurrency(
                      selectedPart.unit_price
                    )}

                  </div>

                )}

              </div>

            </div>


            {/* =============================================
                ESTIMATE PANEL
            ============================================= */}

            <div className="advisor-workflow-panel">

              <div className="advisor-workflow-panel-head">

                <h3>

                  <FileText
                    size={16}
                  />

                  Estimates

                </h3>


                <AnimatedButton
                  type="button"
                  className="secondary-action advisor-workflow-reload"
                  onClick={loadEstimates}
                  disabled={estimatesLoading}
                >

                  <RefreshCw
                    size={14}
                    className={
                      estimatesLoading
                        ? "spin"
                        : ""
                    }
                  />

                  Refresh

                </AnimatedButton>

              </div>


              {estimateSuccess && (

                <div className="advisor-success">

                  <CheckCircle2
                    size={16}
                  />

                  <span>
                    {estimateSuccess}
                  </span>

                </div>

              )}


              {estimateFormError && (

                <div className="advisor-error">

                  <AlertCircle
                    size={16}
                  />

                  <span>
                    {estimateFormError}
                  </span>

                </div>

              )}


              {sendError && (

                <div className="advisor-error">

                  <AlertCircle
                    size={16}
                  />

                  <span>
                    {sendError}
                  </span>

                </div>

              )}


              {estimatesError && !estimatesLoading && (

                <div className="advisor-error">

                  <AlertCircle
                    size={16}
                  />

                  <span>
                    {estimatesError}
                  </span>

                  <AnimatedButton
                    type="button"
                    onClick={loadEstimates}
                  >
                    Try Again
                  </AnimatedButton>

                </div>

              )}


              {estimatesLoading ? (

                <div className="advisor-workflow-loading">

                  <LoaderCircle
                    size={18}
                    className="spin"
                  />

                  Loading estimates...

                </div>

              ) : estimates.length === 0 ? (

                <div className="advisor-workflow-empty">

                  <FileText
                    size={22}
                  />

                  <p>
                    No estimates yet for
                    this work order.
                  </p>

                </div>

              ) : (

                <div className="advisor-estimate-list">

                  {estimates.map((estimate) => {

                    const isCreated =
                      createdEstimateId ===
                      estimate.id;

                    const canSend =
                      estimate.status === "DRAFT";

                    return (

                      <div
                        className="advisor-estimate-card"
                        key={estimate.id}
                      >

                        <div className="advisor-estimate-row">

                          <strong>
                            Estimate #{estimate.id}
                          </strong>


                          <span
                            className={getEstimateStatusClass(
                              estimate.status
                            )}
                          >

                            {estimate.status ||
                              "UNKNOWN"}

                          </span>

                        </div>


                        {isCreated && (

                          <p className="advisor-created-chip advisor-created-estimate">

                            <CheckCircle2
                              size={13}
                            />

                            Just created

                          </p>

                        )}


                        <div className="advisor-estimate-totals">

                          <div>

                            <span>
                              Subtotal
                            </span>

                            <strong>
                              {formatCurrency(
                                estimate.subtotal
                              )}
                            </strong>

                          </div>


                          <div>

                            <span>
                              Tax
                            </span>

                            <strong>
                              {formatCurrency(
                                estimate.tax_amount
                              )}
                            </strong>

                          </div>


                          <div>

                            <span>
                              Discount
                            </span>

                            <strong>
                              {formatCurrency(
                                estimate.discount_amount
                              )}
                            </strong>

                          </div>


                          <div>

                            <span>
                              Total
                            </span>

                            <strong>
                              {formatCurrency(
                                estimate.total_amount
                              )}
                            </strong>

                          </div>


                          <div>

                            <span>
                              Est. Duration
                            </span>

                            <strong>
                              {estimate.estimated_duration_minutes}{" "}
                              min
                            </strong>

                          </div>

                        </div>


                        {canSend ? (

                          <div className="advisor-estimate-actions">

                            <AnimatedButton
                              type="button"
                              className="primary-action"
                              onClick={() =>
                                handleSendEstimate(
                                  estimate.id
                                )
                              }
                              disabled={
                                sendingEstimateId !==
                                null
                              }
                            >

                              {sendingEstimateId ===
                              estimate.id ? (
                                <LoaderCircle
                                  size={16}
                                  className="spin"
                                />
                              ) : (
                                <Send
                                  size={16}
                                />
                              )}

                              {sendingEstimateId ===
                              estimate.id
                                ? "Sending..."
                                : "Send Estimate"}

                            </AnimatedButton>

                          </div>

                        ) : (

                          <div className="advisor-estimate-sent-note">

                            <CheckCircle2
                              size={14}
                            />

                            {estimate.status ===
                            "SENT"
                              ? "Estimate sent to the customer."
                              : `Estimate status: ${estimate.status}.`}

                          </div>

                        )}

                      </div>

                    );

                  })}

                </div>

              )}


              {/* CREATE ESTIMATE */}

              <div className="advisor-create-estimate">

                <h4>
                  Create Estimate
                </h4>

                <div className="advisor-part-form-row">

                  <div className="advisor-form-field advisor-discount-field">

                    <label htmlFor={`estimate-discount-${workOrderId}`}>
                      Discount (optional)
                    </label>

                    <input
                      id={`estimate-discount-${workOrderId}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => {

                        setDiscount(
                          e.target.value
                        );

                        setEstimateFormError("");

                      }}
                      placeholder="0.00"
                      disabled={
                        creatingEstimate ||
                        !hasParts
                      }
                    />

                  </div>


                  <AnimatedButton
                    type="button"
                    className="primary-action"
                    onClick={handleCreateEstimate}
                    disabled={
                      creatingEstimate ||
                      !hasParts
                    }
                  >

                    {creatingEstimate ? (
                      <LoaderCircle
                        size={16}
                        className="spin"
                      />
                    ) : (
                      <Plus
                        size={16}
                      />
                    )}

                    {creatingEstimate
                      ? "Creating..."
                      : "Create Estimate"}

                  </AnimatedButton>

                </div>


                {!hasParts && (

                  <p className="advisor-workflow-note">

                    Add at least one part before
                    creating an estimate.

                  </p>

                )}

              </div>

            </div>

          </div>


          {/* =============================================
              INVOICE PANEL
          ============================================= */}

          {isCompleted && (

            <div className="advisor-workflow-panel advisor-invoice-panel">

              <div className="advisor-workflow-panel-head">

                <h3>

                  <Receipt
                    size={16}
                  />

                  Invoice

                </h3>


                {invoice && !invoiceLoading && (

                  <AnimatedButton
                    type="button"
                    className="secondary-action advisor-workflow-reload"
                    onClick={loadInvoice}
                    disabled={invoiceLoading}
                  >

                    <RefreshCw
                      size={14}
                    />

                    Refresh

                  </AnimatedButton>

                )}

              </div>


              {invoiceSuccess && (

                <div className="advisor-success">

                  <CheckCircle2
                    size={16}
                  />

                  <span>
                    {invoiceSuccess}
                  </span>

                </div>

              )}


              {generationError && (

                <div className="advisor-error">

                  <AlertCircle
                    size={16}
                  />

                  <span>
                    {generationError}
                  </span>

                </div>

              )}


              {invoiceError && !invoiceLoading && (

                <div className="advisor-error">

                  <AlertCircle
                    size={16}
                  />

                  <span>
                    {invoiceError}
                  </span>

                  <AnimatedButton
                    type="button"
                    onClick={loadInvoice}
                  >

                    Try Again

                  </AnimatedButton>

                </div>

              )}


              {invoiceLoading ? (

                <div className="advisor-workflow-loading">

                  <LoaderCircle
                    size={18}
                    className="spin"
                  />

                  Checking for an existing invoice...

                </div>

              ) : invoice ? (

                <div className="advisor-invoice-card">

                  <div className="advisor-invoice-row">

                    <strong>
                      {invoice.invoice_number}
                    </strong>

                    <span
                      className={getInvoiceStatusClass(
                        invoice.status
                      )}
                    >

                      {invoice.status ||
                        "UNKNOWN"}

                    </span>

                  </div>


                  <div className="advisor-invoice-totals">

                    <div>

                      <span>
                        Subtotal
                      </span>

                      <strong>
                        {formatCurrency(
                          invoice.subtotal
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Tax
                      </span>

                      <strong>
                        {formatCurrency(
                          invoice.tax_amount
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Discount
                      </span>

                      <strong>
                        {formatCurrency(
                          invoice.discount_amount
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Total
                      </span>

                      <strong>
                        {formatCurrency(
                          invoice.total_amount
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Issued
                      </span>

                      <strong>
                        {formatDate(
                          invoice.issued_at
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Due
                      </span>

                      <strong>
                        {invoice.due_at
                          ? formatDate(
                              invoice.due_at
                            )
                          : "Not specified"}
                      </strong>

                    </div>

                  </div>

                </div>

              ) : (

                <div className="advisor-invoice-actions">

                  <AnimatedButton
                    type="button"
                    className="primary-action"
                    onClick={openConfirm}
                    disabled={
                      invoiceLoading ||
                      generating
                    }
                  >

                    <Receipt
                      size={16}
                    />

                    Generate Invoice

                  </AnimatedButton>


                  <p className="advisor-workflow-note">

                    Generate the invoice for this
                    completed work order. Amounts
                    come from actual work performed.

                  </p>

                </div>

              )}

            </div>

          )}

        </div>

      )}


      {/* =================================================
          GENERATE INVOICE CONFIRMATION
      ================================================= */}

      {confirmOpen && (

        <div
          className="modal-overlay"
          onClick={closeConfirm}
        >

          <div
            className="modal-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  Generate Invoice
                </h2>

                <p>
                  Work Order #{workOrderId}
                </p>

              </div>


              <AnimatedButton
                type="button"
                className="modal-close"
                onClick={closeConfirm}
                disabled={generating}
                aria-label="Close"
              >

                <X
                  size={18}
                />

              </AnimatedButton>

            </div>


            <div className="modal-body">

              <p className="advisor-confirm-text">

                Generate invoice for Work Order #{workOrderId}?

              </p>


              {generationError && (

                <div className="advisor-error">

                  <AlertCircle
                    size={16}
                  />

                  <span>
                    {generationError}
                  </span>

                </div>

              )}

            </div>


            <div className="modal-actions">

              <AnimatedButton
                type="button"
                className="secondary-action"
                onClick={closeConfirm}
                disabled={generating}
              >

                Cancel

              </AnimatedButton>


              <AnimatedButton
                type="button"
                className="primary-action"
                onClick={handleGenerateInvoice}
                disabled={generating}
              >

                {generating ? (
                  <LoaderCircle
                    size={17}
                    className="spin"
                  />
                ) : (
                  <Receipt
                    size={17}
                  />
                )}

                {generating
                  ? "Generating..."
                  : "Generate Invoice"}

              </AnimatedButton>

            </div>

          </div>

        </div>

      )}

    </>
  );
}


export default function AdvisorDashboard() {

  const { user } = useAuth();

  const navigate = useNavigate();


  const [selectedDate, setSelectedDate] =
    useState(todayStr());


  const [bookings, setBookings] =
    useState([]);

  const [bookingsLoading, setBookingsLoading] =
    useState(true);

  const [bookingsError, setBookingsError] =
    useState("");


  const [workOrders, setWorkOrders] =
    useState([]);

  const [workOrdersLoading, setWorkOrdersLoading] =
    useState(true);

  const [workOrdersError, setWorkOrdersError] =
    useState("");


  const [pendingApprovals, setPendingApprovals] =
    useState([]);

  const [pendingLoading, setPendingLoading] =
    useState(true);

  const [pendingError, setPendingError] =
    useState("");

  const [expandedWO, setExpandedWO] =
    useState(null);

  const [woParts, setWoParts] =
    useState({});

  const [woServices, setWoServices] =
    useState({});

  const [woInspection, setWoInspection] =
    useState({});

  const [loadingDetails, setLoadingDetails] =
    useState({});

  const [approvingId, setApprovingId] =
    useState(null);

  const [rejectModalWO, setRejectModalWO] =
    useState(null);

  const [rejectReason, setRejectReason] =
    useState("");

  const [rejecting, setRejecting] =
    useState(false);

  const [pendingActionError, setPendingActionError] =
    useState("");

  const [approveComment, setApproveComment] =
    useState("");


  const [modalBooking, setModalBooking] =
    useState(null);

  const [complaint, setComplaint] =
    useState("");

  const [mechanicId, setMechanicId] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  const [createError, setCreateError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  /* =====================================================
     LOAD BOOKINGS FOR DATE
  ===================================================== */

  const loadBookings = async () => {

    try {

      setBookingsLoading(true);

      setBookingsError("");


      const data =
        await getBookingsByDate(
          selectedDate
        );


      setBookings(
        Array.isArray(data)
          ? data
          : data?.items || []
      );

    } catch (err) {

      console.error(
        "Failed to load bookings:",
        err
      );


      setBookingsError(
        err?.response?.data?.detail ||
          "Unable to load bookings."
      );

    } finally {

      setBookingsLoading(false);

    }
  };


  /* =====================================================
     LOAD WORK ORDERS BY STATUS
  ===================================================== */

  const loadWorkOrders = async () => {

    try {

      setWorkOrdersLoading(true);

      setWorkOrdersError("");


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

    } catch (err) {

      console.error(
        "Failed to load work orders:",
        err
      );


      setWorkOrdersError(
        err?.response?.data?.detail ||
          "Unable to load work orders."
      );

    } finally {

      setWorkOrdersLoading(false);

    }
  };


  /* =====================================================
     LOAD PENDING APPROVALS
  ===================================================== */

  const loadPendingApprovals = async () => {

    try {

      setPendingLoading(true);

      setPendingError("");

      const data =
        await getPendingApprovalWorkOrders();

      setPendingApprovals(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        "Failed to load pending approvals:",
        err
      );

      setPendingError(
        err?.response?.data?.detail ||
          "Unable to load pending approvals."
      );

    } finally {

      setPendingLoading(false);

    }
  };


  /* =====================================================
     EXPAND / LOAD DETAILS
  ===================================================== */

  const toggleExpandWO = async (woId) => {

    if (expandedWO === woId) {

      setExpandedWO(null);

      return;
    }

    setExpandedWO(woId);

    if (woParts[woId] || woServices[woId] || woInspection[woId] !== undefined) {
      return;
    }

    setLoadingDetails((prev) => ({
      ...prev,
      [woId]: true,
    }));

    try {

      const [parts, services, inspection] =
        await Promise.all([
          getWorkOrderParts(woId).catch(
            () => []
          ),
          getWorkOrderServices(woId).catch(
            () => []
          ),
          getInspectionByWorkOrderId(woId).catch(
            () => null
          ),
        ]);

      setWoParts((prev) => ({
        ...prev,
        [woId]: Array.isArray(parts)
          ? parts
          : [],
      }));

      setWoServices((prev) => ({
        ...prev,
        [woId]: Array.isArray(services)
          ? services
          : [],
      }));

      let inspectionData = null;

      if (inspection && inspection.id) {

        const items =
          await getInspectionItems(
            inspection.id
          ).catch(() => []);

        inspectionData = {
          ...inspection,
          items: Array.isArray(items)
            ? items
            : [],
        };

      }

      setWoInspection((prev) => ({
        ...prev,
        [woId]: inspectionData,
      }));

    } catch (err) {

      console.error(
        `Failed to load details for WO #${woId}:`,
        err
      );

    } finally {

      setLoadingDetails((prev) => ({
        ...prev,
        [woId]: false,
      }));

    }
  };


  /* =====================================================
     APPROVE / REJECT
  ===================================================== */

  const handleApprove = async (woId) => {

    if (approvingId) {
      return;
    }

    try {

      setApprovingId(woId);

      setPendingActionError("");

      await approveWorkOrder(
        woId,
        approveComment.trim() || null
      );

      setSuccessMessage(
        `Work Order #${woId} approved. Invoice can now be generated.`
      );

      setApproveComment("");

      await loadPendingApprovals();

    } catch (err) {

      console.error(
        `Failed to approve WO #${woId}:`,
        err
      );

      setPendingActionError(
        err?.response?.data?.detail ||
          "Unable to approve work order."
      );

    } finally {

      setApprovingId(null);

    }
  };


  const openRejectModal = (wo) => {

    setRejectModalWO(wo);

    setRejectReason("");

    setPendingActionError("");

  };


  const closeRejectModal = () => {

    if (rejecting) {
      return;
    }

    setRejectModalWO(null);

    setRejectReason("");

  };


  const handleReject = async () => {

    if (rejecting || !rejectModalWO) {
      return;
    }

    const reason = rejectReason.trim();

    if (!reason) {

      setPendingActionError(
        "Rejection reason is required."
      );

      return;
    }

    try {

      setRejecting(true);

      setPendingActionError("");

      await rejectWorkOrder(
        rejectModalWO.id,
        reason
      );

      setSuccessMessage(
        `Work Order #${rejectModalWO.id} rejected. Mechanic has been notified.`
      );

      setRejectModalWO(null);

      setRejectReason("");

      await loadPendingApprovals();

    } catch (err) {

      console.error(
        `Failed to reject WO #${rejectModalWO.id}:`,
        err
      );

      setPendingActionError(
        err?.response?.data?.detail ||
          "Unable to reject work order."
      );

    } finally {

      setRejecting(false);

    }
  };


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    loadBookings();

    loadWorkOrders();

    loadPendingApprovals();

  }, []);


  /* =====================================================
     DATE CHANGE
  ===================================================== */

  useEffect(() => {

    if (selectedDate) {

      loadBookings();

    }

  }, [selectedDate]);


  const handleRefresh = () => {

    loadBookings();

    loadWorkOrders();

    loadPendingApprovals();

  };


  /* =====================================================
     DERIVED DATA
  ===================================================== */

  const workOrderBookingIds =
    new Set(
      workOrders.map(
        (wo) => wo.booking_id
      )
    );


  const summary = {
    bookings: bookings.length,
    workOrders: workOrders.length,
    inProgress: workOrders.filter(
      (wo) =>
        wo.status === "IN_PROGRESS"
    ).length,
    pendingApproval: pendingApprovals.length,
    completed: workOrders.filter(
      (wo) =>
        wo.status === "COMPLETED"
    ).length,
  };


  /* =====================================================
     CREATE WORK ORDER
  ===================================================== */

  const openCreateModal = (
    booking
  ) => {

    setModalBooking(booking);

    setComplaint("");

    setMechanicId("");

    setCreateError("");

  };


  const closeCreateModal = () => {

    if (creating) {
      return;
    }

    setModalBooking(null);

    setCreateError("");

  };


  const handleCreateWorkOrder = async () => {

    if (!modalBooking || creating) {
      return;
    }

    const mechanicValue =
      mechanicId.trim();

    let parsedMechanic = null;

    if (mechanicValue) {

      parsedMechanic =
        Number(mechanicValue);

      if (
        !Number.isInteger(
          parsedMechanic
        ) ||
        parsedMechanic <= 0
      ) {

        setCreateError(
          "Mechanic ID must be a positive number."
        );

        return;
      }

    }


    try {

      setCreating(true);

      setCreateError("");


      const created =
        await createWorkOrder({
          booking_id: modalBooking.id,
          vehicle_id: modalBooking.vehicle_id,
          complaint:
            complaint.trim() || null,
          mechanic_id: parsedMechanic,
        });


      setSuccessMessage(
        `Work order #${created.id} created for Booking #${modalBooking.id}.`
      );

      setModalBooking(null);

      setComplaint("");

      setMechanicId("");


      await Promise.all([
        loadBookings(),
        loadWorkOrders(),
      ]);

    } catch (err) {

      console.error(
        "Failed to create work order:",
        err
      );


      setCreateError(
        err?.response?.data?.detail ||
          "Unable to create work order. Please try again."
      );

    } finally {

      setCreating(false);

    }
  };


  return (
    <AppLayout>

      <div className="advisor-dashboard advisor-dashboard-scope">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="advisor-header">

          <div>

            <p className="page-eyebrow">
              SERVICE ADVISOR
            </p>


            <h1>
              Welcome, {user?.first_name}
            </h1>


            <p>
              Manage today's workshop
              operations and service workflow.
            </p>

          </div>


          <AnimatedButton
            type="button"
            className="secondary-action"
            onClick={handleRefresh}
            disabled={
              bookingsLoading ||
              workOrdersLoading
            }
          >

            <RefreshCw
              size={16}
              className={
                bookingsLoading ||
                workOrdersLoading
                  ? "spin"
                  : ""
              }
            />

            Refresh

          </AnimatedButton>

        </div>


        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {successMessage && (

          <div className="advisor-success">

            <CheckCircle2
              size={18}
            />

            <span>
              {successMessage}
            </span>

            <AnimatedButton
              type="button"
              className="advisor-success-close"
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
            DATE FILTER
        ================================================= */}

        <div className="advisor-date-filter">

          <label htmlFor="advisor-booking-date">
            Booking Date
          </label>

          <div className="advisor-date-controls">

            <div className="advisor-date-input">

              <CalendarDays
                size={16}
              />

              <input
                id="advisor-booking-date"
                type="date"
                value={selectedDate}
                onChange={(e) =>
                  setSelectedDate(
                    e.target.value
                  )
                }
              />

            </div>


            <AnimatedButton
              type="button"
              className="secondary-action"
              onClick={() =>
                setSelectedDate(
                  todayStr()
                )
              }
              disabled={
                selectedDate ===
                todayStr()
              }
            >

              Today

            </AnimatedButton>

          </div>

        </div>


        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="dashboard-grid advisor-summary-grid">

          <div className="dashboard-card">

            <span>
              Today's Bookings
            </span>

            <strong>
              {bookingsLoading
                ? "…"
                : summary.bookings}
            </strong>

            <small>
              On {formatDate(selectedDate)}
            </small>

          </div>


          <div className="dashboard-card">

            <span>
              Work Orders
            </span>

            <strong>
              {workOrdersLoading
                ? "…"
                : summary.workOrders}
            </strong>

            <small>
              Across the workshop
            </small>

          </div>


          <div className="dashboard-card">

            <span>
              In Progress
            </span>

            <strong>
              {workOrdersLoading
                ? "…"
                : summary.inProgress}
            </strong>

            <small>
              Currently being worked on
            </small>

          </div>


          <div className="dashboard-card">

            <span>
              Pending Approval
            </span>

            <strong>
              {pendingLoading
                ? "…"
                : summary.pendingApproval}
            </strong>

            <small>
              Awaiting your decision
            </small>

          </div>


          <div className="dashboard-card">

            <span>
              Completed
            </span>

            <strong>
              {workOrdersLoading
                ? "…"
                : summary.completed}
            </strong>

            <small>
              Finished work orders
            </small>

          </div>

        </div>


        {/* =================================================
            BOOKINGS SECTION
        ================================================= */}

        <div className="advisor-section">

          <div className="section-header">

            <div>

              <h2>
                Today's Bookings
              </h2>

              <p>
                Bookings for {formatDate(selectedDate)}
              </p>

            </div>

          </div>


          {bookingsError && !bookingsLoading && (

            <div className="advisor-error">

              <AlertCircle
                size={16}
              />

              <span>
                {bookingsError}
              </span>

              <AnimatedButton
                type="button"
                onClick={loadBookings}
              >
                Try Again
              </AnimatedButton>

            </div>

          )}


          {bookingsLoading ? (

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

          ) : bookingsError ? null : bookings.length === 0 ? (

            <div className="advisor-empty">

              <div className="advisor-empty-icon">

                <CalendarDays
                  size={26}
                />

              </div>


              <h3>
                No bookings for this date
              </h3>


              <p>
                Try selecting a different
                date.
              </p>

            </div>

          ) : (

            <div className="booking-list">

              {bookings.map((booking) => {

                const hasWorkOrder =
                  workOrderBookingIds.has(
                    booking.id
                  );

                return (

                  <article
                    className="booking-card"
                    key={booking.id}
                  >

                    <div className="booking-card-main">

                      <div className="booking-icon">

                        <CalendarDays
                          size={23}
                        />

                      </div>


                      <div className="booking-content">

                        <div className="booking-title-row">

                          <h2>
                            Booking #{booking.id}
                          </h2>


                          <span
                            className={getBookingStatusClass(
                              booking.status
                            )}
                          >

                            {booking.status ||
                              "PENDING"}

                          </span>

                        </div>


                        <div className="booking-meta">

                          <div>

                            <User
                              size={14}
                            />

                            {formatCustomerName(
                              booking.customer
                            ) ||
                              `Customer #${booking.customer_id}`}

                            {booking.customer
                              ?.user?.phone && (
                              <span className="meta-sub">
                                {" "}
                                · {booking.customer.user.phone}
                              </span>
                            )}

                          </div>


                          <div>

                            <Car
                              size={14}
                            />

                            {formatVehicleLabel(
                              booking.vehicle
                            ) ||
                              `Vehicle #${booking.vehicle_id}`}

                          </div>


                          <div>

                            <Wrench
                              size={14}
                            />

                            {booking.service
                              ?.name ||
                              `Service #${booking.service_id}`}

                          </div>


                          <div>

                            <CalendarDays
                              size={14}
                            />

                            {formatDate(
                              booking.booking_date
                            )}

                          </div>


                          <div>

                            <Clock3
                              size={14}
                            />

                            {formatTime(
                              booking.booking_time
                            )}

                          </div>

                        </div>


                        {booking.customer_notes && (

                          <p className="booking-notes">

                            <MessageSquare
                              size={13}
                            />

                            {booking.customer_notes}

                          </p>

                        )}

                      </div>

                    </div>


                    <div className="advisor-card-footer">

                      {hasWorkOrder ? (

                        <span className="advisor-created-chip">

                          <CheckCircle2
                            size={14}
                          />

                          Work order created

                        </span>

                      ) : (

                        <AnimatedButton
                          type="button"
                          className="primary-action"
                          onClick={() =>
                            openCreateModal(
                              booking
                            )
                          }
                        >

                          <Plus
                            size={16}
                          />

                          Create Work Order

                        </AnimatedButton>

                      )}

                    </div>

                  </article>

                );

              })}

            </div>

          )}

        </div>


        {/* =================================================
            WORK ORDERS SECTION
        ================================================= */}

        <div className="advisor-section">

          <div className="section-header">

            <div>

              <h2>
                Work Orders
              </h2>

              <p>
                All workshop work orders
              </p>

            </div>

          </div>


          {workOrdersError && !workOrdersLoading && (

            <div className="advisor-error">

              <AlertCircle
                size={16}
              />

              <span>
                {workOrdersError}
              </span>

              <AnimatedButton
                type="button"
                onClick={loadWorkOrders}
              >
                Try Again
              </AnimatedButton>

            </div>

          )}


          {workOrdersLoading ? (

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

          ) : workOrdersError ? null : workOrders.length === 0 ? (

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
                Work orders will appear
                here once they are created.
              </p>

            </div>

          ) : (

            <div className="booking-list">

              {workOrders.map((workOrder) => (

                <article
                  className="booking-card"
                  key={workOrder.id}
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

                          <User
                            size={14}
                          />

                          {formatCustomerName(
                            workOrder.booking
                              ?.customer
                          ) ||
                            `Customer #${workOrder.booking
                              ?.customer_id ??
                              workOrder.booking_id}`}

                          {workOrder.booking
                            ?.customer?.user
                            ?.phone && (
                            <span className="meta-sub">
                              {" "}
                              · {workOrder.booking.customer.user.phone}
                            </span>
                          )}

                        </div>


                        <div>

                          <Car
                            size={14}
                          />

                          {formatVehicleLabel(
                            workOrder.vehicle
                          ) ||
                            `Vehicle #${workOrder.vehicle_id}`}

                        </div>


                        <div>

                          <Wrench
                            size={14}
                          />

                          {workOrder.booking
                            ?.service?.name ||
                            `Booking #${workOrder.booking_id}`}

                        </div>


                        <div>

                          <CalendarDays
                            size={14}
                          />

                          Booking #{workOrder.booking_id}

                        </div>


                        <div>

                          <Wrench
                            size={14}
                          />

                          Mechanic{" "}
                          {workOrder.mechanic
                            ?.first_name
                            ? [
                                workOrder.mechanic.first_name,
                                workOrder.mechanic.last_name,
                              ]
                                .filter(Boolean)
                                .join(" ")
                            : workOrder.assigned_mechanic_id
                              ? `#${workOrder.assigned_mechanic_id}`
                              : "Not assigned"}

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


                  <WorkOrderWorkflow
                    workOrder={workOrder}
                  />

                </article>

              ))}

            </div>

          )}

        </div>


        {/* =================================================
            PENDING APPROVALS SECTION
        ================================================= */}

        <div className="advisor-section">

          <div className="section-header">

            <div>

              <h2>
                Pending Approvals
              </h2>

              <p>
                Work orders submitted by mechanics
                for your review
              </p>

            </div>

          </div>


          {pendingError && !pendingLoading && (

            <div className="advisor-error">

              <AlertCircle
                size={16}
              />

              <span>
                {pendingError}
              </span>

              <AnimatedButton
                type="button"
                onClick={loadPendingApprovals}
              >
                Try Again
              </AnimatedButton>

            </div>

          )}


          {pendingActionError && (

            <div className="advisor-error">

              <AlertCircle
                size={16}
              />

              <span>
                {pendingActionError}
              </span>

            </div>

          )}


          {pendingLoading ? (

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

          ) : pendingApprovals.length === 0 ? (

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

            <div className="booking-list">

              {pendingApprovals.map((wo) => {

                const isExpanded =
                  expandedWO === wo.id;

                const detailsLoading =
                  loadingDetails[wo.id];

                const parts =
                  woParts[wo.id] || [];

                const services =
                  woServices[wo.id] || [];

                const inspection =
                  woInspection[wo.id] || null;

                const isApproving =
                  approvingId === wo.id;

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


                          <span className="booking-status confirmed">

                            SUBMITTED FOR APPROVAL

                          </span>

                        </div>


                        <div className="booking-meta">

                          <div>

                            <User
                              size={14}
                            />

                            {formatCustomerName(
                              wo.booking
                                ?.customer
                            ) ||
                              `Customer #${
                                wo.booking
                                  ?.customer_id ??
                                  wo.booking_id
                              }`}

                            {wo.booking?.customer
                              ?.user?.phone && (
                              <span className="meta-sub">
                                {" "}
                                · {wo.booking.customer.user.phone}
                              </span>
                            )}

                          </div>


                          <div>

                            <Car
                              size={14}
                            />

                            {formatVehicleLabel(
                              wo.vehicle
                            ) ||
                              `Vehicle #${wo.vehicle_id}`}

                          </div>


                          <div>

                            <Wrench
                              size={14}
                            />

                            {wo.booking?.service
                              ?.name ||
                              `Booking #${wo.booking_id}`}

                          </div>


                          <div>

                            <CalendarDays
                              size={14}
                            />

                            Booking #{wo.booking_id}

                          </div>


                          <div>

                            <Wrench
                              size={14}
                            />

                            Mechanic{" "}
                            {wo.mechanic
                              ?.first_name
                              ? [
                                  wo.mechanic.first_name,
                                  wo.mechanic.last_name,
                                ]
                                  .filter(Boolean)
                                  .join(" ")
                              : wo.assigned_mechanic_id
                                ? `#${wo.assigned_mechanic_id}`
                                : "—"}

                          </div>

                        </div>


                        {wo.complaint && (

                          <p className="booking-notes">

                            <BookOpen
                              size={13}
                            />

                            {wo.complaint}

                          </p>

                        )}

                      </div>

                    </div>


                    <div className="advisor-card-footer">

                      <AnimatedButton
                        type="button"
                        className="secondary-action"
                        onClick={() =>
                          toggleExpandWO(wo.id)
                        }
                      >

                        {isExpanded ? (
                          <ChevronUp
                            size={16}
                          />
                        ) : (
                          <Settings2
                            size={16}
                          />
                        )}

                        {isExpanded
                          ? "Hide Details"
                          : "View Actual Work"}

                      </AnimatedButton>


                      <div className="advisor-pending-actions">

                        <div className="advisor-approve-comment">

                          <input
                            type="text"
                            placeholder="Optional approval comment..."
                            value={
                              isExpanded
                                ? approveComment
                                : ""
                            }
                            onChange={(e) =>
                              setApproveComment(
                                e.target.value
                              )
                            }
                            disabled={
                              isApproving ||
                              rejecting
                            }
                          />

                        </div>

                        <AnimatedButton
                          type="button"
                          className="primary-action"
                          onClick={() =>
                            handleApprove(wo.id)
                          }
                          disabled={
                            isApproving ||
                            rejecting
                          }
                        >

                          {isApproving ? (
                            <LoaderCircle
                              size={16}
                              className="spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={16}
                            />
                          )}

                          {isApproving
                            ? "Approving..."
                            : "Approve"}

                        </AnimatedButton>


                        <AnimatedButton
                          type="button"
                          className="secondary-action advisor-reject-btn"
                          onClick={() =>
                            openRejectModal(wo)
                          }
                          disabled={
                            isApproving ||
                            rejecting
                          }
                        >

                          <X
                            size={16}
                          />

                          Reject

                        </AnimatedButton>

                      </div>

                    </div>


                    {isExpanded && (

                      <div className="advisor-workflow">

                        {detailsLoading ? (

                          <div className="advisor-workflow-loading">

                            <LoaderCircle
                              size={18}
                              className="spin"
                            />

                            Loading actual work details...

                          </div>

                        ) : (

                          <div className="advisor-workflow-grid">

                            {/* INSPECTION FINDINGS */}

                            {inspection && (

                              <div className="advisor-workflow-panel">

                                <div className="advisor-workflow-panel-head">

                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>

                                        <h3 style={{ margin: 0 }}>

                                          <ClipboardList
                                            size={16}
                                          />

                                          Inspection Findings ({inspection.items?.length || 0})

                                        </h3>

                                        <AnimatedButton
                                          type="button"
                                          className="secondary-action"
                                          onClick={() => navigate(`/advisor/inspections/${inspection.id}`)}
                                        >
                                          View details
                                        </AnimatedButton>

                                      </div>

                                </div>

                                {inspection.overall_notes && (

                                  <div className="advisor-inspection-notes">

                                    <strong>Overall Notes:</strong>{" "}
                                    {inspection.overall_notes}

                                  </div>

                                )}

                                {(!inspection.items || inspection.items.length === 0) ? (

                                  <div className="advisor-workflow-empty">

                                    <ClipboardList
                                      size={22}
                                    />

                                    <p>
                                      No inspection findings recorded.
                                    </p>

                                  </div>

                                ) : (

                                  <div className="advisor-part-table-wrap">

                                    <table className="advisor-part-table">

                                      <thead>

                                        <tr>

                                          <th>Component</th>

                                          <th>Condition</th>

                                          <th>Severity</th>

                                          <th>Notes</th>

                                          <th>Recommended Action</th>

                                        </tr>

                                      </thead>

                                      <tbody>

                                        {inspection.items.map((item) => (

                                          <tr key={item.id}>

                                            <td>
                                              {item.component}
                                            </td>

                                            <td>
                                              {item.condition}
                                            </td>

                                            <td>

                                              <span className={`booking-status ${
                                                item.severity === "CRITICAL"
                                                  ? "cancelled"
                                                  : item.severity === "HIGH"
                                                    ? "cancelled"
                                                    : item.severity === "MEDIUM"
                                                      ? "pending"
                                                      : "completed"
                                              }`}>

                                                {item.severity}

                                              </span>

                                            </td>

                                            <td>
                                              {item.notes || "—"}
                                            </td>

                                            <td>
                                              {item.recommended_action || "—"}
                                            </td>

                                          </tr>

                                        ))}

                                      </tbody>

                                    </table>

                                  </div>

                                )}

                              </div>

                            )}

                            {/* PARTS */}

                            <div className="advisor-workflow-panel">

                              <div className="advisor-workflow-panel-head">

                                <h3>

                                  <Package
                                    size={16}
                                  />

                                  Parts Used ({parts.length})

                                </h3>

                              </div>


                              {parts.length === 0 ? (

                                <div className="advisor-workflow-empty">

                                  <Package
                                    size={22}
                                  />

                                  <p>
                                    No parts used.
                                  </p>

                                </div>

                              ) : (

                                <div className="advisor-part-table-wrap">

                                  <table className="advisor-part-table">

                                    <thead>

                                      <tr>

                                        <th>Part</th>

                                        <th>Source</th>

                                        <th>Qty</th>

                                        <th>Unit Price</th>

                                        <th>Total</th>

                                      </tr>

                                    </thead>


                                    <tbody>

                                      {parts.map((p) => (

                                        <tr key={p.id}>

                                          <td>
                                            {partById.get(p.part_id)?.name || `Part #${p.part_id}`}
                                          </td>

                                          <td>

                                            <span className={`booking-status ${
                                              p.source === "ACTUAL"
                                                ? "completed"
                                                : "pending"
                                            }`}>

                                              {p.source || "ESTIMATE"}

                                            </span>

                                          </td>

                                          <td>
                                            {p.quantity}
                                          </td>

                                          <td>
                                            {formatCurrency(
                                              p.unit_price
                                            )}
                                          </td>

                                          <td>
                                            {formatCurrency(
                                              p.total_price
                                            )}
                                          </td>

                                        </tr>

                                      ))}

                                    </tbody>

                                  </table>

                                </div>

                              )}

                            </div>


                            {/* SERVICES / CONSUMABLES / LABOR */}

                            <div className="advisor-workflow-panel">

                              <div className="advisor-workflow-panel-head">

                                <h3>

                                  <Wrench
                                    size={16}
                                  />

                                  Services & Labor ({services.length})

                                </h3>

                              </div>


                              {services.length === 0 ? (

                                <div className="advisor-workflow-empty">

                                  <Wrench
                                    size={22}
                                  />

                                  <p>
                                    No services or labor recorded.
                                  </p>

                                </div>

                              ) : (

                                <div className="advisor-part-table-wrap">

                                  <table className="advisor-part-table">

                                    <thead>

                                      <tr>

                                        <th>Type</th>

                                        <th>Description</th>

                                        <th>Qty</th>

                                        <th>Unit Price</th>

                                        <th>Total</th>

                                      </tr>

                                    </thead>


                                    <tbody>

                                      {services.map((s) => (

                                        <tr key={s.id}>

                                          <td>

                                            <span className={`booking-status ${
                                              s.item_type === "LABOR"
                                                ? "completed"
                                                : s.item_type === "CONSUMABLE"
                                                  ? "cancelled"
                                                  : "pending"
                                            }`}>

                                              {s.item_type || "SERVICE"}

                                            </span>

                                          </td>

                                          <td>
                                            {s.description || "—"}
                                          </td>

                                          <td>
                                            {s.quantity}
                                          </td>

                                          <td>
                                            {formatCurrency(
                                              s.unit_price
                                            )}
                                          </td>

                                          <td>
                                            {formatCurrency(
                                              s.total_price
                                            )}
                                          </td>

                                        </tr>

                                      ))}

                                    </tbody>

                                  </table>

                                </div>

                              )}

                            </div>


                            {/* GRAND TOTAL */}

                            {(parts.length > 0 || services.length > 0) && (

                              <div className="advisor-workflow-panel">

                                <div className="advisor-workflow-panel-head">

                                  <h3>

                                    <Receipt
                                      size={16}
                                    />

                                    Total Summary

                                  </h3>

                                </div>

                                <div className="advisor-grand-total">

                                  <div className="advisor-grand-total-row">

                                    <span>Parts Total</span>

                                    <span>
                                      {formatCurrency(
                                        parts.reduce(
                                          (sum, p) =>
                                            sum + Number(p.total_price || 0),
                                          0
                                        )
                                      )}
                                    </span>

                                  </div>

                                  <div className="advisor-grand-total-row">

                                    <span>Services & Labor Total</span>

                                    <span>
                                      {formatCurrency(
                                        services.reduce(
                                          (sum, s) =>
                                            sum + Number(s.total_price || 0),
                                          0
                                        )
                                      )}
                                    </span>

                                  </div>

                                  <div className="advisor-grand-total-row advisor-grand-total-final">

                                    <span>Grand Total</span>

                                    <span>
                                      {formatCurrency(
                                        parts.reduce(
                                          (sum, p) =>
                                            sum + Number(p.total_price || 0),
                                          0
                                        ) +
                                        services.reduce(
                                          (sum, s) =>
                                            sum + Number(s.total_price || 0),
                                          0
                                        )
                                      )}
                                    </span>

                                  </div>

                                </div>

                              </div>

                            )}

                          </div>

                        )}

                      </div>

                    )}

                  </article>

                );

              })}

            </div>

          )}

        </div>

      </div>


      {/* =================================================
          REJECTION REASON MODAL
      ================================================= */}

      {rejectModalWO && (

        <div
          className="modal-overlay"
          onClick={closeRejectModal}
        >

          <div
            className="modal-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  Reject Work Order
                </h2>

                <p>
                  Work Order #{rejectModalWO.id}
                </p>

              </div>


              <AnimatedButton
                type="button"
                className="modal-close"
                onClick={closeRejectModal}
                disabled={rejecting}
                aria-label="Close"
              >

                <X
                  size={18}
                />

              </AnimatedButton>

            </div>


            <div className="modal-body">

              <p className="advisor-confirm-text">

                Provide a reason for rejecting
                Work Order #{rejectModalWO.id}.
                The mechanic will be notified and
                can make corrections.

              </p>


              {pendingActionError && (

                <div className="advisor-error">

                  <AlertCircle
                    size={16}
                  />

                  <span>
                    {pendingActionError}
                  </span>

                </div>

              )}


              <div className="modal-field">

                <label>
                  Rejection Reason (required)
                </label>

                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => {

                    setRejectReason(
                      e.target.value
                    );

                    setPendingActionError("");

                  }}
                  placeholder="Describe what needs to be corrected"
                  disabled={rejecting}
                  maxLength={500}
                />

                <small>
                  {rejectReason.length}/500
                </small>

              </div>

            </div>


            <div className="modal-actions">

              <AnimatedButton
                type="button"
                className="secondary-action"
                onClick={closeRejectModal}
                disabled={rejecting}
              >

                Cancel

              </AnimatedButton>


              <AnimatedButton
                type="button"
                className="primary-action advisor-reject-btn"
                onClick={handleReject}
                disabled={rejecting}
              >

                {rejecting ? (
                  <LoaderCircle
                    size={17}
                    className="spin"
                  />
                ) : (
                  <X
                    size={17}
                  />
                )}

                {rejecting
                  ? "Rejecting..."
                  : "Reject Work Order"}

              </AnimatedButton>

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          CREATE WORK ORDER MODAL
      ================================================= */}

      {modalBooking && (

        <div
          className="modal-overlay"
          onClick={closeCreateModal}
        >

          <div
            className="modal-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  Create Work Order
                </h2>

                <p>
                  Booking #{modalBooking.id}
                </p>

              </div>


              <AnimatedButton
                type="button"
                className="modal-close"
                onClick={closeCreateModal}
                disabled={creating}
                aria-label="Close"
              >

                <X
                  size={18}
                />

              </AnimatedButton>

            </div>


            <div className="modal-body">

              {createError && (

                <div className="advisor-error">

                  <AlertCircle
                    size={16}
                  />

                  <span>
                    {createError}
                  </span>

                </div>

              )}


              <div className="modal-field">

                <label>
                  Booking ID
                </label>

                <input
                  type="text"
                  value={modalBooking.id}
                  readOnly
                  disabled
                />

              </div>


              <div className="modal-field">

                <label>
                  Vehicle ID
                </label>

                <input
                  type="text"
                  value={modalBooking.vehicle_id}
                  readOnly
                  disabled
                />

              </div>


              <div className="modal-field">

                <label>
                  Complaint
                </label>

                <textarea
                  rows={3}
                  value={complaint}
                  onChange={(e) =>
                    setComplaint(
                      e.target.value
                    )
                  }
                  placeholder="Optional — describe the issue"
                  disabled={creating}
                />

              </div>


              <div className="modal-field">

                <label>
                  Mechanic ID (optional)
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={mechanicId}
                  onChange={(e) =>
                    setMechanicId(
                      e.target.value
                    )
                  }
                  placeholder="Optional — numeric mechanic ID"
                  disabled={creating}
                />

              </div>

            </div>


            <div className="modal-actions">

              <AnimatedButton
                type="button"
                className="secondary-action"
                onClick={closeCreateModal}
                disabled={creating}
              >

                Cancel

              </AnimatedButton>


              <AnimatedButton
                type="button"
                className="primary-action"
                onClick={handleCreateWorkOrder}
                disabled={creating}
              >

                {creating ? (
                  <LoaderCircle
                    size={17}
                    className="spin"
                  />
                ) : (
                  <Plus
                    size={17}
                  />
                )}

                {creating
                  ? "Creating..."
                  : "Create Work Order"}

              </AnimatedButton>

            </div>

          </div>

        </div>

      )}

    </AppLayout>
  );
}
