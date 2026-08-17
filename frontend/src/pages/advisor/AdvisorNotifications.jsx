import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { getNotifications, markNotificationRead } from "../../api/notificationApi";

export default function AdvisorNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const data = await getNotifications();
        setNotifications(data);
      } catch (err) {
        setError(err.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch { /* ignore */ }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1><Bell size={24} /> Notifications</h1>
      </div>
      <div className="content-area">
        {loading && <p>Loading notifications...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && notifications.length === 0 && (
          <div className="empty-state">
            <Bell size={48} />
            <p>No notifications</p>
          </div>
        )}
        {!loading && !error && notifications.length > 0 && (
          <div className="notification-list">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`notification-item ${n.is_read ? "read" : "unread"}`}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
              >
                <div className="notification-icon">
                  <Bell size={18} />
                </div>
                <div className="notification-content">
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                  <span className="notification-time">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
