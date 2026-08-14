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
  Wrench,
  History,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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

  const role = user?.role;
  const items = navigation[role] || [];

  const roleLabel = {
    CUSTOMER: "Customer",
    SERVICE_ADVISOR: "Service Advisor",
    MECHANIC: "Mechanic",
  };

  return (
    <aside className="sidebar">

      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Wrench size={22} />
        </div>

        <div>
          <div className="sidebar-brand">
            Auto<span>Flow</span>
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

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">

        <NavLink
          to={`/${role?.toLowerCase()}/settings`}
          className="sidebar-link"
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>

        <button
          className="sidebar-logout"
          onClick={onLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
}