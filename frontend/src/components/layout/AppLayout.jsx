import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import GradientWaves from "../common/GradientWaves";

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

      <GradientWaves
        className="app-background-waves"
        horizonColor="#5227FF"
        waveColor="#FF9FFC"
        crestColor="#FFFFFF"
        speed={0.4}
        amplitude={2.5}
        waveScale={0.6}
        waveRatio={0.9}
        swell={35}
        turbulence={20}
        tilt={1.11}
        zoom={1}
        height={5.5}
        fogDepth={15}
        detail="medium"
        brightness={1}
        opacity={1}
        mouseInteraction
        parallaxStrength={0.5}
        grain
        grainIntensity={0.05}
      />

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