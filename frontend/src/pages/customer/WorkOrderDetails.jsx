import { useEffect, useState } from "react";

import {
  ArrowLeft,
  LoaderCircle,
  FileText,
  ClipboardList,
  CalendarDays,
  Clock3,
  Car,
  Wrench,
  BookOpen,
  Receipt,
  AlertCircle,
  Package,
  Settings,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";

import {
  getWorkOrder,
} from "../../api/workOrderApi";

import {
  getWorkOrderInvoice,
} from "../../api/invoiceApi";

import {
  getWorkOrderParts,
} from "../../api/partApi";

import {
  getWorkOrderServices,
} from "../../api/serviceApi";
import AnimatedButton from "../../components/ui/animated-button";


const formatCurrency = (amount) => {
  if (
    amount === null ||
    amount === undefined ||
    amount === ""
  ) {
    return "\u2014";
  }

  const value = Number(amount);

  if (Number.isNaN(value)) {
    return "\u2014";
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


const getStatusClass = (status) => {
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


const getPartTypeClass = (type) => {
  const s = String(
    type || ""
  ).toUpperCase();

  if (s === "CONSUMABLE") {
    return "booking-status completed";
  }

  return "booking-status pending";
};


export default function WorkOrderDetails() {

  const navigate = useNavigate();

  const { workOrderId } = useParams();


  const [workOrder, setWorkOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const [invoiceBusy, setInvoiceBusy] =
    useState(false);

  const [invoiceError, setInvoiceError] =
    useState("");


  const [parts, setParts] =
    useState([]);

  const [partsLoading, setPartsLoading] =
    useState(false);

  const [services, setServices] =
    useState([]);

  const [servicesLoading, setServicesLoading] =
    useState(false);


  /* =====================================================
     VIEW INVOICE
  ===================================================== */

  const handleViewInvoice = async () => {

    if (invoiceBusy || !workOrderId) {
      return;
    }

    try {

      setInvoiceBusy(true);

      setInvoiceError("");


      const invoice =
        await getWorkOrderInvoice(
          workOrderId
        );


      navigate(
        `/customer/invoices/${invoice.id}`
      );

    } catch (err) {

      console.error(
        "Failed to load work order invoice:",
        err
      );

      if (
        err?.response?.status === 404
      ) {

        setInvoiceError(
          "No invoice has been generated for this work order yet."
        );

      } else {

        setInvoiceError(
          err?.response?.data?.detail ||
            "Unable to load invoice."
        );

      }

    } finally {

      setInvoiceBusy(false);

    }
  };


  /* =====================================================
     LOAD WORK ORDER
  ===================================================== */

  const loadWorkOrder = async () => {

    if (!workOrderId) {

      setLoading(false);

      setError(
        "Work order ID is missing."
      );

      return;
    }


    try {

      setLoading(true);

      setError("");


      const data =
        await getWorkOrder(
          workOrderId
        );


      setWorkOrder(data);

    } catch (err) {

      console.error(
        "Failed to load work order:",
        err
      );


      setError(
        err?.response?.data?.detail ||
          "Unable to load work order."
      );

    } finally {

      setLoading(false);

    }
  };


  /* =====================================================
     LOAD PARTS AND SERVICES
  ===================================================== */

  const loadPartsAndServices = async () => {

    if (!workOrderId) {
      return;
    }

    const statuses = [
      "IN_PROGRESS",
      "SUBMITTED_FOR_APPROVAL",
      "COMPLETED",
    ];

    if (
      !statuses.includes(
        workOrder?.status
      )
    ) {
      return;
    }

    try {

      setPartsLoading(true);

      const partsData =
        await getWorkOrderParts(
          workOrderId
        );

      setParts(
        Array.isArray(partsData)
          ? partsData
          : []
      );

    } catch (err) {

      console.error(
        "Failed to load parts:",
        err
      );

    } finally {

      setPartsLoading(false);

    }

    try {

      setServicesLoading(true);

      const servicesData =
        await getWorkOrderServices(
          workOrderId
        );

      setServices(
        Array.isArray(servicesData)
          ? servicesData
          : []
      );

    } catch (err) {

      console.error(
        "Failed to load services:",
        err
      );

    } finally {

      setServicesLoading(false);

    }
  };


  useEffect(() => {

    loadWorkOrder();

  }, [workOrderId]);


  useEffect(() => {

    if (workOrder) {

      loadPartsAndServices();

    }

  }, [workOrder?.id, workOrder?.status]);


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (
      <AppLayout>

        <div className="booking-details-loading">

          <LoaderCircle
            size={30}
            className="spin"
          />

          <p>
            Loading work order details...
          </p>

        </div>

      </AppLayout>
    );

  }


  /* =====================================================
     ERROR
  ===================================================== */

  if (error || !workOrder) {

    return (
      <AppLayout>

        <div className="booking-details-error">

          <div className="booking-details-error-icon">

            <FileText
              size={28}
            />

          </div>


          <h1>
            Work order not found
          </h1>


          <p>
            {error ||
              "We couldn't find this work order."}
          </p>


          <div className="booking-details-error-actions">

            <AnimatedButton
              type="button"
              className="secondary-action"
              onClick={loadWorkOrder}
            >

              Try Again

            </AnimatedButton>


            <AnimatedButton
              type="button"
              className="primary-action"
              onClick={() =>
                navigate(
                  "/customer/dashboard"
                )
              }
            >

              <ArrowLeft
                size={17}
              />

              Back to dashboard

            </AnimatedButton>

          </div>

        </div>

      </AppLayout>
    );

  }


  const totalPartsCost = parts.reduce(
    (sum, p) =>
      sum +
      (Number(p.unit_price || 0) *
        Number(p.quantity || 0)),
    0
  );

  const totalServicesCost = services.reduce(
    (sum, s) =>
      sum + (Number(s.unit_price || 0)),
    0
  );


  return (
    <AppLayout>

      <div className="work-order-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="work-order-header">

          <AnimatedButton
            className="back-button"
            onClick={() =>
              navigate(
                "/customer/dashboard"
              )
            }
          >

            <ArrowLeft
              size={17}
            />

            Back to dashboard

          </AnimatedButton>


          <div className="work-order-title-row">

            <div>

              <p className="page-eyebrow">
                WORK ORDER
              </p>

              <h1>
                Work Order #{workOrder.id}
              </h1>

            </div>


            <div className="work-order-title-actions">

              <span
                className={getStatusClass(
                  workOrder.status
                )}
              >

                {workOrder.status ||
                  "UNKNOWN"}

              </span>


              <AnimatedButton
                type="button"
                className="secondary-action"
                onClick={handleViewInvoice}
                disabled={invoiceBusy}
              >

                {invoiceBusy ? (
                  <LoaderCircle
                    size={16}
                    className="spin"
                  />
                ) : (
                  <Receipt
                    size={16}
                  />
                )}

                View Invoice

              </AnimatedButton>

            </div>

          </div>


          {invoiceError && (

            <div className="notice-error work-order-error">

              <AlertCircle
                size={15}
              />

              <span>
                {invoiceError}
              </span>

              <AnimatedButton
                type="button"
                onClick={() =>
                  setInvoiceError("")
                }
              >

                Dismiss

              </AnimatedButton>

            </div>

          )}

        </div>


        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="work-order-summary-card">

          <div className="details-card-header">

            <div className="details-card-icon">

              <ClipboardList
                size={18}
              />

            </div>

            <div>

              <h2>
                Work order details
              </h2>

              <p>
                Information about this
                work order
              </p>

            </div>

          </div>


          <div className="work-order-grid">

            <div className="work-order-field">

              <span>
                Work Order ID
              </span>

              <strong>
                #{workOrder.id}
              </strong>

            </div>


            <div className="work-order-field">

              <span>
                Booking ID
              </span>

              <strong>
                <CalendarDays
                  size={14}
                />

                #{workOrder.booking_id}
              </strong>

            </div>


            <div className="work-order-field">

              <span>
                Vehicle ID
              </span>

              <strong>
                <Car
                  size={14}
                />

                #{workOrder.vehicle_id}
              </strong>

            </div>


            <div className="work-order-field">

              <span>
                Assigned Mechanic ID
              </span>

              <strong>
                <Wrench
                  size={14}
                />

                {workOrder.assigned_mechanic_id
                  ? `#${workOrder.assigned_mechanic_id}`
                  : "Not available"}
              </strong>

            </div>


            <div className="work-order-field">

              <span>
                Status
              </span>

              <strong>
                {workOrder.status ||
                  "Not available"}
              </strong>

            </div>


            <div className="work-order-field">

              <span>
                Received At
              </span>

              <strong>
                <Clock3
                  size={14}
                />

                {formatDate(
                  workOrder.received_at
                )}
              </strong>

            </div>


            <div className="work-order-field">

              <span>
                Started At
              </span>

              <strong>
                <Clock3
                  size={14}
                />

                {formatDate(
                  workOrder.started_at
                )}
              </strong>

            </div>


            <div className="work-order-field">

              <span>
                Completed At
              </span>

              <strong>
                <Clock3
                  size={14}
                />

                {formatDate(
                  workOrder.completed_at
                )}
              </strong>

            </div>


            <div className="work-order-field work-order-field-full">

              <span>
                Complaint
              </span>

              <strong>
                <BookOpen
                  size={14}
                />

                {workOrder.complaint ||
                  "Not available"}
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            PARTS USED
        ================================================= */}

        {parts.length > 0 && (

          <section className="work-order-summary-card">

            <div className="details-card-header">

              <div className="details-card-icon">

                <Package
                  size={18}
                />

              </div>

              <div>

                <h2>
                  Parts Used
                </h2>

                <p>
                  Parts replaced or
                  installed during service
                </p>

              </div>

            </div>

            <div className="advisor-part-table-wrap">

              <table className="advisor-part-table">

                <thead>

                  <tr>

                    <th>
                      Part
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Qty
                    </th>

                    <th>
                      Unit Price
                    </th>

                    <th>
                      Total
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {parts.map(
                    (part) => (

                      <tr
                        key={part.id}
                      >

                        <td>

                          <strong>
                            {part.part_name ||
                              part.description ||
                              `Part #${part.part_id}`}
                          </strong>

                        </td>

                        <td>

                          <span
                            className={`booking-status ${
                              part.source === "ESTIMATE"
                                ? "pending"
                                : "completed"
                            }`}
                          >

                            {part.source ||
                              "ACTUAL"}

                          </span>

                        </td>

                        <td>
                          {part.quantity}
                        </td>

                        <td>
                          {formatCurrency(
                            part.unit_price
                          )}
                        </td>

                        <td>

                          <strong>
                            {formatCurrency(
                              Number(part.unit_price || 0) *
                              Number(part.quantity || 0)
                            )}
                          </strong>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </section>

        )}

        {partsLoading && workOrder.status !== "CREATED" && workOrder.status !== "ASSIGNED" && (

          <section className="work-order-summary-card">

            <div className="details-card-header">

              <div className="details-card-icon">

                <Package
                  size={18}
                />

              </div>

              <div>

                <h2>
                  Parts Used
                </h2>

                <p>
                  Loading parts...
                </p>

              </div>

            </div>

          </section>

        )}


        {/* =================================================
            SERVICES PERFORMED
        ================================================= */}

        {services.length > 0 && (

          <section className="work-order-summary-card">

            <div className="details-card-header">

              <div className="details-card-icon">

                <Settings
                  size={18}
                />

              </div>

              <div>

                <h2>
                  Services & Consumables
                </h2>

                <p>
                  Services performed and
                  consumables used
                </p>

              </div>

            </div>

            <div className="advisor-part-table-wrap">

              <table className="advisor-part-table">

                <thead>

                  <tr>

                    <th>
                      Description
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Qty
                    </th>

                    <th>
                      Unit Price
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {services.map(
                    (service) => (

                      <tr
                        key={service.id}
                      >

                        <td>

                          <strong>
                            {service.description ||
                              `Service #${service.service_id || ""}`}
                          </strong>

                        </td>

                        <td>

                          <span
                            className={`booking-status ${
                              service.item_type === "LABOR"
                                ? "completed"
                                : service.item_type === "CONSUMABLE"
                                  ? "cancelled"
                                  : "pending"
                            }`}
                          >

                            {service.item_type ||
                              "SERVICE"}

                          </span>

                        </td>

                        <td>
                          {service.quantity || 1}
                        </td>

                        <td>
                          {formatCurrency(
                            service.unit_price
                          )}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </section>

        )}

        {servicesLoading && workOrder.status !== "CREATED" && workOrder.status !== "ASSIGNED" && (

          <section className="work-order-summary-card">

            <div className="details-card-header">

              <div className="details-card-icon">

                <Settings
                  size={18}
                />

              </div>

              <div>

                <h2>
                  Services & Consumables
                </h2>

                <p>
                  Loading services...
                </p>

              </div>

            </div>

          </section>

        )}

      </div>

    </AppLayout>

  );

}
