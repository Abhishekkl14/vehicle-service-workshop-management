import { useEffect, useState } from "react";

import {
  FileText,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  Wrench,
  CalendarDays,
} from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";

import {
  getWorkOrdersByStatus,
} from "../../api/workOrderApi";

import {
  getWorkOrderEstimates,
} from "../../api/estimateApi";
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
    return "\u2014";
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


export default function AdvisorEstimates() {

  const [estimates, setEstimates] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadEstimates = async () => {

    try {

      setLoading(true);
      setError("");

      const statuses = [
        "CREATED",
        "ASSIGNED",
        "INSPECTION",
        "IN_PROGRESS",
        "SUBMITTED_FOR_APPROVAL",
        "COMPLETED",
      ];

      const allWOs = [];

      for (const status of statuses) {

        try {

          const wos =
            await getWorkOrdersByStatus(
              status
            );

          allWOs.push(...wos);

        } catch {
          /* skip */
        }

      }

      const allEstimates = [];

      for (const wo of allWOs) {

        try {

          const estimates =
            await getWorkOrderEstimates(
              wo.id
            );

          if (
            Array.isArray(estimates)
          ) {

            for (const est of estimates) {

              allEstimates.push({
                ...est,
                workOrder: wo,
              });

            }

          }

        } catch {
          /* no estimates */
        }

      }

      setEstimates(allEstimates);

    } catch (err) {

      console.error(
        "Failed to load estimates:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load estimates. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadEstimates();

  }, []);


  return (
    <AppLayout>

      <div className="advisor-dashboard advisor-estimates-scope">

        <div className="advisor-header">
          <div>
            <p className="page-eyebrow">ESTIMATES</p>
            <h1><FileText size={24} /> Estimates</h1>
            <p>View and manage estimates for customer vehicles.</p>
          </div>

          <AnimatedButton
            type="button"
            className="secondary-action"
            onClick={loadEstimates}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Refresh
          </AnimatedButton>
        </div>

        <div className="advisor-section">

          {error && (
            <div className="advisor-error">
              <AlertCircle size={16} />
              <span>{error}</span>
              <AnimatedButton type="button" onClick={loadEstimates}>Try Again</AnimatedButton>
            </div>
          )}

          {loading && !error && (
            <div className="booking-list">
              {[1,2,3].map((item) => (
                <div className="booking-skeleton" key={item}>
                  <div className="skeleton skeleton-icon" />
                  <div className="booking-skeleton-content">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line short" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && estimates.length === 0 && (
            <div className="advisor-empty">
              <div className="advisor-empty-icon"><FileText size={26} /></div>
              <h3>No estimates yet</h3>
              <p>When estimates are created, they will appear here for review.</p>
            </div>
          )}

          {!loading && !error && estimates.length > 0 && (
            <div className="advisor-part-table-wrap">
              <table className="advisor-part-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Work Order</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.map((estimate) => (
                    <tr key={estimate.id}>
                      <td><strong>#{estimate.id}</strong></td>
                      <td>#{estimate.work_order_id}</td>
                      <td><strong>{formatCurrency(estimate.total_amount)}</strong></td>
                      <td><span className={getStatusClass(estimate.status)}>{estimate.status || "DRAFT"}</span></td>
                      <td>{formatDate(estimate.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>

    </AppLayout>
  );

}
