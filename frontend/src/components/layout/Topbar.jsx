import {
  Bell,
  ChevronDown,
  Menu,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import AnimatedButton from "../../components/ui/animated-button";

export default function Topbar({
  onMenuClick,
}) {
  const { user } = useAuth();

  const fullName =
    `${user?.first_name || ""} ${
      user?.last_name || ""
    }`.trim();

  const initials =
    `${user?.first_name?.[0] || ""}${
      user?.last_name?.[0] || ""
    }`.toUpperCase();

  return (
    <header className="topbar">

      <div className="topbar-left">

        <AnimatedButton
          className="mobile-menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={21} />
        </AnimatedButton>

        <div className="topbar-heading">
          <span>WORKSHOP MANAGEMENT</span>
          <h2>Workspace</h2>
        </div>

      </div>

      <div className="topbar-right">

        <AnimatedButton
          className="notification-button"
          aria-label="Notifications"
        >
          <Bell size={20} />

          <span className="notification-dot" />
        </AnimatedButton>

        <div className="topbar-divider" />

        <AnimatedButton className="profile-button">

          <div className="profile-avatar">
            {initials}
          </div>

          <div className="profile-info">
            <strong>{fullName}</strong>
            <span>{user?.role}</span>
          </div>

          <ChevronDown size={16} />

        </AnimatedButton>

      </div>

    </header>
  );
}