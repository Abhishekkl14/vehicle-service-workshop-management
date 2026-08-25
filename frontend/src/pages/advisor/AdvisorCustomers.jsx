import {
  useEffect,
  useState,
} from "react";

import {
  Users,
  RefreshCw,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";
import {
  getAllCustomers,
} from "../../api/customerApi";
import AnimatedButton from "../../components/ui/animated-button";


export default function AdvisorCustomers() {

  const [customers, setCustomers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadCustomers = async () => {

    try {

      setLoading(true);
      setError("");

      const data =
        await getAllCustomers();

      setCustomers(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        "Failed to load customers:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load customers. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadCustomers();

  }, []);


  return (
    <AppLayout>

      <div className="advisor-dashboard advisor-customers-scope">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="advisor-header">

          <div>

            <p className="page-eyebrow">
              CUSTOMERS
            </p>

            <h1>
              Customers
            </h1>

            <p>
              View all registered
              customers in the
              workshop.
            </p>

          </div>

          <AnimatedButton
            type="button"
            className="secondary-action"
            onClick={loadCustomers}
            disabled={loading}
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? "spin"
                  : ""
              }
            />

            Refresh

          </AnimatedButton>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && !loading && (

          <div className="advisor-error">

            <AlertCircle
              size={16}
            />

            <span>
              {error}
            </span>

            <AnimatedButton
              type="button"
              onClick={loadCustomers}
            >
              Try Again
            </AnimatedButton>

          </div>

        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="booking-list">

            {[1, 2, 3].map(
              (item) => (

                <div
                  className="booking-skeleton"
                  key={item}
                >

                  <div
                    className="skeleton skeleton-icon"
                  />

                  <div className="booking-skeleton-content">

                    <div
                      className="skeleton skeleton-title"
                    />

                    <div
                      className="skeleton skeleton-line"
                    />

                    <div
                      className="skeleton skeleton-line short"
                    />

                  </div>

                </div>
              )
            )}

          </div>


        ) : error ? null : customers.length === 0 ? (


          /* =================================================
              EMPTY STATE
          ================================================= */

          <div className="advisor-empty">

            <div className="advisor-empty-icon">

              <Users
                size={26}
              />

            </div>

            <h3>
              No customers yet
            </h3>

            <p>
              Customers will appear
              here once they are
              registered.
            </p>

          </div>


        ) : (


          /* =================================================
              CUSTOMER TABLE
          ================================================= */

          <div className="advisor-section">

            <div className="section-header">

              <div>

                <h2>
                  All Customers ({customers.length})
                </h2>

              </div>

            </div>

            <div className="advisor-part-table-wrap">

              <table className="advisor-part-table">

                <thead>

                  <tr>

                    <th>
                      ID
                    </th>

                    <th>
                      Name
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      City
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {customers.map(
                    (customer) => (

                      <tr
                        key={customer.id}
                      >

                        <td>

                          <strong>
                            #{customer.id}
                          </strong>

                        </td>

                        <td>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >

                            <Users
                              size={14}
                            />

                            <span>
                              {customer.first_name}{" "}
                              {customer.last_name ||
                                ""}
                            </span>

                          </div>

                        </td>

                        <td>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >

                            <Mail
                              size={14}
                            />

                            <span>
                              {customer.email ||
                                "\u2014"}
                            </span>

                          </div>

                        </td>

                        <td>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >

                            <Phone
                              size={14}
                            />

                            <span>
                              {customer.phone ||
                                "\u2014"}
                            </span>

                          </div>

                        </td>

                        <td>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >

                            <MapPin
                              size={14}
                            />

                            <span>
                              {customer.city ||
                                "\u2014"}
                            </span>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </div>

    </AppLayout>
  );

}
