import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Car,
  Wrench,
  Shield,
  Gauge,
  Zap,
  Thermometer,
  Disc,
  CircleDot,
  Cog,
  Eye,
  ClipboardCheck,
  Battery,
  Wind,
  Settings,
} from "lucide-react";

const SERVICES = [
  {
    icon: Car,
    title: "Vehicle Diagnostics",
    x: "5%",
    y: "8%",
    r: "-3deg",
  },
  {
    icon: Wrench,
    title: "Oil Change",
    x: "28%",
    y: "2%",
    r: "2deg",
  },
  {
    icon: Disc,
    title: "Brake Service",
    x: "55%",
    y: "5%",
    r: "-1deg",
  },
  {
    icon: CircleDot,
    title: "Tire Rotation",
    x: "80%",
    y: "3%",
    r: "4deg",
  },
  {
    icon: Gauge,
    title: "Engine Repair",
    x: "12%",
    y: "32%",
    r: "2deg",
  },
  {
    icon: Battery,
    title: "Battery Check",
    x: "40%",
    y: "28%",
    r: "-4deg",
  },
  {
    icon: Eye,
    title: "Inspection",
    x: "68%",
    y: "30%",
    r: "1deg",
  },
  {
    icon: Zap,
    title: "Electrical",
    x: "3%",
    y: "58%",
    r: "-2deg",
  },
  {
    icon: Shield,
    title: "Warranty",
    x: "30%",
    y: "55%",
    r: "3deg",
  },
  {
    icon: Cog,
    title: "Transmission",
    x: "58%",
    y: "60%",
    r: "-3deg",
  },
  {
    icon: ClipboardCheck,
    title: "Estimates",
    x: "82%",
    y: "55%",
    r: "2deg",
  },
  {
    icon: Wind,
    title: "AC Service",
    x: "18%",
    y: "82%",
    r: "-1deg",
  },
  {
    icon: Settings,
    title: "Alignment",
    x: "48%",
    y: "85%",
    r: "3deg",
  },
  {
    icon: Thermometer,
    title: "Cooling System",
    x: "75%",
    y: "80%",
    r: "-2deg",
  },
];

const DEFAULT_RADIUS = 150;
const DEFAULT_MAX_SCALE = 2.2;
const DEFAULT_DURATION = 0.35;

export default function ProximityScaleGrid() {
  const stageRef = useRef(null);
  const cardsRef = useRef([]);
  const radiusRef = useRef(DEFAULT_RADIUS);
  const maxScaleRef = useRef(DEFAULT_MAX_SCALE);
  const durRef = useRef(DEFAULT_DURATION);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const cards = cardsRef.current.filter(Boolean);

    let ticking = false;

    const handleMouseMove = (e) => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const mx = e.clientX;
        const my = e.clientY;

        cards.forEach((card) => {
          const r = card.getBoundingClientRect();
          const d = Math.hypot(
            mx - (r.left + r.width / 2),
            my - (r.top + r.height / 2)
          );
          const p = gsap.utils.clamp(
            0,
            1,
            gsap.utils.mapRange(
              0,
              radiusRef.current,
              1,
              0,
              d
            )
          );
          gsap.to(card, {
            scale: 1 + (maxScaleRef.current - 1) * p,
            overwrite: true,
            ease: "power2.out",
            duration: durRef.current,
          });
        });

        ticking = false;
      });
    };

    const handleMouseLeave = () => {
      cards.forEach((card) => {
        gsap.to(card, {
          scale: 1,
          duration: durRef.current * 2,
          overwrite: true,
          ease: "power2.out",
        });
      });
    };

    stage.addEventListener("mousemove", handleMouseMove);
    stage.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      stage.removeEventListener("mousemove", handleMouseMove);
      stage.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="proximity-grid-wrapper">
      <div className="proximity-grid-header">
        <p className="page-eyebrow">
          OUR SERVICES
        </p>
        <h2>
          Explore what we offer
        </h2>
        <p>
          Move your cursor over the grid to
          discover our comprehensive vehicle
          service offerings.
        </p>
      </div>

      <div
        className="proximity-stage"
        ref={stageRef}
      >
        <div className="proximity-grid">
          {SERVICES.map((service, index) => {
            const Icon = service.icon;

            return (
              <div
                key={service.title}
                className="proximity-card"
                style={{
                  "--x": service.x,
                  "--y": service.y,
                  "--r": service.r,
                }}
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
              >
                <div className="proximity-card-icon">
                  <Icon size={28} />
                </div>

                <span className="proximity-card-title">
                  {service.title}
                </span>
              </div>
            );
          })}
        </div>

        <span className="proximity-stage-label">
          move cursor over grid
        </span>
      </div>
    </div>
  );
}
