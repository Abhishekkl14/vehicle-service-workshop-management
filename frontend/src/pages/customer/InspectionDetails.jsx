import { useEffect, useState } from "react";

import {
  ArrowLeft,
  LoaderCircle,
  FileText,
  ClipboardList,
  CalendarDays,
  Wrench,
  Stethoscope,
  AlertTriangle,
  CheckSquare,
  MessageSquare,
  SearchCheck,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";

import {
  getInspection,
  getInspectionItems,
} from "../../api/inspectionApi";


const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );
};


const getSeverityClass = (severity) => {
  const s = String(
    severity || ""
  ).toUpperCase();

  if (s === "LOW") {
    return "low";
  }

  if (s === "MEDIUM") {
    return "medium";
  }

  if (s === "HIGH") {
    return "high";
  }

  if (s === "CRITICAL") {
    return "critical";
  }

  return "neutral";
};


export default function InspectionDetails() {

  const navigate = useNavigate();

  const { inspectionId } = useParams();

  const { user } = useAuth();

  const backUrl =
    user?.role === "SERVICE_ADVISOR"
      ? "/advisor/inspections"
      : "/customer/dashboard";


  const [inspection, setInspection] =
    useState(null);

  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =====================================================
     LOAD INSPECTION + ITEMS
  ===================================================== */

  const loadInspection = async () => {

    if (!inspectionId) {

      setLoading(false);

      setError(
        "Inspection ID is missing."
      );

      return;
    }


    try {

      setLoading(true);

      setError("");


      const [
        inspectionData,
        itemsData,
      ] = await Promise.all([

        getInspection(
          inspectionId
        ),

        getInspectionItems(
          inspectionId
        ),

      ]);


      setInspection(
        inspectionData
      );

      setItems(
        Array.isArray(itemsData)
          ? itemsData
          : itemsData?.items || []
      );

    } catch (err) {

      console.error(
        "Failed to load inspection:",
        err
      );


      setError(
        err?.response?.data?.detail ||
          "Unable to load inspection."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadInspection();

  }, [inspectionId]);


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (
      <AppLayout>

        <div className="booking-details-loading">

          <LoaderCircle
            size={30}
            className="spin"
          />

          <p>
            Loading inspection details...
          </p>

        </div>

      </AppLayout>
    );

  }


  /* =====================================================
     ERROR
  ===================================================== */

  if (error || !inspection) {

    return (
      <AppLayout>

        <div className="booking-details-error">

          <div className="booking-details-error-icon">

            <FileText
              size={28}
            />

          </div>


          <h1>
            Inspection not found
          </h1>


          <p>
            {error ||
              "We couldn't find this inspection."}
          </p>


          <div className="booking-details-error-actions">

            <button
              type="button"
              className="secondary-action"
              onClick={loadInspection}
            >

              Try Again

            </button>


            <button
              type="button"
              className="primary-action"
              onClick={() =>
                navigate(
                  backUrl
                )
              }
            >

              <ArrowLeft
                size={17}
              />

              Back to dashboard

            </button>

          </div>

        </div>

      </AppLayout>
    );

  }


  return (
    <AppLayout>

      <div className="inspection-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="inspection-header">

          <button
            className="back-button"
            onClick={() =>
              navigate(
                backUrl
              )
            }
          >

            <ArrowLeft
              size={17}
            />

            Back to dashboard

          </button>


          <div className="inspection-title-row">

            <div>

              <p className="page-eyebrow">
                INSPECTION
              </p>


              <h1>
                Inspection #{inspection.id}
              </h1>

            </div>

          </div>

        </div>


        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="inspection-summary-card">

          <div className="details-card-header">

            <div className="details-card-icon">

              <SearchCheck
                size={18}
              />

            </div>

            <div>

              <h2>
                Inspection summary
              </h2>

              <p>
                Details of this inspection
              </p>

            </div>

          </div>


          <div className="inspection-grid">

            <div className="inspection-field">

              <span>
                Inspection ID
              </span>

              <strong>
                #{inspection.id}
              </strong>

            </div>


            <div className="inspection-field">

              <span>
                Work Order ID
              </span>

              <strong>
                <ClipboardList
                  size={14}
                />

                #{inspection.work_order_id}
              </strong>

            </div>


            <div className="inspection-field">

              <span>
                Mechanic ID
              </span>

              <strong>
                <Wrench
                  size={14}
                />

                #{inspection.mechanic_id}
              </strong>

            </div>


            <div className="inspection-field">

              <span>
                Inspection Date
              </span>

              <strong>
                <CalendarDays
                  size={14}
                />

                {formatDate(
                  inspection.inspected_at
                )}
              </strong>

            </div>


            <div className="inspection-field inspection-field-full">

              <span>
                Overall Notes
              </span>

              <strong className="inspection-overall-notes">
                <MessageSquare
                  size={14}
                />

                {inspection.overall_notes ||
                  "Not available"}
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            FINDINGS
        ================================================= */}

        <section className="inspection-findings">

          <div className="inspection-findings-header">

            <div className="details-card-icon">

              <Stethoscope
                size={18}
              />

            </div>

            <div>

              <h2>
                Inspection Findings
              </h2>

              <p>
                Components checked during
                this inspection
              </p>

            </div>

          </div>


          {items.length === 0 ? (

            <div className="inspection-empty">

              <div className="inspection-empty-icon">

                <SearchCheck
                  size={28}
                />

              </div>


              <h3>
                No inspection findings
              </h3>


              <p>
                This inspection does not
                have any recorded findings
                yet.
              </p>

            </div>

          ) : (

            <div className="inspection-items-list">

              {items.map((item) => (

                <article
                  className="inspection-item-card"
                  key={item.id}
                >

                  <div className="inspection-item-top">

                    <h3>
                      {item.component}
                    </h3>


                    <div className="inspection-item-badges">

                      <span className="condition-badge">
                        {item.condition}
                      </span>


                      <span
                        className={`severity-badge ${getSeverityClass(
                          item.severity
                        )}`}
                      >

                        {item.severity}

                      </span>

                    </div>

                  </div>


                  <div className="inspection-item-details">

                    <div className="inspection-item-detail">

                      <span>
                        <MessageSquare
                          size={13}
                        />

                        Notes
                      </span>

                      <p>
                        {item.notes ||
                          "No notes recorded."}
                      </p>

                    </div>


                    <div className="inspection-item-detail">

                      <span>
                        <CheckSquare
                          size={13}
                        />

                        Recommended Action
                      </span>

                      <p>
                        {item.recommended_action ||
                          "No recommendation recorded."}
                      </p>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>


        {/* =================================================
            FOOTNOTE
        ================================================= */}

        <section className="inspection-footnote">

          <AlertTriangle
            size={16}
          />

          <span>
            This inspection is linked to
            Work Order #{inspection.work_order_id}.
          </span>

        </section>

      </div>

    </AppLayout>
  );
}
