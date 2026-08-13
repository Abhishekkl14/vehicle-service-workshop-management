import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({
  children,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div className="app-shell">

      <Sidebar
        onLogout={handleLogout}
      />

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <div className="app-main">

        <Topbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        <main className="app-content">
          {children}
        </main>

      </div>

    </div>
  );
}