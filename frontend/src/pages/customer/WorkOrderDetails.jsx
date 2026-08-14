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


  useEffect(() => {

    loadWorkOrder();

  }, [workOrderId]);


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

            <button
              type="button"
              className="secondary-action"
              onClick={loadWorkOrder}
            >

              Try Again

            </button>


            <button
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

            </button>

          </div>

        </div>

      </AppLayout>
    );

  }


  return (
    <AppLayout>

      <div className="work-order-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="work-order-header">

          <button
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

          </button>


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


              <button
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

              </button>

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

              <button
                type="button"
                onClick={() =>
                  setInvoiceError("")
                }
              >

                Dismiss

              </button>

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

      </div>

    </AppLayout>
  );
}
