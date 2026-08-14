import { useEffect, useState } from "react";

import {
  ArrowLeft,
  LoaderCircle,
  FileText,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Receipt,
  CalendarDays,
  Clock3,
  ClipboardList,
  ChevronRight,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";

import {
  getEstimate,
  createApproval,
} from "../../api/estimateApi";

import {
  getWorkOrderInvoice,
} from "../../api/invoiceApi";


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


const formatDate = (value) => {
  if (!value) {
    return "—";
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

  return date.toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};


const formatDuration = (minutes) => {
  if (
    minutes === null ||
    minutes === undefined ||
    minutes === ""
  ) {
    return "—";
  }

  const mins = Number(minutes);

  if (Number.isNaN(mins)) {
    return "—";
  }

  if (mins <= 0) {
    return "0 minutes";
  }

  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;

  if (hours === 0) {
    return `${remainder} minute${
      remainder === 1 ? "" : "s"
    }`;
  }

  if (remainder === 0) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    }`;
  }

  return `${hours} hour${
    hours === 1 ? "" : "s"
  } ${remainder} minute${
    remainder === 1 ? "" : "s"
  }`;
};


const getStatusClass = (status) => {
  const s = String(
    status || ""
  ).toUpperCase();

  if (s === "APPROVED") {
    return "booking-status confirmed";
  }

  if (s === "REJECTED") {
    return "booking-status cancelled";
  }

  return "booking-status pending";
};


export default function EstimateDetails() {

  const navigate = useNavigate();

  const { estimateId } = useParams();

  const { user } = useAuth();


  const [estimate, setEstimate] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [confirmMode, setConfirmMode] =
    useState(null);

  const [comments, setComments] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [decisionError, setDecisionError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  const [invoiceBusy, setInvoiceBusy] =
    useState(false);

  const [invoiceError, setInvoiceError] =
    useState("");


  const customerId =
    user?.customer_id ??
    user?.customer?.id;


  /* =====================================================
     LOAD ESTIMATE
  ===================================================== */

  const loadEstimate = async () => {

    if (!estimateId) {

      setLoading(false);

      setError(
        "Estimate ID is missing."
      );

      return;
    }


    try {

      setLoading(true);

      setError("");


      const data =
        await getEstimate(
          estimateId
        );


      setEstimate(data);

    } catch (err) {

      console.error(
        "Failed to load estimate:",
        err
      );


      setError(
        err?.response?.data?.detail ||
          "Unable to load this estimate. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadEstimate();

  }, [estimateId]);


  const handleViewWorkOrder = () => {

    navigate(
      `/customer/work-orders/${estimate.work_order_id}`
    );

  };


  const handleViewInvoice = async () => {

    if (invoiceBusy || !estimate) {
      return;
    }

    try {

      setInvoiceBusy(true);

      setInvoiceError("");


      const invoice =
        await getWorkOrderInvoice(
          estimate.work_order_id
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
     APPROVAL / REJECTION
  ===================================================== */

  const handleApproveClick = () => {

    setConfirmMode("approve");

    setComments("");

    setDecisionError("");

  };


  const handleRejectClick = () => {

    setConfirmMode("reject");

    setComments("");

    setDecisionError("");

  };


  const handleCancelConfirm = () => {

    setConfirmMode(null);

    setComments("");

    setDecisionError("");

  };


  const handleSubmitDecision = async () => {

    if (!confirmMode) {
      return;
    }

    if (!customerId) {

      setDecisionError(
        "Customer information is not available for this account."
      );

      return;
    }


    try {

      setSubmitting(true);

      setDecisionError("");


      const decision =
        confirmMode === "approve"
          ? "APPROVED"
          : "REJECTED";


      await createApproval(
        estimate.id,
        {
          customer_id: customerId,
          decision,
          comments:
            comments.trim() || null,
        }
      );


      setConfirmMode(null);

      setComments("");


      setSuccessMessage(
        decision === "APPROVED"
          ? "Estimate approved successfully."
          : "Estimate rejected."
      );


      await loadEstimate();

    } catch (err) {

      console.error(
        "Failed to submit decision:",
        err
      );


      setDecisionError(
        err?.response?.data?.detail ||
          "Unable to submit your decision. Please try again."
      );

    } finally {

      setSubmitting(false);

    }
  };


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
            Loading estimate details...
          </p>

        </div>

      </AppLayout>
    );

  }


  /* =====================================================
     ERROR
  ===================================================== */

  if (error || !estimate) {

    return (
      <AppLayout>

        <div className="booking-details-error">

          <div className="booking-details-error-icon">

            <FileText
              size={28}
            />

          </div>


          <h1>
            Estimate not found
          </h1>


          <p>
            {error ||
              "We couldn't find this estimate."}
          </p>


          <button
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

      </AppLayout>
    );

  }


  const isSent =
    estimate.status === "SENT";


  return (
    <AppLayout>

      <div className="estimate-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="estimate-header">

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


          <div className="estimate-title-row">

            <div>

              <p className="page-eyebrow">
                ESTIMATE
              </p>


              <h1>
                Estimate #{estimate.id}
              </h1>

            </div>


            <span
              className={getStatusClass(
                estimate.status
              )}
            >

              {estimate.status ||
                "DRAFT"}

            </span>

          </div>

        </div>


        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {successMessage && (

          <div className="estimate-success">

            <CheckCircle2
              size={18}
            />

            <span>
              {successMessage}
            </span>

          </div>

        )}


        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="estimate-summary-card">

          <div className="details-card-header">

            <div className="details-card-icon">

              <Receipt
                size={18}
              />

            </div>

            <div>

              <h2>
                Estimate summary
              </h2>

              <p>
                Breakdown of this estimate
              </p>

            </div>

          </div>


          <div className="estimate-grid">

            <div className="estimate-field">

              <span>
                Estimate ID
              </span>

              <strong>
                #{estimate.id}
              </strong>

            </div>


            <div className="estimate-field">

              <span>
                Work Order ID
              </span>

              <button
                type="button"
                className="estimate-link"
                onClick={handleViewWorkOrder}
              >

                #{estimate.work_order_id}

                <ChevronRight
                  size={14}
                />

              </button>

            </div>


            <div className="estimate-field">

              <span>
                Subtotal
              </span>

              <strong>
                {formatCurrency(
                  estimate.subtotal
                )}
              </strong>

            </div>


            <div className="estimate-field">

              <span>
                Tax (18%)
              </span>

              <strong>
                {formatCurrency(
                  estimate.tax_amount
                )}
              </strong>

            </div>


            <div className="estimate-field">

              <span>
                Discount
              </span>

              <strong>
                {formatCurrency(
                  estimate.discount_amount
                )}
              </strong>

            </div>


            <div className="estimate-field estimate-total-field">

              <span>
                Total Amount
              </span>

              <strong className="estimate-total-amount">
                {formatCurrency(
                  estimate.total_amount
                )}
              </strong>

            </div>


            <div className="estimate-field">

              <span>
                Estimated Duration
              </span>

              <strong>
                <Clock3
                  size={14}
                />

                {formatDuration(
                  estimate.estimated_duration_minutes
                )}
              </strong>

            </div>


            <div className="estimate-field">

              <span>
                Created Date
              </span>

              <strong>
                <CalendarDays
                  size={14}
                />

                {formatDate(
                  estimate.created_at
                )}
              </strong>

            </div>


            <div className="estimate-field">

              <span>
                Sent Date
              </span>

              <strong>
                <CalendarDays
                  size={14}
                />

                {formatDate(
                  estimate.sent_at
                )}
              </strong>

            </div>


            <div className="estimate-field">

              <span>
                Expiry Date
              </span>

              <strong>
                <CalendarDays
                  size={14}
                />

                {formatDate(
                  estimate.expires_at
                )}
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            APPROVAL / REJECTION
        ================================================= */}

        {isSent && (

          <section className="estimate-approval">

            <div className="estimate-approval-header">

              <div className="estimate-approval-icon">

                <BadgeCheck
                  size={18}
                />

              </div>

              <div>

                <h2>
                  Approve or reject this estimate
                </h2>

                <p>
                  Your decision moves the
                  work order forward.
                </p>

              </div>

            </div>


            {decisionError && (

              <div className="estimate-decision-error">

                <AlertCircle
                  size={16}
                />

                <span>
                  {decisionError}
                </span>

              </div>

            )}


            {!confirmMode ? (

              <div className="estimate-decision-actions">

                <button
                  type="button"
                  className="primary-action"
                  onClick={handleApproveClick}
                  disabled={submitting}
                >

                  <CheckCircle2
                    size={17}
                  />

                  Approve Estimate

                </button>


                <button
                  type="button"
                  className="estimate-reject-action"
                  onClick={handleRejectClick}
                  disabled={submitting}
                >

                  <XCircle
                    size={17}
                  />

                  Reject Estimate

                </button>

              </div>

            ) : (

              <div className="estimate-confirm">

                <div
                  className={`estimate-confirm-icon ${
                    confirmMode === "approve"
                      ? "approve"
                      : "reject"
                  }`}
                >

                  {confirmMode === "approve"
                    ? (
                      <CheckCircle2
                        size={22}
                      />
                    ) : (
                      <XCircle
                        size={22}
                      />
                    )}

                </div>


                <h3>
                  {confirmMode === "approve"
                    ? "Approve this estimate?"
                    : "Reject this estimate?"}
                </h3>


                <p>
                  {confirmMode === "approve"
                    ? "Are you sure you want to approve this estimate?"
                    : "Are you sure you want to reject this estimate?"}
                </p>


                <div className="estimate-confirm-field">

                  <label>
                    Reason / Comments
                  </label>

                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) =>
                      setComments(
                        e.target.value
                      )
                    }
                    placeholder="Optional — add any notes for the workshop"
                    disabled={submitting}
                  />

                </div>


                <div className="estimate-confirm-actions">

                  <button
                    type="button"
                    className="secondary-action"
                    onClick={handleCancelConfirm}
                    disabled={submitting}
                  >

                    Cancel

                  </button>


                  <button
                    type="button"
                    className={
                      confirmMode === "approve"
                        ? "primary-action"
                        : "estimate-reject-action"
                    }
                    onClick={handleSubmitDecision}
                    disabled={submitting}
                  >

                    {submitting ? (
                      <LoaderCircle
                        size={17}
                        className="spin"
                      />
                    ) : confirmMode === "approve" ? (
                      <CheckCircle2
                        size={17}
                      />
                    ) : (
                      <XCircle
                        size={17}
                      />
                    )}

                    {submitting
                      ? "Submitting..."
                      : confirmMode === "approve"
                        ? "Confirm Approval"
                        : "Confirm Rejection"}

                  </button>

                </div>

              </div>

            )}

          </section>

        )}


        {/* =================================================
            WORK ORDER LINK
        ================================================= */}

        {!isSent && (

          <section className="estimate-footnote">

            <ClipboardList
              size={16}
            />

            <span>
              This estimate is linked to

              <button
                type="button"
                className="estimate-footnote-link"
                onClick={handleViewWorkOrder}
              >

                Work Order #{estimate.work_order_id}

                <ChevronRight
                  size={14}
                />

              </button>

            </span>

          </section>

        )}


        {!isSent && (

          <section className="estimate-footnote">

            <Receipt
              size={16}
            />

            <span className="estimate-footnote-invoice">

              <button
                type="button"
                className="estimate-footnote-link"
                onClick={handleViewInvoice}
                disabled={invoiceBusy}
              >

                {invoiceBusy ? (
                  <LoaderCircle
                    size={14}
                    className="spin"
                  />
                ) : (
                  <Receipt
                    size={14}
                  />
                )}

                {invoiceBusy
                  ? "Checking invoice..."
                  : "View Invoice"}

              </button>

              {invoiceError && (

                <span className="estimate-footnote-error">

                  {invoiceError}

                </span>

              )}

            </span>

          </section>

        )}

      </div>

    </AppLayout>
  );
}
