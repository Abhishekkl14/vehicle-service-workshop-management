import {
  CreditCard,
  ChevronRight,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";
import AnimatedButton from "../../components/ui/animated-button";


export default function AdvisorPayments() {

  const navigate = useNavigate();


  return (
    <AppLayout>

      <div className="advisor-dashboard advisor-payments-scope">

        <div className="advisor-header">
          <div>
            <p className="page-eyebrow">PAYMENTS</p>
            <h1><CreditCard size={24} /> Payments</h1>
            <p>Payment tracking available in the Invoices section.</p>
          </div>
        </div>

        <div className="advisor-section">

          <div className="advisor-empty">
            <div className="advisor-empty-icon">
              <CreditCard size={26} />
            </div>
            <h3>Payment Tracking</h3>
            <p>Payment tracking is available in the Invoices section. View invoices and record payments from there.</p>
          </div>

          <div style={{ marginTop: 18 }} className="hub-nav-grid">
            <AnimatedButton
              type="button"
              className="hub-nav-card"
              onClick={() => navigate("/advisor/invoices")}
            >
              <div className="hub-nav-icon">
                <CreditCard size={20} />
              </div>

              <div>
                <h3>Invoices &amp; Payments</h3>
                <p>View invoices and record payments.</p>
              </div>

              <ChevronRight size={18} />
            </AnimatedButton>
          </div>

        </div>

      </div>

    </AppLayout>
  );

}
