import {
  Receipt,
  LayoutDashboard,
  History,
  ChevronRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";
import AnimatedButton from "../../components/ui/animated-button";

export default function Payments() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="invoice-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="notifications-header">
          <div>
            <p className="page-eyebrow">PAYMENTS</p>

            <h1>Payments</h1>

            <p>
              Payments are recorded against individual invoices. To view
              payment history or record a payment, open an invoice from
              Service History or the Invoices hub.
            </p>
          </div>
        </div>

        {/* =================================================
            INFO
        ================================================= */}

        <section className="hub-info-card">
          <div className="hub-info-icon">
            <Receipt size={22} />
          </div>

          <div>
            <h2>Payments are tied to invoices</h2>

            <p>
              This page is a hub for payments. At the moment the app stores
              payments on each invoice detail. Use the links below to open
              completed work orders or the invoices list to find the invoice
              you want to view or pay.
            </p>
          </div>

        </section>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <div className="hub-nav-grid">

          <AnimatedButton
            type="button"
            className="hub-nav-card"
            onClick={() => navigate("/customer/service-history")}
          >
            <div className="hub-nav-icon">
              <History size={20} />
            </div>

            <div>
              <h3>Service History</h3>
              <p>Find completed services and their invoices.</p>
            </div>

            <ChevronRight size={18} />
          </AnimatedButton>

          <AnimatedButton
            type="button"
            className="hub-nav-card"
            onClick={() => navigate("/customer/invoices")}
          >
            <div className="hub-nav-icon">
              <LayoutDashboard size={20} />
            </div>

            <div>
              <h3>Invoices</h3>
              <p>View your invoices and open an invoice to see payments.</p>
            </div>

            <ChevronRight size={18} />
          </AnimatedButton>

          <AnimatedButton
            type="button"
            className="hub-nav-card"
            onClick={() => navigate("/customer/dashboard")}
          >
            <div className="hub-nav-icon">
              <LayoutDashboard size={20} />
            </div>

            <div>
              <h3>Dashboard</h3>
              <p>Return to your dashboard.</p>
            </div>

            <ChevronRight size={18} />
          </AnimatedButton>

        </div>

      </div>
    </AppLayout>
  );
}
