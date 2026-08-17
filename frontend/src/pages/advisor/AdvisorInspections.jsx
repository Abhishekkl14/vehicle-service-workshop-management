import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SearchCheck } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { getWorkOrdersByStatus } from "../../api/workOrderApi";
import { getInspectionByWorkOrderId } from "../../api/inspectionApi";

export default function AdvisorInspections() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        setLoading(true);
        const statuses = ["INSPECTION", "IN_PROGRESS", "SUBMITTED_FOR_APPROVAL", "COMPLETED"];
        const allWOs = [];
        for (const status of statuses) {
          try {
            const wos = await getWorkOrdersByStatus(status);
            allWOs.push(...wos);
          } catch { /* skip */ }
        }
        const results = [];
        for (const wo of allWOs) {
          try {
            const insp = await getInspectionByWorkOrderId(wo.id);
            if (insp) results.push({ ...insp, workOrder: wo });
          } catch { /* no inspection */ }
        }
        setInspections(results);
      } catch (err) {
        setError(err.message || "Failed to load inspections");
      } finally {
        setLoading(false);
      }
    };
    fetchInspections();
  }, []);

  return (
    <AppLayout>
      <div className="page-header">
        <h1><SearchCheck size={24} /> Inspections</h1>
      </div>
      <div className="content-area">
        {loading && <p>Loading inspections...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && inspections.length === 0 && (
          <div className="empty-state">
            <SearchCheck size={48} />
            <p>No inspections found</p>
          </div>
        )}
        {!loading && !error && inspections.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Inspection ID</th>
                <th>Work Order</th>
                <th>Vehicle</th>
                <th>Mechanic</th>
                <th>Inspected At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((insp) => (
                <tr key={insp.id}>
                  <td>#{insp.id}</td>
                  <td>WO#{insp.workOrder?.id}</td>
                  <td>{insp.workOrder?.vehicle_id || "—"}</td>
                  <td>Mechanic #{insp.mechanic_id}</td>
                  <td>{insp.inspected_at ? new Date(insp.inspected_at).toLocaleDateString() : "—"}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => navigate(`/advisor/inspections/${insp.id}`)}>
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
