import {
  Receipt,
  History,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";


export default function Invoices() {

  const navigate = useNavigate();


  return (
    <AppLayout>

      <div className="invoice-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="notifications-header">

          <div>

            <p className="page-eyebrow">
              INVOICES &amp; PAYMENTS
            </p>


            <h1>
              Invoices &amp; Payments
            </h1>


            <p>
              View your invoices and make
              payments.
            </p>

          </div>

        </div>


        {/* =================================================
            INFO
        ================================================= */}

        <section className="hub-info-card">

          <div className="hub-info-icon">

            <Receipt
              size={22}
            />

          </div>


          <div>

            <h2>
              Your invoices are available
              from completed work orders.
            </h2>


            <p>
              Once a service is completed
              and an invoice is generated,
              you can view it and record a
              payment. Payments can be
              made from the invoice
              details page.
            </p>

          </div>

        </section>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <div className="hub-nav-grid">

          <button
            type="button"
            className="hub-nav-card"
            onClick={() =>
              navigate(
                "/customer/service-history"
              )
            }
          >

            <div className="hub-nav-icon">

              <History
                size={20}
              />

            </div>

            <div>

              <h3>
                Service History
              </h3>

              <p>
                View completed services
                and their invoices.
              </p>

            </div>

            <ChevronRight
              size={18}
            />

          </button>


          <button
            type="button"
            className="hub-nav-card"
            onClick={() =>
              navigate(
                "/customer/dashboard"
              )
            }
          >

            <div className="hub-nav-icon">

              <LayoutDashboard
                size={20}
              />

            </div>

            <div>

              <h3>
                Dashboard
              </h3>

              <p>
                Return to your dashboard.
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
