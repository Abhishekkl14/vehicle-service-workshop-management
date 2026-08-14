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
  Send,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";

import {
  getBookingsByDate,
} from "../../api/bookingApi";

import {
  getWorkOrdersByStatus,
  createWorkOrder,
} from "../../api/workOrderApi";

import {
  getActiveParts,
  getWorkOrderParts,
  addWorkOrderPart,
} from "../../api/partApi";

import {
  createEstimate,
  getWorkOrderEstimates,
  sendEstimate,
} from "../../api/estimateApi";


const WORK_ORDER_STATUSES = [
  "CREATED",
  "INSPECTION",
  "IN_PROGRESS",
  "COMPLETED",
  "WAITING_FOR_APPROVAL",
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


/* =====================================================
   WORK ORDER WORKFLOW
   Parts management + estimate creation/sending
   ===================================================== */

function WorkOrderWorkflow({ workOrder }) {

  const workOrderId = workOrder.id;

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


  const loadAll = () => {

    loadParts();

    loadEstimates();

    loadActiveParts();

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


  const selectedPart =
    partById.get(
      Number(selectedPartId)
    );


  return (
    <>

      <div className="advisor-card-footer">

        <button
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

        </button>

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


                <button
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

                </button>

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

                  <button
                    type="button"
                    onClick={loadParts}
                  >
                    Try Again
                  </button>

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


                  <button
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

                  </button>

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


                <button
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

                </button>

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

                  <button
                    type="button"
                    onClick={loadEstimates}
                  >
                    Try Again
                  </button>

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

                            <button
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

                            </button>

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


                  <button
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

                  </button>

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

        </div>

      )}

    </>
  );
}


export default function AdvisorDashboard() {

  const { user } = useAuth();


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
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    loadBookings();

    loadWorkOrders();

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

      <div className="advisor-dashboard">

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


          <button
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

          </button>

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

            <button
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

            </button>

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


            <button
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

            </button>

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

              <button
                type="button"
                onClick={loadBookings}
              >
                Try Again
              </button>

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

                            Customer #{booking.customer_id}

                          </div>


                          <div>

                            <Car
                              size={14}
                            />

                            Vehicle #{booking.vehicle_id}

                          </div>


                          <div>

                            <Wrench
                              size={14}
                            />

                            Service #{booking.service_id}

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

                        <button
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

                        </button>

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

              <button
                type="button"
                onClick={loadWorkOrders}
              >
                Try Again
              </button>

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

                          <Wrench
                            size={14}
                          />

                          Mechanic {workOrder.assigned_mechanic_id
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

      </div>


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


              <button
                type="button"
                className="modal-close"
                onClick={closeCreateModal}
                disabled={creating}
                aria-label="Close"
              >

                <X
                  size={18}
                />

              </button>

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

              <button
                type="button"
                className="secondary-action"
                onClick={closeCreateModal}
                disabled={creating}
              >

                Cancel

              </button>


              <button
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

              </button>

            </div>

          </div>

        </div>

      )}

    </AppLayout>
  );
}
