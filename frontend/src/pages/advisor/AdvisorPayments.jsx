import {
  CreditCard,
  ChevronRight,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";


export default function AdvisorPayments() {

  const navigate = useNavigate();


  return (
    <AppLayout>

      <div className="bookings-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="bookings-header">

          <div>

            <p className="page-eyebrow">
              PAYMENTS
            </p>

            <h1>
              Payments
            </h1>

            <p>
              Payment tracking available in
              Invoices section.
            </p>

          </div>

        </div>


        {/* =================================================
            INFO CARD
        ================================================= */}

        <div className="bookings-empty">

          <div className="empty-booking-icon">

            <CreditCard
              size={30}
            />

          </div>

          <h2>
            Payment Tracking
          </h2>

          <p>
            Payment tracking is available in
            the Invoices section. View
            invoices and record payments
            from there.
          </p>

        </div>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <div className="hub-nav-grid">

          <button
            type="button"
            className="hub-nav-card"
            onClick={() =>
              navigate(
                "/advisor/invoices"
              )
            }
          >

            <div className="hub-nav-icon">

              <CreditCard
                size={20}
              />

            </div>

            <div>

              <h3>
                Invoices &amp; Payments
              </h3>

              <p>
                View invoices and record
                payments.
              </p>

            </div>

            <ChevronRight
              size={18}
            />

          </button>

        </div>

      </div>

    </AppLayout>
  );

}
