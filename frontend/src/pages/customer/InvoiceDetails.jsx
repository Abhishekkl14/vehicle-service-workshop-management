import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  LoaderCircle,
  Receipt,
  FileText,
  CalendarDays,
  Clock3,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Download,
  X,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";

import { useAuth } from "../../context/AuthContext";

import {
  getInvoice,
} from "../../api/invoiceApi";

import {
  getInvoicePayments,
  createPayment,
} from "../../api/paymentApi";


const PAYMENT_METHODS = [
  "CASH",
  "CARD",
  "UPI",
  "ONLINE",
];


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


const getPaymentStatusClass = (
  status
) => {
  const s = String(
    status || ""
  ).toUpperCase();

  if (s === "SUCCESS") {
    return "booking-status confirmed";
  }

  return "booking-status pending";
};


export default function InvoiceDetails() {

  const navigate = useNavigate();

  const { invoiceId } = useParams();

  const { user } = useAuth();

  const backUrl =
    user?.role === "SERVICE_ADVISOR"
      ? "/advisor/invoices"
      : "/customer/dashboard";


  const [invoice, setInvoice] =
    useState(null);

  const [invoiceLoading, setInvoiceLoading] =
    useState(true);

  const [invoiceError, setInvoiceError] =
    useState("");


  const [payments, setPayments] =
    useState([]);

  const [paymentsLoading, setPaymentsLoading] =
    useState(true);

  const [paymentsError, setPaymentsError] =
    useState("");


  const [amount, setAmount] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("CASH");

  const [transactionReference, setTransactionReference] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const paymentKeyRef = useRef(null);

  const getPaymentKey = () => {

    if (!paymentKeyRef.current) {

      paymentKeyRef.current =
        typeof crypto !== "undefined" &&
          typeof crypto.randomUUID ===
            "function"
          ? crypto.randomUUID()
          : `pay-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 10)}`;
    }

    return paymentKeyRef.current;
  };


  /* =====================================================
     LOAD INVOICE
  ===================================================== */

  const loadInvoice = async () => {

    if (!invoiceId) {

      setInvoiceLoading(false);

      setInvoiceError(
        "Invoice ID is missing."
      );

      return;
    }

    try {

      setInvoiceLoading(true);

      setInvoiceError("");


      const data =
        await getInvoice(
          invoiceId
        );


      setInvoice(data);

    } catch (err) {

      console.error(
        "Failed to load invoice:",
        err
      );


      setInvoiceError(
        err?.response?.data?.detail ||
          "Unable to load invoice."
      );

    } finally {

      setInvoiceLoading(false);

    }
  };


  /* =====================================================
     LOAD PAYMENT HISTORY
  ===================================================== */

  const loadPayments = async () => {

    if (!invoiceId) {
      return;
    }

    try {

      setPaymentsLoading(true);

      setPaymentsError("");


      const data =
        await getInvoicePayments(
          invoiceId
        );


      setPayments(
        Array.isArray(data)
          ? data
          : data?.items || []
      );

    } catch (err) {

      console.error(
        "Failed to load payment history:",
        err
      );


      setPaymentsError(
        err?.response?.data?.detail ||
          "Unable to load payment history."
      );

    } finally {

      setPaymentsLoading(false);

    }
  };


  useEffect(() => {

    loadInvoice();

    loadPayments();

  }, [invoiceId]);


  /* =====================================================
     DERIVED DATA
  ===================================================== */

  const paidAmount = payments
    .filter(
      (payment) =>
        payment.status === "SUCCESS"
    )
    .reduce(
      (sum, payment) =>
        sum +
        (Number(payment.amount) || 0),
      0
    );

  const remaining = invoice
    ? Math.max(
        0,
        (Number(
          invoice.total_amount
        ) || 0) - paidAmount
      )
    : 0;

  const canPay =
    Boolean(invoice) &&
    (invoice?.status === "UNPAID" ||
      invoice?.status ===
        "PARTIALLY_PAID") &&
    remaining > 0;


  useEffect(() => {

    if (remaining > 0) {

      setAmount(
        String(
          remaining
        )
      );

    }

  }, [remaining]);


  /* =====================================================
     MAKE PAYMENT
  ===================================================== */

  const handlePaymentSubmit = async () => {

    if (submitting || !invoice) {
      return;
    }

    const amountNumber =
      Number(amount);

    if (
      !amount ||
      Number.isNaN(amountNumber) ||
      amountNumber <= 0
    ) {

      setSubmitError(
        "Enter a valid payment amount."
      );

      return;
    }

    if (
      amountNumber >
      remaining + 0.001
    ) {

      setSubmitError(
        `Payment exceeds the remaining balance of ${formatCurrency(
          remaining
        )}.`
      );

      return;
    }

    try {

      setSubmitting(true);

      setSubmitError("");


      const payment =
        await createPayment({
          invoice_id: invoice.id,
          amount: amountNumber,
          payment_method: paymentMethod,
          transaction_reference:
            transactionReference.trim() ||
              getPaymentKey(),
        });


      paymentKeyRef.current = null;

      setSuccessMessage(
        `Payment of ${formatCurrency(
          payment.amount
        )} recorded.`
      );

      setTransactionReference("");


      await Promise.all([
        loadInvoice(),
        loadPayments(),
      ]);

    } catch (err) {

      console.error(
        "Failed to create payment:",
        err
      );


      setSubmitError(
        err?.response?.data?.detail ||
          "Unable to record payment. Please try again."
      );

    } finally {

      setSubmitting(false);

    }
  };


  /* =====================================================
     DOWNLOAD INVOICE
  ===================================================== */

  const handleDownload = () => {

    window.print();

  };


  /* =====================================================
     LOADING
  ===================================================== */

  if (invoiceLoading) {

    return (
      <AppLayout>

        <div className="booking-details-loading">

          <LoaderCircle
            size={30}
            className="spin"
          />

          <p>
            Loading invoice details...
          </p>

        </div>

      </AppLayout>
    );
  }


  /* =====================================================
     ERROR
  ===================================================== */

  if (invoiceError || !invoice) {

    return (
      <AppLayout>

        <div className="booking-details-error">

          <div className="booking-details-error-icon">

            <Receipt
              size={28}
            />

          </div>


          <h1>
            Invoice not found
          </h1>


          <p>
            {invoiceError ||
              "We couldn't find this invoice."}
          </p>


          <div className="booking-details-error-actions">

            <button
              type="button"
              className="secondary-action"
              onClick={loadInvoice}
            >

              Try Again

            </button>


            <button
              type="button"
              className="primary-action"
              onClick={() =>
                navigate(
                  backUrl
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

      <div className="invoice-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="invoice-header">

          <button
            className="back-button"
            onClick={() =>
              navigate(
                backUrl
              )
            }
          >

            <ArrowLeft
              size={17}
            />

            Back to dashboard

          </button>


          <div className="invoice-title-row">

            <div>

              <p className="page-eyebrow">
                INVOICE
              </p>


              <h1>
                Invoice #{invoice.invoice_number}
              </h1>

            </div>


            <span
              className={getInvoiceStatusClass(
                invoice.status
              )}
            >

              {invoice.status ||
                "UNKNOWN"}

            </span>

            {invoice.status === "PAID" && (

              <button
                type="button"
                className="secondary-action"
                onClick={handleDownload}
                style={{
                  marginLeft: "12px",
                }}
              >

                <Download
                  size={16}
                />

                Download Invoice

              </button>

            )}

          </div>

        </div>


        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {successMessage && (

          <div className="notice-success">

            <CheckCircle2
              size={18}
            />

            <span>
              {successMessage}
            </span>

            <button
              type="button"
              className="notice-close"
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
            INVOICE SUMMARY
        ================================================= */}

        <section className="invoice-summary-card">

          <div className="details-card-header">

            <div className="details-card-icon">

              <Receipt
                size={18}
              />

            </div>

            <div>

              <h2>
                Invoice summary
              </h2>

              <p>
                Details of this invoice
              </p>

            </div>

          </div>


          <div className="invoice-grid">

            <div className="invoice-field">

              <span>
                Invoice ID
              </span>

              <strong>

                <FileText
                  size={14}
                />

                #{invoice.id}

              </strong>

            </div>


            <div className="invoice-field">

              <span>
                Work Order ID
              </span>

              <strong>

                <ClipboardList
                  size={14}
                />

                #{invoice.work_order_id}

              </strong>

            </div>


            <div className="invoice-field">

              <span>
                Invoice Number
              </span>

              <strong>

                <Receipt
                  size={14}
                />

                {invoice.invoice_number}

              </strong>

            </div>


            <div className="invoice-field">

              <span>
                Status
              </span>

              <strong>

                <span
                  className={getInvoiceStatusClass(
                    invoice.status
                  )}
                >

                  {invoice.status}

                </span>

              </strong>

            </div>


            <div className="invoice-field">

              <span>
                Subtotal
              </span>

              <strong>
                {formatCurrency(
                  invoice.subtotal
                )}
              </strong>

            </div>


            <div className="invoice-field">

              <span>
                Tax
              </span>

              <strong>
                {formatCurrency(
                  invoice.tax_amount
                )}
              </strong>

            </div>


            <div className="invoice-field">

              <span>
                Discount
              </span>

              <strong>
                {formatCurrency(
                  invoice.discount_amount
                )}
              </strong>

            </div>


            <div className="invoice-field">

              <span>
                Total Amount
              </span>

              <strong className="invoice-amount">
                {formatCurrency(
                  invoice.total_amount
                )}
              </strong>

            </div>


            <div className="invoice-field">

              <span>
                Issued At
              </span>

              <strong>

                <CalendarDays
                  size={14}
                />

                {formatDate(
                  invoice.issued_at
                )}

              </strong>

            </div>


            <div className="invoice-field">

              <span>
                Due At
              </span>

              <strong>

                <Clock3
                  size={14}
                />

                {invoice.due_at
                  ? formatDate(
                      invoice.due_at
                    )
                  : "Not specified"}

              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            LINE ITEMS
        ================================================= */}

        {invoice.items && invoice.items.length > 0 && (

          <section className="invoice-line-items">

            <div className="details-card-header">

              <div className="details-card-icon">

                <FileText
                  size={18}
                />

              </div>

              <div>

                <h2>
                  Line Items
                </h2>

                <p>
                  Breakdown of charges
                </p>

              </div>

            </div>

            <div className="invoice-line-items-table-wrap">

              <table className="invoice-line-items-table">

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

                  {invoice.items.map((item) => (

                    <tr key={item.id}>

                      <td>

                        <span className={`booking-status ${
                          item.item_type === "LABOR"
                            ? "completed"
                            : item.item_type === "PART"
                              ? "pending"
                              : "confirmed"
                        }`}>

                          {item.item_type || "SERVICE"}

                        </span>

                      </td>

                      <td>
                        {item.description}
                      </td>

                      <td>
                        {item.quantity}
                      </td>

                      <td>
                        {formatCurrency(
                          item.unit_price
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          item.total_price
                        )}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </section>

        )}


        {/* =================================================
            PAYMENT HISTORY
        ================================================= */}

        <section className="invoice-payments">

          <div className="details-card-header">

            <div className="details-card-icon">

              <CreditCard
                size={18}
              />

            </div>

            <div>

              <h2>
                Payment History
              </h2>

              <p>
                Payments recorded against
                this invoice
              </p>

            </div>

          </div>


          {paymentsError && !paymentsLoading && (

            <div className="notice-error">

              <AlertCircle
                size={16}
              />

              <span>
                {paymentsError}
              </span>

              <button
                type="button"
                onClick={loadPayments}
              >

                Try Again

              </button>

            </div>

          )}


          {paymentsLoading ? (

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

          ) : paymentsError ? null : payments.length === 0 ? (

            <div className="invoice-empty">

              <div className="invoice-empty-icon">

                <CreditCard
                  size={26}
                />

              </div>


              <h3>
                No payments recorded yet.
              </h3>


              <p>
                Payments for this invoice
                will appear here.
              </p>

            </div>

          ) : (

            <div className="booking-list">

              {payments.map((payment) => (

                <article
                  className="invoice-payment-card"
                  key={payment.id}
                >

                  <div className="invoice-payment-top">

                    <div className="invoice-payment-icon">

                      <CreditCard
                        size={18}
                      />

                    </div>


                    <div>

                      <h3>
                        Payment #{payment.id}
                      </h3>

                      <p>
                        {formatDate(
                          payment.paid_at
                        )}
                      </p>

                    </div>


                    <span
                      className={getPaymentStatusClass(
                        payment.status
                      )}
                    >

                      {payment.status}

                    </span>

                  </div>


                  <div className="invoice-payment-meta">

                    <div>

                      <span>
                        Amount
                      </span>

                      <strong>
                        {formatCurrency(
                          payment.amount
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Payment Method
                      </span>

                      <strong>
                        {payment.payment_method}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Transaction Reference
                      </span>

                      <strong>
                        {payment.transaction_reference ||
                          "Not available"}
                      </strong>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>


        {/* =================================================
            MAKE PAYMENT
        ================================================= */}

        {canPay && (

          <section className="invoice-summary-card payment-section">

            <div className="details-card-header">

              <div className="details-card-icon">

                <CheckCircle2
                  size={18}
                />

              </div>

              <div>

                <h2>
                  Make a Payment
                </h2>

                <p>
                  Record a payment for this
                  invoice
                </p>

              </div>

            </div>


            <div className="payment-note">

              <AlertCircle
                size={14}
              />

              <span>
                Demo payment recording only.
                No real money is transferred.
              </span>

            </div>


            <div className="payment-remaining">

              <span>
                Remaining Balance
              </span>

              <strong>
                {formatCurrency(remaining)}
              </strong>

            </div>


            <div className="payment-form">

              {submitError && (

                <div className="notice-error">

                  <AlertCircle
                    size={16}
                  />

                  <span>
                    {submitError}
                  </span>

                </div>

              )}


              <div className="payment-form-row">

                <div className="payment-field">

                  <label>
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) =>
                      setAmount(
                        e.target.value
                      )
                    }
                    disabled={submitting}
                  />

                </div>


                <div className="payment-field">

                  <label>
                    Payment Method
                  </label>

                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value
                      )
                    }
                    disabled={submitting}
                  >

                    {PAYMENT_METHODS.map(
                      (method) => (

                        <option
                          key={method}
                          value={method}
                        >

                          {method}

                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              <div className="payment-field">

                <label>
                  Transaction Reference (optional)
                </label>

                <input
                  type="text"
                  value={transactionReference}
                  onChange={(e) =>
                    setTransactionReference(
                      e.target.value
                    )
                  }
                  placeholder="Optional reference"
                  disabled={submitting}
                />

              </div>


              <div className="payment-actions">

                <button
                  type="button"
                  className="primary-action"
                  onClick={handlePaymentSubmit}
                  disabled={submitting}
                >

                  {submitting ? (
                    <LoaderCircle
                      size={17}
                      className="spin"
                    />
                  ) : (
                    <CheckCircle2
                      size={17}
                    />
                  )}

                  {submitting
                    ? "Processing..."
                    : "Record Payment"}

                </button>

              </div>

            </div>

          </section>

        )}

      </div>

    </AppLayout>
  );
}
