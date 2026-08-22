import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Car,
  Plus,
  RefreshCw,
  ChevronRight,
  Fuel,
  CalendarDays,
  Hash,
  X,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import AppLayout from "../../components/layout/AppLayout";

import {
  getCustomerVehicles,
  createVehicle,
} from "../../api/vehicleApi";
import { useNavigate } from "react-router-dom";
import AnimatedButton from "../../components/ui/animated-button";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

import porscheImage from "../../assets/vehicles/PORCHE.png";


export default function MyVehicles() {
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const dragProxyRef = useRef(null);
  const cardsRef = useRef([]);
  const activeIndexRef = useRef(0);
  const carouselApiRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const customerId =
    user?.customer_id ??
    user?.customer?.id;

  /* =====================================================
     ADD VEHICLE MODAL STATE
  ===================================================== */

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [addForm, setAddForm] = useState({
    make: "",
    model: "",
    registration_number: "",
    vin: "",
    manufacturing_year: "",
    color: "",
    mileage: "",
  });

  const [addSubmitting, setAddSubmitting] =
    useState(false);

  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] =
    useState(false);

  const resetAddForm = () => {
    setAddForm({
      make: "",
      model: "",
      registration_number: "",
      vin: "",
      manufacturing_year: "",
      color: "",
      mileage: "",
    });
    setAddError("");
    setAddSuccess(false);
  };

  const openAddModal = () => {
    resetAddForm();
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetAddForm();
  };

  const handleAddFormChange = (field, value) => {
    setAddForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddVehicle = async (event) => {
    event.preventDefault();
    setAddError("");

    if (!addForm.make.trim()) {
      setAddError("Make is required.");
      return;
    }

    if (!addForm.model.trim()) {
      setAddError("Model is required.");
      return;
    }

    if (!addForm.registration_number.trim()) {
      setAddError("Registration number is required.");
      return;
    }

    try {
      setAddSubmitting(true);

      const payload = {
        make: addForm.make.trim(),
        model: addForm.model.trim(),
        registration_number:
          addForm.registration_number.trim(),
        vin: addForm.vin.trim() || null,
        manufacturing_year:
          addForm.manufacturing_year
            ? Number(addForm.manufacturing_year)
            : null,
        color: addForm.color.trim() || null,
        mileage: addForm.mileage
          ? Number(addForm.mileage)
          : 0,
      };

      await createVehicle(payload);
      setAddSuccess(true);
      await loadVehicles();

      setTimeout(() => {
        closeAddModal();
      }, 1200);
    } catch (err) {
      console.error(
        "Failed to create vehicle:",
        err
      );

      setAddError(
        err?.response?.data?.detail ||
          "Unable to add vehicle. Please try again."
      );
    } finally {
      setAddSubmitting(false);
    }
  };

  /* =====================================================
     LOAD VEHICLES
  ===================================================== */

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

  useLayoutEffect(() => {
    const viewport = carouselRef.current;
    const dragProxy = dragProxyRef.current;
    const cards = cardsRef.current
      .slice(0, vehicles.length)
      .filter(Boolean);
    const count = vehicles.length;

    if (
      !viewport ||
      !dragProxy ||
      count === 0 ||
      cards.length !== count
    ) {
      carouselApiRef.current = null;
      return undefined;
    }

    activeIndexRef.current =
      ((activeIndexRef.current % count) + count) % count;
    setActiveIndex(activeIndexRef.current);
    const playhead = {
      value: activeIndexRef.current,
    };

    const getLayout = () => {
      const cardWidth = cards[0]?.offsetWidth || 300;
      const compactSpacing = viewport.clientWidth < 700;
      const spacing = compactSpacing
        ? Math.min(cardWidth * 0.78, viewport.clientWidth * 0.42)
        : Math.min(cardWidth + 24, viewport.clientWidth * 0.34);

      return { spacing };
    };

    const getRelativePosition = (index, fractionalIndex) => {
      let relative = ((index - fractionalIndex) % count + count) % count;
      if (relative > count / 2) relative -= count;
      return relative;
    };

    const setCardPositions = (fractionalIndex, immediate = false) => {
      const { spacing } = getLayout();
      cards.forEach((card, index) => {
        const relative = getRelativePosition(index, fractionalIndex);
        const distance = Math.abs(relative);
        const isActive = distance < 0.01;
        const vars = {
          x: relative * spacing,
          xPercent: -50,
          scale: isActive ? 1 : distance === 1 ? 0.82 : 0.62,
          opacity: isActive ? 1 : distance === 1 ? 0.64 : 0.2,
          rotation: relative * -1.5,
          zIndex: 100 - Math.round(distance),
        };

        if (immediate) {
          gsap.set(card, vars);
        } else {
          gsap.to(card, {
            ...vars,
            duration: 0.62,
            ease: "power3.out",
            overwrite: "auto",
          });
        }
      });
    };

    const animateTo = (requestedIndex) => {
      const wrappedIndex =
        ((requestedIndex % count) + count) % count;
      activeIndexRef.current = wrappedIndex;
      gsap.to(playhead, {
        value: requestedIndex,
        duration: 0.62,
        ease: "power3.out",
        overwrite: true,
        onUpdate: () =>
          setCardPositions(playhead.value, true),
        onComplete: () => setActiveIndex(wrappedIndex),
      });
    };

    let wheelUnlockTimer;
    const handleWheel = (event) => {
      if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) {
        if (Math.abs(event.deltaY) < 8) return;
      } else if (Math.abs(event.deltaX) < 8) {
        return;
      }

      event.preventDefault();

      const delta =
        Math.abs(event.deltaX) >= Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      const wheelStep = gsap.utils.clamp(
        -0.32,
        0.32,
        delta * 0.002
      );
      const wheelTarget = playhead.value + wheelStep;

      window.clearTimeout(wheelUnlockTimer);
      gsap.to(playhead, {
        value: wheelTarget,
        duration: 0.24,
        ease: "power2.out",
        overwrite: true,
        onUpdate: () =>
          setCardPositions(playhead.value, true),
      });
      wheelUnlockTimer = window.setTimeout(() => {
        animateTo(Math.round(playhead.value));
      }, 260);
    };

    activeIndexRef.current =
      ((activeIndexRef.current % count) + count) % count;
    setCardPositions(activeIndexRef.current, true);

    cards.forEach((card) => {
      const targetX = gsap.getProperty(card, "x");
      gsap.fromTo(
        card,
        {
          x: Number(targetX) + 110,
          scale: 0.72,
          opacity: 0,
        },
        {
          x: targetX,
          scale: gsap.getProperty(card, "scale"),
          opacity: gsap.getProperty(card, "opacity"),
          duration: 0.68,
          delay: 0.04,
          ease: "power3.out",
          overwrite: "auto",
        }
      );
    });

    viewport.addEventListener("wheel", handleWheel, { passive: false });

    const [draggable] = Draggable.create(dragProxy, {
      type: "x",
      trigger: viewport,
      onPress() {
        gsap.killTweensOf(playhead);
        this.startPlayhead = playhead.value;
        this.startProxyX = this.x;
        this.moved = false;
      },
      onDrag() {
        const distance = this.x - this.startProxyX;
        if (Math.abs(distance) > 6) this.moved = true;
        if (!this.moved) return;

        const spacing = getLayout().spacing || 1;
        playhead.value =
          this.startPlayhead - distance / spacing;
        setCardPositions(playhead.value, true);
      },
      onRelease() {
        suppressClickRef.current = this.moved;
      },
      onDragEnd() {
        if (this.moved) {
          animateTo(Math.round(playhead.value));
        }
        gsap.set(dragProxy, { x: 0 });
      },
    });

    carouselApiRef.current = {
      next: () => animateTo(activeIndexRef.current + 1),
      previous: () => animateTo(activeIndexRef.current - 1),
    };

    const handleResize = () => setCardPositions(activeIndexRef.current, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.clearTimeout(wheelUnlockTimer);
      viewport.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
      gsap.killTweensOf(cards);
      gsap.killTweensOf(playhead);
      draggable.kill();
      carouselApiRef.current = null;
    };
  }, [vehicles]);

  const handleVehicleClick = (vehicle) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    navigate(`/customer/vehicles/${vehicle.id}`);
  };

  const handleVehicleKeyDown = (event, vehicle) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleVehicleClick(vehicle);
    }
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

            <AnimatedButton
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
            </AnimatedButton>

            <AnimatedButton
              className="primary-action"
              onClick={openAddModal}
            >
              <Plus size={17} />

              Add Vehicle
            </AnimatedButton>

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

            <AnimatedButton onClick={loadVehicles}>
              Try again
            </AnimatedButton>

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
                registered with Garage 360 yet.
              </p>

              <AnimatedButton
                className="primary-action"
                onClick={openAddModal}
              >
                <Plus size={17} />

                Add your first vehicle
              </AnimatedButton>

            </div>
          )}

        {/* VEHICLES GRID */}

        {!loading &&
          !error &&
          vehicles.length > 0 && (
            <div className="vehicle-carousel">
              <div
                className="vehicle-carousel-viewport"
                ref={carouselRef}
                aria-label="My vehicles carousel"
              >
                {vehicles.map(
                  (vehicle, index) => (
                    <div
                      key={vehicle.id}
                      ref={(element) => {
                        cardsRef.current[index] = element;
                      }}
                      className="vehicle-card vehicle-carousel-card"
                      role="button"
                      tabIndex={0}
                      aria-current={
                        index === activeIndex
                          ? "true"
                          : undefined
                      }
                      onClick={() =>
                        handleVehicleClick(vehicle)
                      }
                      onKeyDown={(event) =>
                        handleVehicleKeyDown(
                          event,
                          vehicle
                        )
                      }
                    >
                    <div className="vehicle-card-image">
                      <img
                        src={porscheImage}
                        alt={getVehicleName(vehicle)}
                      />
                    </div>

                    <h2>
                      {getVehicleName(vehicle)}
                    </h2>

                    <div className="vehicle-registration">
                      <Hash size={12} />
                      <span>
                        {getRegistrationNumber(vehicle)}
                      </span>
                    </div>

                    <div className="vehicle-details">
                      <div>
                        <CalendarDays size={14} />
                        <span>{getYear(vehicle)}</span>
                      </div>
                      <div>
                        <Fuel size={14} />
                        <span>{getFuelType(vehicle)}</span>
                      </div>
                      {vehicle.color && (
                        <div>
                          <span>{vehicle.color}</span>
                        </div>
                      )}
                    </div>

                    <div className="vehicle-card-action">
                      View Details
                      <ChevronRight size={14} />
                    </div>
                    </div>
                  )
                )}
              </div>
              <div
                ref={dragProxyRef}
                className="vehicle-carousel-drag-proxy"
                aria-hidden="true"
              />

              <div className="vehicle-carousel-controls">
                <AnimatedButton
                  className="secondary-action"
                  onClick={() =>
                    carouselApiRef.current?.previous()
                  }
                  aria-label="Show previous vehicle"
                  disabled={vehicles.length < 2}
                >
                  <ChevronRight
                    size={16}
                    className="vehicle-carousel-prev-icon"
                  />
                  Previous
                </AnimatedButton>

                <span className="vehicle-carousel-position">
                  {activeIndex + 1} / {vehicles.length}
                </span>

                <AnimatedButton
                  className="secondary-action"
                  onClick={() =>
                    carouselApiRef.current?.next()
                  }
                  aria-label="Show next vehicle"
                  disabled={vehicles.length < 2}
                >
                  Next
                  <ChevronRight size={16} />
                </AnimatedButton>
              </div>
            </div>
          )}

      </div>

      {/* =====================================================
          ADD VEHICLE MODAL
      ===================================================== */}

      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={closeAddModal}
        >
          <div
            className="modal-card"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Add Vehicle</h2>
                <p>
                  Register a new vehicle to your
                  account.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeAddModal}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{ padding: "20px 24px" }}
            >
              {addSuccess && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    padding: "32px 0",
                  }}
                >
                  <CheckCircle2
                    size={38}
                    style={{
                      color:
                        "var(--cyber-teal)",
                    }}
                  />
                  <h3
                    style={{
                      margin: 0,
                      color:
                        "var(--cyber-teal)",
                      fontSize: 17,
                    }}
                  >
                    Vehicle added
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color:
                        "var(--text-secondary)",
                      fontSize: 13,
                    }}
                  >
                    Your vehicle has been
                    registered successfully.
                  </p>
                </div>
              )}

              {addError && !addSuccess && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: "12px 14px",
                    border: "1px solid rgba(194, 24, 91, 0.18)",
                    borderRadius: 10,
                    background:
                      "rgba(194, 24, 91, 0.05)",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "var(--raspberry)",
                      fontSize: 12,
                    }}
                  >
                    Unable to add vehicle
                  </strong>
                  <p
                    style={{
                      margin: "4px 0 0",
                      color:
                        "var(--text-secondary)",
                      fontSize: 11,
                    }}
                  >
                    {addError}
                  </p>
                </div>
              )}

              {!addSuccess && (
                <form
                  onSubmit={handleAddVehicle}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: "0 16px",
                    }}
                  >
                    <div className="form-field">
                      <label htmlFor="add-make">
                        Make *
                      </label>
                      <div className="input-box">
                        <input
                          id="add-make"
                          type="text"
                          placeholder="e.g. Toyota"
                          value={addForm.make}
                          onChange={(e) =>
                            handleAddFormChange(
                              "make",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="add-model">
                        Model *
                      </label>
                      <div className="input-box">
                        <input
                          id="add-model"
                          type="text"
                          placeholder="e.g. Camry"
                          value={addForm.model}
                          onChange={(e) =>
                            handleAddFormChange(
                              "model",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="add-rego">
                      Registration Number *
                    </label>
                    <div className="input-box">
                      <input
                        id="add-rego"
                        type="text"
                        placeholder="e.g. MH12AB1234"
                        value={
                          addForm.registration_number
                        }
                        onChange={(e) =>
                          handleAddFormChange(
                            "registration_number",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="add-vin">
                      VIN
                    </label>
                    <div className="input-box">
                      <input
                        id="add-vin"
                        type="text"
                        placeholder="Vehicle Identification Number"
                        value={addForm.vin}
                        onChange={(e) =>
                          handleAddFormChange(
                            "vin",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 1fr 1fr",
                      gap: "0 16px",
                    }}
                  >
                    <div className="form-field">
                      <label htmlFor="add-year">
                        Year
                      </label>
                      <div className="input-box">
                        <input
                          id="add-year"
                          type="number"
                          placeholder="e.g. 2024"
                          min="1900"
                          max="2099"
                          value={
                            addForm.manufacturing_year
                          }
                          onChange={(e) =>
                            handleAddFormChange(
                              "manufacturing_year",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="add-color">
                        Color
                      </label>
                      <div className="input-box">
                        <input
                          id="add-color"
                          type="text"
                          placeholder="e.g. White"
                          value={
                            addForm.color
                          }
                          onChange={(e) =>
                            handleAddFormChange(
                              "color",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="add-mileage">
                        Mileage
                      </label>
                      <div className="input-box">
                        <input
                          id="add-mileage"
                          type="number"
                          placeholder="0"
                          min="0"
                          value={
                            addForm.mileage
                          }
                          onChange={(e) =>
                            handleAddFormChange(
                              "mileage",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 10,
                      marginTop: 8,
                    }}
                  >
                    <AnimatedButton
                      className="secondary-action"
                      onClick={closeAddModal}
                      type="button"
                    >
                      Cancel
                    </AnimatedButton>

                    <AnimatedButton
                      className="primary-action"
                      type="submit"
                      disabled={addSubmitting}
                    >
                      {addSubmitting
                        ? "Adding..."
                        : "Add Vehicle"}
                    </AnimatedButton>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
