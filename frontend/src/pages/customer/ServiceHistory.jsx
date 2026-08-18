import { useEffect, useState } from "react";

import {
  RefreshCw,
  History,
  Car,
  CalendarDays,
  FileText,
  Receipt,
  ClipboardList,
  ChevronRight,
  Plus,
  Wrench,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";

import {
  getCustomerServiceHistory,
} from "../../api/customerHistoryApi";

import {
  getWorkOrderInvoice,
} from "../../api/invoiceApi";
import AnimatedButton from "../../components/ui/animated-button";


const formatDate = (dateStr) => {
  if (!dateStr) {
    return "—";
  }

  const [year, month, day] =
    String(dateStr)
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return dateStr;
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


const getStatusClass = (status) => {
  const s = String(
    status || ""
  ).toUpperCase();

  if (
    s === "COMPLETED" ||
    s === "PAID"
  ) {
    return "success";
  }

  if (s === "IN_PROGRESS") {
    return "info";
  }

  if (
    s === "CANCELLED" ||
    s === "REJECTED"
  ) {
    return "error";
  }

  return "pending";
};


export default function ServiceHistory() {

  const navigate = useNavigate();

  const { user } = useAuth();


  const [records, setRecords] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const [invoiceLoadingId, setInvoiceLoadingId] =
    useState(null);

  const [invoiceError, setInvoiceError] =
    useState("");


  const customerId =
    user?.customer_id ??
    user?.customer?.id;


  /* =====================================================
     LOAD SERVICE HISTORY
  ===================================================== */

  const loadServiceHistory = async () => {

    if (!customerId) {

      setLoading(false);

      setError(
        "Customer information is not available for this account."
      );

      return;
    }


    try {

      setLoading(true);

      setError("");


      const data =
        await getCustomerServiceHistory(
          customerId
        );


      setRecords(
        Array.isArray(data)
          ? data
          : data?.items || []
      );

    } catch (err) {

      console.error(
        "Failed to load service history:",
        err
      );


      setError(
        err?.response?.data?.detail ||
          "Unable to load your service history. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadServiceHistory();

  }, [customerId]);


  const handleBookService = () => {

    navigate(
      "/customer/bookings/new"
    );
  };


  const handleViewBooking = (
    bookingId
  ) => {

    navigate(
      `/customer/bookings/${bookingId}`
    );
  };


  const handleViewWorkOrder = (
    workOrderId
  ) => {

    navigate(
      `/customer/work-orders/${workOrderId}`
    );
  };


  const handleViewInvoice = async (
    workOrderId
  ) => {

    if (
      invoiceLoadingId ===
      workOrderId
    ) {
      return;
    }

    try {

      setInvoiceLoadingId(
        workOrderId
      );

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

      setInvoiceLoadingId(null);

    }
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
              SERVICE HISTORY
            </p>


            <h1>
              Service History
            </h1>


            <p>
              View your previous workshop
              visits, services and invoices.
            </p>

          </div>


          <div className="history-actions">

            <AnimatedButton
              type="button"
              className="secondary-action"
              onClick={loadServiceHistory}
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

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="history-error">

            <div>

              <strong>
                Unable to load service history
              </strong>


              <p>
                {error}
              </p>

            </div>


            <AnimatedButton
              type="button"
              onClick={loadServiceHistory}
            >
              Try again
            </AnimatedButton>

          </div>

        )}


        {invoiceError && (

          <div className="notice-error">

            <AlertCircle
              size={16}
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


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && !error && (

          <div className="history-list">

            {[1, 2, 3].map(
              (item) => (

                <div
                  className="history-skeleton"
                  key={item}
                >

                  <div
                    className="skeleton skeleton-icon"
                  />

                  <div className="history-skeleton-content">

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
          records.length === 0 && (

            <div className="history-empty">

              <div className="history-empty-icon">

                <History
                  size={30}
                />

              </div>


              <h2>
                No service history
              </h2>


              <p>
                Your completed workshop
                services will appear here.
              </p>


              <AnimatedButton
                type="button"
                className="primary-action"
                onClick={handleBookService}
              >

                <Plus
                  size={17}
                />

                Book a Service

              </AnimatedButton>

            </div>

          )}


        {/* =================================================
            SERVICE HISTORY LIST
        ================================================= */}

        {!loading &&
          !error &&
          records.length > 0 && (

            <div className="history-list">

              {records.map(
                (record) => {

                  const vehicleName =
                    `${record.make || ""} ${
                      record.model || ""
                    }`.trim();

                  const hasBooking =
                    record.booking_id != null;

                  return (

                    <article
                      className="history-card"
                      key={`${record.booking_id}-${record.service_name}-${record.invoice_number}`}
                    >

                      <div className="history-card-top">

                        <div className="history-card-icon">

                          <Wrench
                            size={22}
                          />

                        </div>


                        <div className="history-card-heading">

                          <h2>
                            {record.service_name ||
                              "Workshop service"}
                          </h2>


                          <p>
                            Booking #
                            {record.booking_id}
                          </p>

                        </div>


                        {record.work_order_status && (

                          <span
                            className={`history-status ${getStatusClass(
                              record.work_order_status
                            )}`}
                          >

                            {record.work_order_status}

                          </span>

                        )}

                      </div>


                      <div className="history-card-grid">

                        <div className="history-field">

                          <span>
                            Service Date
                          </span>

                          <div className="history-field-value">

                            <CalendarDays
                              size={14}
                            />

                            <strong>
                              {formatDate(
                                record.booking_date
                              )}
                            </strong>

                          </div>

                        </div>


                        <div className="history-field">

                          <span>
                            Vehicle
                          </span>

                          <div className="history-field-value">

                            <Car
                              size={14}
                            />

                            <strong>
                              {vehicleName ||
                                "—"}
                            </strong>

                          </div>

                        </div>


                        <div className="history-field">

                          <span>
                            Registration
                          </span>

                          <div className="history-field-value">

                            <strong>
                              {record.registration_number ||
                                "—"}
                            </strong>

                          </div>

                        </div>


                        <div className="history-field">

                          <span>
                            Work Order
                          </span>

                          <div className="history-field-value">

                            <ClipboardList
                              size={14}
                            />

                            {record.work_order_id ? (
                              <AnimatedButton
                                type="button"
                                className="history-field-link"
                                onClick={() =>
                                  handleViewWorkOrder(
                                    record.work_order_id
                                  )
                                }
                              >

                                #{record.work_order_id}

                                <ChevronRight
                                  size={14}
                                />

                              </AnimatedButton>
                            ) : (
                              <strong>
                                —
                              </strong>
                            )}

                          </div>

                        </div>


                        <div className="history-field">

                          <span>
                            Invoice
                          </span>

                          <div className="history-field-value">

                            <Receipt
                              size={14}
                            />

                            <strong>
                              {record.invoice_number ||
                                "—"}
                            </strong>

                          </div>

                        </div>


                        <div className="history-field">

                          <span>
                            Invoice Total
                          </span>

                          <div className="history-field-value">

                            <strong className="history-amount">
                              {formatCurrency(
                                record.invoice_total
                              )}
                            </strong>

                          </div>

                        </div>

                      </div>


                      <div className="history-card-footer">

                        {record.invoice_status && (

                          <span
                            className={`history-status ${getStatusClass(
                              record.invoice_status
                            )}`}
                          >

                            <FileText
                              size={11}
                            />

                            {record.invoice_status}

                          </span>

                        )}


                        {record.work_order_id && (

                          <AnimatedButton
                            type="button"
                            className="history-view-button"
                            onClick={() =>
                              handleViewInvoice(
                                record.work_order_id
                              )
                            }
                            disabled={
                              invoiceLoadingId ===
                              record.work_order_id
                            }
                          >

                            {invoiceLoadingId ===
                            record.work_order_id ? (
                              <LoaderCircle
                                size={14}
                                className="spin"
                              />
                            ) : (
                              <Receipt
                                size={14}
                              />
                            )}

                            View Invoice

                            <ChevronRight
                              size={14}
                            />

                          </AnimatedButton>

                        )}


                        {hasBooking && (

                          <AnimatedButton
                            type="button"
                            className="history-view-button"
                            onClick={() =>
                              handleViewBooking(
                                record.booking_id
                              )
                            }
                          >

                            View Booking

                            <ChevronRight
                              size={14}
                            />

                          </AnimatedButton>

                        )}

                      </div>

                    </article>

                  );
                }
              )}

            </div>

          )}

      </div>

    </AppLayout>
  );
}
