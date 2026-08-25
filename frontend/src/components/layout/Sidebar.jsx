import {
  LayoutDashboard,
  Users,
  Car,
  CalendarDays,
  ClipboardList,
  SearchCheck,
  FileText,
  BadgeCheck,
  Receipt,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  History,
} from "lucide-react";

import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Garage360Logo from "../../assets/Garage360.png";
import AnimatedButton from "../../components/ui/animated-button";
import OptionWheel from "../../components/common/OptionWheel";

const navigation = {
  CUSTOMER: [
    {
      label: "Dashboard",
      path: "/customer/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Vehicles",
      path: "/customer/vehicles",
      icon: Car,
    },
    {
      label: "Bookings",
      path: "/customer/bookings",
      icon: CalendarDays,
    },
    {
      label: "Service History",
      path: "/customer/service-history",
      icon: History,
    },
    {
      label: "Work Orders",
      path: "/customer/work-orders",
      icon: ClipboardList,
    },
    {
      label: "Inspections",
      path: "/customer/inspections",
      icon: SearchCheck,
    },
    {
      label: "Estimates",
      path: "/customer/estimates",
      icon: FileText,
    },
    {
      label: "Invoices",
      path: "/customer/invoices",
      icon: Receipt,
    },
    {
      label: "Payments",
      path: "/customer/invoices",
      icon: CreditCard,
    },
    {
      label: "Notifications",
      path: "/customer/notifications",
      icon: Bell,
    },
  ],

  SERVICE_ADVISOR: [
    {
      label: "Dashboard",
      path: "/advisor/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Customers",
      path: "/advisor/customers",
      icon: Users,
    },
    {
      label: "Vehicles",
      path: "/advisor/vehicles",
      icon: Car,
    },
    {
      label: "Bookings",
      path: "/advisor/bookings",
      icon: CalendarDays,
    },
    {
      label: "Work Orders",
      path: "/advisor/work-orders",
      icon: ClipboardList,
    },
    {
      label: "Inspections",
      path: "/advisor/inspections",
      icon: SearchCheck,
    },
    {
      label: "Estimates",
      path: "/advisor/estimates",
      icon: FileText,
    },
    {
      label: "Approvals",
      path: "/advisor/approvals",
      icon: BadgeCheck,
    },
    {
      label: "Invoices",
      path: "/advisor/invoices",
      icon: Receipt,
    },
    {
      label: "Payments",
      path: "/advisor/payments",
      icon: CreditCard,
    },
    {
      label: "Notifications",
      path: "/advisor/notifications",
      icon: Bell,
    },
  ],

  MECHANIC: [
    {
      label: "Dashboard",
      path: "/mechanic/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Work Orders",
      path: "/mechanic/work-orders",
      icon: ClipboardList,
    },
    {
      label: "Inspections",
      path: "/mechanic/inspections",
      icon: SearchCheck,
    },
    {
      label: "Notifications",
      path: "/mechanic/notifications",
      icon: Bell,
    },
  ],
};

export default function Sidebar({
  onLogout,
}) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const rawRole = user?.role;
  // Backend may return the mechanic role as either "MECHANIC" or "TECHNICIAN"
  const role = rawRole === "TECHNICIAN" ? "MECHANIC" : rawRole;
  const items = navigation[role] || [];
  const activeIndex = Math.max(
    0,
    items.findIndex(
      (item) => location.pathname === item.path
    )
  );

  const roleLabel = {
    CUSTOMER: "Customer",
    SERVICE_ADVISOR: "Service Advisor",
    MECHANIC: "Mechanic",
  };

  return (
    <aside className="sidebar">

      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src={Garage360Logo} alt="Garage 360" />
        </div>

        <div>
          <div className="sidebar-brand">
            Garage<span> 360</span>
          </div>

          <div className="sidebar-role">
            {roleLabel[role]}
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">
          WORKSPACE
        </div>

        <OptionWheel
          items={items.map((item) => item.label)}
          defaultSelected={activeIndex}
          className="sidebar-option-wheel"
          fontSize={1.45}
          spacing={1.8}
          onChange={(index) => {
            const item = items[index];
            if (item) navigate(item.path);
          }}
        />
      </nav>

      <div className="sidebar-bottom">

        <NavLink
          to={`/${role?.toLowerCase()}/settings`}
          className="sidebar-link"
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>

        <AnimatedButton
          className="sidebar-logout"
          onClick={onLogout}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </AnimatedButton>

      </div>

    </aside>
  );
}