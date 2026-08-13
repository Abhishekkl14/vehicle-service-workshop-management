import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";


export default function CustomerDashboard() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="dashboard-page">

        <div className="page-header">
          <div>
            <p className="page-eyebrow">
              CUSTOMER DASHBOARD
            </p>

            <h1>
              Welcome back,{" "}
              {user?.first_name}
            </h1>

            <p>
              Here's an overview of your
              vehicle service activity.
            </p>
          </div>
        </div>

        <div className="dashboard-grid">

          <div className="dashboard-card">
            <span>ACTIVE SERVICE</span>
            <strong>—</strong>
            <small>
              No active service
            </small>
          </div>

          <div className="dashboard-card">
            <span>MY VEHICLES</span>
            <strong>—</strong>
            <small>
              Vehicles registered
            </small>
          </div>

          <div className="dashboard-card">
            <span>ESTIMATES</span>
            <strong>—</strong>
            <small>
              Pending estimates
            </small>
          </div>

          <div className="dashboard-card">
            <span>PAYMENTS</span>
            <strong>—</strong>
            <small>
              Outstanding balance
            </small>
          </div>

        </div>

        <div className="dashboard-section">

          <div className="section-header">
            <div>
              <h2>Service activity</h2>
              <p>
                Your latest workshop activity
                will appear here.
              </p>
            </div>
          </div>

          <div className="empty-state">
            <div className="empty-state-icon">
              —
            </div>

            <h3>
              No service activity yet
            </h3>

            <p>
              Your bookings, work orders,
              estimates and invoices will
              appear here.
            </p>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}