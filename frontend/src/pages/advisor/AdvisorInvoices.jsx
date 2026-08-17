import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { getWorkOrdersByStatus } from "../../api/workOrderApi";
import { getWorkOrderInvoice } from "../../api/invoiceApi";

export default function AdvisorInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const statuses = ["COMPLETED", "SUBMITTED_FOR_APPROVAL"];
        const allWOs = [];
        for (const status of statuses) {
          try {
            const wos = await getWorkOrdersByStatus(status);
            allWOs.push(...wos);
          } catch {
            /* skip */
          }
        }
        const results = [];
        for (const wo of allWOs) {
          try {
            const inv = await getWorkOrderInvoice(wo.id);
            if (inv) results.push({ ...inv, workOrder: wo });
          } catch {
            /* no invoice */
          }
        }
        setInvoices(results);
      } catch (err) {
        setError(err.message || "Failed to load invoices");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  return (
    <AppLayout>
      <div className="page-header">
        <h1>
          <Receipt size={24} /> Invoices
        </h1>
      </div>
      <div className="content-area">
        {loading && <p>Loading invoices...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && invoices.length === 0 && (
          <div className="empty-state">
            <Receipt size={48} />
            <p>No invoices found</p>
          </div>
        )}
        {!loading && !error && invoices.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Work Order</th>
                <th>Status</th>
                <th>Total</th>
                <th>Issued</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoice_number}</td>
                  <td>WO#{inv.work_order_id}</td>
                  <td>
                    <span className={`status-badge status-${inv.status?.toLowerCase()}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>₹{Number(inv.total_amount).toLocaleString()}</td>
                  <td>
                    {inv.issued_at
                      ? new Date(inv.issued_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() =>
                        navigate(`/advisor/invoices/${inv.id}`)
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
