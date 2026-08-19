import { useCallback, useEffect, useRef } from "react";
import "./BorderGlow.css";

function parseHsl(value) {
  const match = String(value).match(
    /([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/
  );

  if (!match) {
    return { h: 40, s: 80, l: 80 };
  }

  return {
    h: Number(match[1]),
    s: Number(match[2]),
    l: Number(match[3]),
  };
}

function buildGlowVars(glowColor, intensity) {
  const { h, s, l } = parseHsl(glowColor);
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const suffixes = ["", "-60", "-50", "-40", "-30", "-20", "-10"];
  const vars = {};

  opacities.forEach((opacity, index) => {
    vars[`--glow-color${suffixes[index]}`] =
      `hsl(${h}deg ${s}% ${l}% / ${Math.min(
        opacity * intensity,
        100
      )}%)`;
  });

  return vars;
}

const GRADIENT_POSITIONS = [
  "80% 55%",
  "69% 34%",
  "8% 6%",
  "41% 38%",
  "86% 85%",
  "82% 18%",
  "51% 4%",
];

const GRADIENT_KEYS = [
  "--gradient-one",
  "--gradient-two",
  "--gradient-three",
  "--gradient-four",
  "--gradient-five",
  "--gradient-six",
  "--gradient-seven",
];

const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function buildGradientVars(colors) {
  const safeColors = colors.length > 0
    ? colors
    : ["#38bdf8"];
  const vars = {};

  GRADIENT_KEYS.forEach((key, index) => {
    const color = safeColors[
      Math.min(COLOR_MAP[index], safeColors.length - 1)
    ];
    vars[key] =
      `radial-gradient(at ${GRADIENT_POSITIONS[index]}, ${color} 0px, transparent 50%)`;
  });
  vars["--gradient-base"] =
    `linear-gradient(${safeColors[0]} 0 100%)`;

  return vars;
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function easeInCubic(value) {
  return value ** 3;
}

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}) {
  let frameId;
  let timeoutId;
  const startedAt = performance.now() + delay;

  const tick = () => {
    const elapsed = performance.now() - startedAt;
    const progress = Math.min(elapsed / duration, 1);
    onUpdate(start + (end - start) * ease(progress));

    if (progress < 1) {
      frameId = requestAnimationFrame(tick);
    } else {
      onEnd?.();
    }
  };

  timeoutId = window.setTimeout(() => {
    frameId = requestAnimationFrame(tick);
  }, delay);

  return () => {
    window.clearTimeout(timeoutId);
    if (frameId) cancelAnimationFrame(frameId);
  };
}

export default function BorderGlow({
  children,
  className = "",
  edgeSensitivity = 30,
  glowColor = "40 80 80",
  backgroundColor = "#ffffff",
  borderRadius = 16,
  glowRadius = 43,
  glowIntensity = 1,
  coneSpread = 25,
  animated = false,
  colors = ["#c084fc", "#f472b6", "#38bdf8"],
  fillOpacity = 0.32,
}) {
  const cardRef = useRef(null);

  const getCenter = useCallback((element) => {
    const { width, height } = element.getBoundingClientRect();
    return [width / 2, height / 2];
  }, []);

  const getEdgeProximity = useCallback((element, x, y) => {
    const [centerX, centerY] = getCenter(element);
    const distanceX = x - centerX;
    const distanceY = y - centerY;
    const xRatio = distanceX === 0
      ? Infinity
      : centerX / Math.abs(distanceX);
    const yRatio = distanceY === 0
      ? Infinity
      : centerY / Math.abs(distanceY);

    return Math.min(
      Math.max(1 / Math.min(xRatio, yRatio), 0),
      1
    );
  }, [getCenter]);

  const getCursorAngle = useCallback((element, x, y) => {
    const [centerX, centerY] = getCenter(element);
    const radians = Math.atan2(y - centerY, x - centerX);
    let degrees = radians * (180 / Math.PI) + 90;

    if (degrees < 0) degrees += 360;
    return degrees;
  }, [getCenter]);

  const handlePointerMove = useCallback((event) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const edge = getEdgeProximity(card, x, y);
    const angle = getCursorAngle(card, x, y);

    card.style.setProperty(
      "--edge-proximity",
      `${(edge * 100).toFixed(3)}`
    );
    card.style.setProperty(
      "--cursor-angle",
      `${angle.toFixed(3)}deg`
    );
  }, [getEdgeProximity, getCursorAngle]);

  useEffect(() => {
    if (!animated || !cardRef.current) return undefined;

    const card = cardRef.current;
    const cleanups = [];
    const angleStart = 110;
    const angleEnd = 465;
    card.classList.add("sweep-active");
    card.style.setProperty("--cursor-angle", `${angleStart}deg`);

    cleanups.push(animateValue({
      duration: 500,
      onUpdate: (value) =>
        card.style.setProperty("--edge-proximity", value),
    }));
    cleanups.push(animateValue({
      ease: easeInCubic,
      duration: 1500,
      end: 50,
      onUpdate: (value) =>
        card.style.setProperty(
          "--cursor-angle",
          `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`
        ),
    }));
    cleanups.push(animateValue({
      ease: easeOutCubic,
      delay: 1500,
      duration: 2250,
      start: 50,
      end: 100,
      onUpdate: (value) =>
        card.style.setProperty(
          "--cursor-angle",
          `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`
        ),
    }));
    cleanups.push(animateValue({
      ease: easeInCubic,
      delay: 2500,
      duration: 1500,
      start: 100,
      end: 0,
      onUpdate: (value) =>
        card.style.setProperty("--edge-proximity", value),
      onEnd: () => card.classList.remove("sweep-active"),
    }));

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      card.classList.remove("sweep-active");
    };
  }, [animated]);

  return (
    <div
      ref={cardRef}
      className={`border-glow-card ${className}`}
      onPointerMove={handlePointerMove}
      style={{
        "--card-bg": backgroundColor,
        "--edge-sensitivity": edgeSensitivity,
        "--border-radius": `${borderRadius}px`,
        "--glow-padding": `${glowRadius}px`,
        "--cone-spread": coneSpread,
        "--fill-opacity": fillOpacity,
        ...buildGlowVars(glowColor, glowIntensity),
        ...buildGradientVars(colors),
      }}
    >
      <span className="edge-light" />
      <div className="border-glow-inner">{children}</div>
    </div>
  );
}
