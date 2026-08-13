import { useEffect, useState } from "react";
import {
  Car,
  Plus,
  RefreshCw,
  ChevronRight,
  Fuel,
  CalendarDays,
  Hash,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";

import { getCustomerVehicles } from "../../api/vehicleApi";
import { useNavigate } from "react-router-dom";


export default function MyVehicles() {
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const customerId =
    user?.customer_id ??
    user?.customer?.id;

  const loadVehicles = async () => {
    if (!customerId) {
      setLoading(false);
      setError(
        "Customer information is not available for this account."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getCustomerVehicles(
        customerId
      );

      if (Array.isArray(data)) {
        setVehicles(data);
      } else if (Array.isArray(data?.items)) {
        setVehicles(data.items);
      } else {
        setVehicles([]);
      }
    } catch (err) {
      console.error(
        "Failed to load vehicles:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load your vehicles. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [customerId]);

  const getVehicleName = (vehicle) => {
    const make =
      vehicle.make ||
      vehicle.brand ||
      "";

    const model =
      vehicle.model ||
      vehicle.vehicle_model ||
      "";

    const name =
      `${make} ${model}`.trim();

    return name || "Vehicle";
  };

  const getRegistrationNumber = (vehicle) => {
    return (
      vehicle.registration_number ||
      vehicle.registration_no ||
      vehicle.license_plate ||
      vehicle.number_plate ||
      "Registration unavailable"
    );
  };

  const getYear = (vehicle) => {
    return (
      vehicle.year ||
      vehicle.manufacturing_year ||
      vehicle.model_year ||
      "—"
    );
  };

  const getFuelType = (vehicle) => {
    return (
      vehicle.fuel_type ||
      vehicle.fuel ||
      "—"
    );
  };

  return (
    <AppLayout>
      <div className="vehicles-page">

        {/* PAGE HEADER */}

        <div className="vehicles-header">

          <div>
            <p className="page-eyebrow">
              VEHICLES
            </p>

            <h1>
              My Vehicles
            </h1>

            <p>
              View and manage the vehicles
              registered with your workshop.
            </p>
          </div>

          <div className="vehicles-actions">

            <button
              className="secondary-action"
              onClick={loadVehicles}
              disabled={loading}
            >
              <RefreshCw
                size={16}
                className={
                  loading ? "spin" : ""
                }
              />

              Refresh
            </button>

            <button
              className="primary-action"
              onClick={() =>
                alert(
                  "Add vehicle functionality will be connected next."
                )
              }
            >
              <Plus size={17} />

              Add Vehicle
            </button>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="vehicles-error">

            <div>
              <strong>
                Unable to load vehicles
              </strong>

              <p>
                {error}
              </p>
            </div>

            <button onClick={loadVehicles}>
              Try again
            </button>

          </div>
        )}

        {/* LOADING */}

        {loading && !error && (
          <div className="vehicles-grid">

            {[1, 2, 3].map((item) => (
              <div
                className="vehicle-card skeleton-card"
                key={item}
              >
                <div className="skeleton skeleton-icon" />

                <div className="skeleton skeleton-title" />

                <div className="skeleton skeleton-line" />

                <div className="skeleton skeleton-line short" />

                <div className="skeleton skeleton-button" />
              </div>
            ))}

          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          vehicles.length === 0 && (
            <div className="vehicles-empty">

              <div className="empty-vehicle-icon">
                <Car size={30} />
              </div>

              <h2>
                No vehicles registered
              </h2>

              <p>
                You don't have any vehicles
                registered with AutoFlow yet.
              </p>

              <button
                className="primary-action"
                onClick={() =>
                  alert(
                    "Add vehicle functionality will be connected next."
                  )
                }
              >
                <Plus size={17} />

                Add your first vehicle
              </button>

            </div>
          )}

        {/* VEHICLES */}

        {!loading &&
          !error &&
          vehicles.length > 0 && (
            <div className="vehicles-grid">

              {vehicles.map((vehicle) => (
                <article
                  className="vehicle-card"
                  key={vehicle.id}
                >

                  <div className="vehicle-card-top">

                    <div className="vehicle-icon">
                      <Car size={24} />
                    </div>

                    <span className="vehicle-status">
                      Registered
                    </span>

                  </div>

                  <h2>
                    {getVehicleName(vehicle)}
                  </h2>

                  <div className="vehicle-registration">

                    <Hash size={14} />

                    <span>
                      {getRegistrationNumber(
                        vehicle
                      )}
                    </span>

                  </div>

                  <div className="vehicle-details">

                    <div>
                      <CalendarDays size={15} />

                      <span>
                        {getYear(vehicle)}
                      </span>
                    </div>

                    <div>
                      <Fuel size={15} />

                      <span>
                        {getFuelType(vehicle)}
                      </span>
                    </div>

                  </div>

                  <button
                    className="vehicle-details-button"
                    onClick={() =>
                        navigate(
                        `/customer/vehicles/${vehicle.id}`
                        )
                     }
                        >
                        View details

                        <ChevronRight size={16} />
                </button>

                </article>
              ))}

            </div>
          )}

      </div>
    </AppLayout>
  );
}