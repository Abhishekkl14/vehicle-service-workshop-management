import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function MechanicDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-placeholder">
      <span className="dashboard-label">
        MECHANIC
      </span>

      <h1>
        Welcome, {user?.first_name}
      </h1>

      <p>
        Your mechanic dashboard will appear here.
      </p>

      <button
        onClick={handleLogout}
        style={{
          marginTop: "20px",
          padding: "12px 22px",
          border: "none",
          borderRadius: "10px",
          background: "#03313A",
          color: "#8FFFE0",
          cursor: "pointer",
          fontWeight: "700",
        }}
      >
        Logout
      </button>
    </div>
  );
}