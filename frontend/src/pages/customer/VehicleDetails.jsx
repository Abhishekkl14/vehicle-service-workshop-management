import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Car,
  Gauge,
  Hash,
  Palette,
  CalendarDays,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";
import { getVehicle } from "../../api/vehicleApi";

export default function VehicleDetails() {
  const navigate = useNavigate();
  const { vehicleId } = useParams();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVehicle = async () => {
    if (!vehicleId) {
      setError("Vehicle ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getVehicle(
        vehicleId
      );

      setVehicle(data);
    } catch (err) {
      console.error(
        "Failed to load vehicle:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load vehicle details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="vehicle-details-page">
          <div className="vehicle-loading">
            <RefreshCw
              size={24}
              className="spin"
            />

            <p>
              Loading vehicle details...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="vehicle-details-page">

          <button
            className="back-button"
            onClick={() =>
              navigate(
                "/customer/vehicles"
              )
            }
          >
            <ArrowLeft size={17} />
            Back to vehicles
          </button>

          <div className="vehicle-detail-error">
            <h2>
              Unable to load vehicle
            </h2>

            <p>{error}</p>

            <button
              className="primary-action"
              onClick={loadVehicle}
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>

        </div>
      </AppLayout>
    );
  }

  if (!vehicle) {
    return (
      <AppLayout>
        <div className="vehicle-details-page">

          <button
            className="back-button"
            onClick={() =>
              navigate(
                "/customer/vehicles"
              )
            }
          >
            <ArrowLeft size={17} />
            Back to vehicles
          </button>

          <div className="vehicle-detail-error">
            <h2>
              Vehicle not found
            </h2>

            <p>
              The requested vehicle could
              not be found.
            </p>
          </div>

        </div>
      </AppLayout>
    );
  }

  const vehicleName =
    `${vehicle.make || ""} ${
      vehicle.model || ""
    }`.trim() || "Vehicle";

  return (
    <AppLayout>
      <div className="vehicle-details-page">

        {/* HEADER */}

        <div className="vehicle-details-header">

          <div>

            <button
              className="back-button"
              onClick={() =>
                navigate(
                  "/customer/vehicles"
                )
              }
            >
              <ArrowLeft size={17} />
              Back to vehicles
            </button>

            <p className="page-eyebrow">
              VEHICLE DETAILS
            </p>

            <h1>
              {vehicleName}
            </h1>

            <p>
              Complete information about
              your registered vehicle.
            </p>

          </div>

        </div>

        {/* HERO */}

        <section className="vehicle-detail-hero">

          <div className="vehicle-detail-icon">
            <Car size={40} />
          </div>

          <div className="vehicle-detail-title">

            <h2>
              {vehicleName}
            </h2>

            <div className="vehicle-detail-registration">
              <Hash size={15} />

              {vehicle.registration_number ||
                "Registration unavailable"}
            </div>

          </div>

        </section>

        {/* INFORMATION */}

        <section className="vehicle-info-card">

          <div className="vehicle-info-header">
            <div>
              <h2>
                Vehicle information
              </h2>

              <p>
                Registered vehicle
                information.
              </p>
            </div>
          </div>

          <div className="vehicle-info-grid">

            <div className="vehicle-info-item">
              <div className="vehicle-info-icon">
                <Car size={17} />
              </div>

              <div>
                <span>
                  Make
                </span>

                <strong>
                  {vehicle.make || "—"}
                </strong>
              </div>
            </div>

            <div className="vehicle-info-item">
              <div className="vehicle-info-icon">
                <Car size={17} />
              </div>

              <div>
                <span>
                  Model
                </span>

                <strong>
                  {vehicle.model || "—"}
                </strong>
              </div>
            </div>

            <div className="vehicle-info-item">
              <div className="vehicle-info-icon">
                <CalendarDays size={17} />
              </div>

              <div>
                <span>
                  Manufacturing year
                </span>

                <strong>
                  {vehicle.manufacturing_year ||
                    "—"}
                </strong>
              </div>
            </div>

            <div className="vehicle-info-item">
              <div className="vehicle-info-icon">
                <Palette size={17} />
              </div>

              <div>
                <span>
                  Color
                </span>

                <strong>
                  {vehicle.color || "—"}
                </strong>
              </div>
            </div>

            <div className="vehicle-info-item">
              <div className="vehicle-info-icon">
                <Gauge size={17} />
              </div>

              <div>
                <span>
                  Mileage
                </span>

                <strong>
                  {vehicle.mileage != null
                    ? `${vehicle.mileage.toLocaleString()} km`
                    : "—"}
                </strong>
              </div>
            </div>

            <div className="vehicle-info-item">
              <div className="vehicle-info-icon">
                <Hash size={17} />
              </div>

              <div>
                <span>
                  VIN
                </span>

                <strong>
                  {vehicle.vin || "—"}
                </strong>
              </div>
            </div>

          </div>

        </section>

        {/* SERVICE HISTORY PLACEHOLDER */}

        <section className="vehicle-info-card">

          <div className="vehicle-info-header">

            <div>
              <h2>
                Service history
              </h2>

              <p>
                Service activity for this
                vehicle will appear here.
              </p>
            </div>

          </div>

          <div className="vehicle-history-empty">

            <div className="empty-vehicle-icon">
              <FileText size={27} />
            </div>

            <h3>
              No service history displayed
            </h3>

            <p>
              We'll connect this section
              to your work orders and
              bookings next.
            </p>

          </div>

        </section>

      </div>
    </AppLayout>
  );
}