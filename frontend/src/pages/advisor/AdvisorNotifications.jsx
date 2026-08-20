import { useState, useEffect } from "react";
import { Bell, RefreshCw, AlertCircle, Check } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { getNotifications, markNotificationRead } from "../../api/notificationApi";
import AnimatedButton from "../../components/ui/animated-button";

export default function AdvisorNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError(err?.response?.data?.detail || err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.warn("Failed to mark notification read", err);
    }
  };

  return (
    <AppLayout>
      <div className="advisor-dashboard">
        <div className="advisor-header">
          <div>
            <p className="page-eyebrow">NOTIFICATIONS</p>
            <h1><Bell size={24} /> Notifications</h1>
            <p>Recent system notifications and alerts for advisor actions.</p>
          </div>

          <AnimatedButton
            type="button"
            className="secondary-action"
            onClick={loadNotifications}
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
              <AnimatedButton type="button" onClick={loadNotifications}>Try Again</AnimatedButton>
            </div>
          )}

          {loading && !error && (
            <div className="booking-list">
              {[1, 2, 3].map((i) => (
                <div className="booking-skeleton" key={i}>
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

          {!loading && !error && notifications.length === 0 && (
            <div className="advisor-empty">
              <div className="advisor-empty-icon"><Bell size={26} /></div>
              <h3>No notifications</h3>
              <p>When notifications are generated, they will appear here for review.</p>
            </div>
          )}

          {!loading && !error && notifications.length > 0 && (
            <div className="advisor-section">

              <div className="section-header">
                <div>
                  <h2>All Notifications ({notifications.length})</h2>
                </div>
              </div>

              <div className="advisor-part-table-wrap">
                <table className="advisor-part-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Message</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((n) => (
                      <tr key={n.id} className={n.is_read ? 'read' : 'unread'}>
                        <td><strong>#{n.id}</strong></td>
                        <td>{n.title}</td>
                        <td style={{ maxWidth: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.message}</td>
                        <td>{new Date(n.created_at).toLocaleString()}</td>
                        <td>
                          <span className={n.is_read ? 'booking-status confirmed' : 'booking-status pending'}>
                            {n.is_read ? 'READ' : 'UNREAD'}
                          </span>
                        </td>
                        <td>
                          {!n.is_read ? (
                            <button
                              type="button"
                              className="icon-button"
                              title="Mark as read"
                              onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                            >
                              <Check size={16} />
                            </button>
                          ) : (
                            <span style={{ color: '#666' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
