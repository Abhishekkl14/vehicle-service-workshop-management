import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SearchCheck } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { getWorkOrdersByStatus } from "../../api/workOrderApi";
import { getInspectionByWorkOrderId } from "../../api/inspectionApi";
import AnimatedButton from "../../components/ui/animated-button";

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
      <div className="advisor-dashboard advisor-inspections-scope">

        <div className="advisor-header">
          <div>
            <p className="page-eyebrow">INSPECTIONS</p>
            <h1><SearchCheck size={24} /> Inspections</h1>
            <p>View and manage all inspections associated with work orders.</p>
          </div>
        </div>

        <div className="advisor-section">
          {loading && <p>Loading inspections...</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && inspections.length === 0 && (
            <div className="advisor-empty">
              <div className="advisor-empty-icon">
                <SearchCheck size={26} />
              </div>
              <h3>No inspections found</h3>
              <p>Inspections will appear here once they are created or linked to a work order.</p>
            </div>
          )}

          {!loading && !error && inspections.length > 0 && (
            <div className="advisor-part-table-wrap">
              <table className="advisor-part-table">
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
                    <tr key={insp.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/advisor/inspections/${insp.id}`)}>
                      <td><strong>#{insp.id}</strong></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>WO#{insp.workOrder?.id}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>Vehicle #{insp.workOrder?.vehicle_id || "—"}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>{insp.mechanic_id ? `Mechanic #${insp.mechanic_id}` : "Not assigned"}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>{insp.inspected_at ? new Date(insp.inspected_at).toLocaleDateString() : "—"}</span>
                        </div>
                      </td>
                      <td>
                        <AnimatedButton type="button" className="secondary-action" onClick={(e) => { e.stopPropagation(); navigate(`/advisor/inspections/${insp.id}`); }}>
                          View Details
                        </AnimatedButton>
                      </td>
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
