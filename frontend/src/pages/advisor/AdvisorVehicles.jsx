import {
  useEffect,
  useState,
} from "react";

import {
  Car,
  RefreshCw,
  AlertCircle,
  Hash,
} from "lucide-react";

import AppLayout from "../../components/layout/AppLayout";
import {
  getAllVehicles,
} from "../../api/vehicleApi";


export default function AdvisorVehicles() {

  const [vehicles, setVehicles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadVehicles = async () => {

    try {

      setLoading(true);
      setError("");

      const data =
        await getAllVehicles();

      setVehicles(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        "Failed to load vehicles:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load vehicles. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadVehicles();

  }, []);


  return (
    <AppLayout>

      <div className="advisor-dashboard">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="advisor-header">

          <div>

            <p className="page-eyebrow">
              VEHICLES
            </p>

            <h1>
              Vehicles
            </h1>

            <p>
              View all registered
              vehicles in the
              workshop.
            </p>

          </div>

          <button
            type="button"
            className="secondary-action"
            onClick={loadVehicles}
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

          </button>

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

            <button
              type="button"
              onClick={loadVehicles}
            >
              Try Again
            </button>

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


        ) : error ? null : vehicles.length === 0 ? (


          /* =================================================
              EMPTY STATE
          ================================================= */

          <div className="advisor-empty">

            <div className="advisor-empty-icon">

              <Car
                size={26}
              />

            </div>

            <h3>
              No vehicles yet
            </h3>

            <p>
              Vehicles will appear
              here once they are
              registered.
            </p>

          </div>


        ) : (


          /* =================================================
              VEHICLE TABLE
          ================================================= */

          <div className="advisor-section">

            <div className="section-header">

              <div>

                <h2>
                  All Vehicles ({vehicles.length})
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
                      Registration
                    </th>

                    <th>
                      Make
                    </th>

                    <th>
                      Model
                    </th>

                    <th>
                      Year
                    </th>

                    <th>
                      Color
                    </th>

                    <th>
                      Mileage
                    </th>

                    <th>
                      Customer
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {vehicles.map(
                    (vehicle) => (

                      <tr
                        key={vehicle.id}
                      >

                        <td>

                          <strong>
                            #{vehicle.id}
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

                            <Car
                              size={14}
                            />

                            <span>
                              {vehicle.registration_number}
                            </span>

                          </div>

                        </td>

                        <td>
                          {vehicle.make}
                        </td>

                        <td>
                          {vehicle.model}
                        </td>

                        <td>
                          {vehicle.manufacturing_year ||
                            "\u2014"}
                        </td>

                        <td>
                          {vehicle.color ||
                            "\u2014"}
                        </td>

                        <td>
                          {vehicle.mileage?.toLocaleString() ||
                            "0"}
                        </td>

                        <td>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >

                            <Hash
                              size={14}
                            />

                            <span>
                              #{vehicle.customer_id}
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
