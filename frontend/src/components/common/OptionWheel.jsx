import { useCallback, useEffect, useRef, useState } from "react";
import "./OptionWheel.css";

export default function OptionWheel({
  items = [],
  defaultSelected = 0,
  onChange,
  textColor = "#aac4c8",
  activeColor = "#ffffff",
  side = "left",
  fontSize =30,
  spacing = 2.00,
  curve = 0.8,
  tilt =4,
  blur = 0.5,
  fade = 0.25,
  minOpacity = 0.24,
  smoothing = 170,
  inset = 20,
  draggable = true,
  className = "",
}) {
  const rootRef = useRef(null);
  const itemRefs = useRef([]);
  const positionRef = useRef(defaultSelected);
  const targetRef = useRef(defaultSelected);
  const frameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const configRef = useRef({});
  const selectedRef = useRef(defaultSelected);
  const wheelTimerRef = useRef(null);
  const dragRef = useRef(null);
  const dragMovedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const [selectedIndex, setSelectedIndex] = useState(defaultSelected);
  const [isDragging, setIsDragging] = useState(false);

  onChangeRef.current = onChange;
  configRef.current = {
    count: items.length,
    items,
    rowHeight: Math.max(fontSize * spacing * 16, 1),
    curve,
    tilt,
    blur,
    fade,
    minOpacity,
    side,
    smoothing,
    draggable,
  };

  const runFrame = useCallback((now) => {
    const deltaTime = Math.min(
      (now - lastTimeRef.current) / 1000,
      0.05
    );
    lastTimeRef.current = now;
    const config = configRef.current;
    const smoothingTime = Math.max(config.smoothing, 1) / 1000;
    const easing = 1 - Math.exp(-deltaTime / smoothingTime);
    const nextPosition = positionRef.current +
      (targetRef.current - positionRef.current) * easing;
    const settled = Math.abs(targetRef.current - nextPosition) < 0.001;
    const position = settled ? targetRef.current : nextPosition;

    positionRef.current = position;
    const mirror = config.side === "right" ? -1 : 1;
    const tiltRadians = (config.tilt * Math.PI) / 180;
    const radius = tiltRadians > 0.0005
      ? config.rowHeight / tiltRadians
      : 0;

    for (let index = 0; index < config.count; index += 1) {
      const element = itemRefs.current[index];
      if (!element) continue;

      const distanceFromCenter = index - position;
      const distance = Math.abs(distanceFromCenter);
      const angle = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, distanceFromCenter * tiltRadians)
      );
      const x = radius > 0
        ? -mirror * radius * (1 - Math.cos(angle)) * config.curve
        : 0;
      const y = radius > 0
        ? radius * Math.sin(angle)
        : distanceFromCenter * config.rowHeight;
      const rotation = radius > 0
        ? (mirror * angle * 180) / Math.PI
        : 0;

      element.style.transform =
        `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rotation.toFixed(3)}deg)`;
      element.style.opacity = String(
        Math.max(config.minOpacity, 1 - distance * config.fade)
      );
      element.style.filter = config.blur > 0
        ? `blur(${(distance * config.blur).toFixed(2)}px)`
        : "none";
      element.style.setProperty(
        "--option-wheel-progress",
        Math.max(0, 1 - Math.min(distance, 1)).toFixed(4)
      );
    }

    frameRef.current = settled
      ? null
      : requestAnimationFrame(runFrame);
  }, []);

  const startLoop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }
    lastTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const applyTarget = useCallback((value, snap) => {
    const config = configRef.current;
    if (config.count === 0) return;

    let nextTarget = Math.min(
      Math.max(value, 0),
      Math.max(config.count - 1, 0)
    );
    if (snap) nextTarget = Math.round(nextTarget);
    targetRef.current = nextTarget;

    const nextIndex = Math.min(
      Math.max(Math.round(nextTarget), 0),
      config.count - 1
    );
    if (nextIndex !== selectedRef.current) {
      selectedRef.current = nextIndex;
      setSelectedIndex(nextIndex);
      if (snap) {
        onChangeRef.current?.(nextIndex, config.items[nextIndex]);
      }
    }
    startLoop();
  }, [startLoop]);

  const itemKey = items.join("\u0001");

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return undefined;

    const handleWheel = (event) => {
      event.preventDefault();
      const config = configRef.current;
      const delta = event.deltaMode === 1
        ? event.deltaY * 24
        : event.deltaY;
      const step = Math.max(
        -1,
        Math.min(1, delta / config.rowHeight)
      );
      applyTarget(targetRef.current + step, false);

      if (wheelTimerRef.current) {
        clearTimeout(wheelTimerRef.current);
      }
      wheelTimerRef.current = setTimeout(() => {
        applyTarget(targetRef.current, true);
      }, 140);
    };

    element.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      element.removeEventListener("wheel", handleWheel);
      if (wheelTimerRef.current) {
        clearTimeout(wheelTimerRef.current);
      }
    };
  }, [applyTarget]);

  const handlePointerDown = useCallback((event) => {
    if (!configRef.current.draggable) return;
    dragRef.current = {
      y: event.clientY,
      start: targetRef.current,
      pointerId: event.pointerId,
    };
    dragMovedRef.current = false;
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag) return;

    const distance = event.clientY - drag.y;
    if (!dragMovedRef.current && Math.abs(distance) > 4) {
      dragMovedRef.current = true;
      rootRef.current?.setPointerCapture(drag.pointerId);
    }
    if (dragMovedRef.current) {
      applyTarget(
        drag.start - distance / configRef.current.rowHeight,
        false
      );
    }
  }, [applyTarget]);

  const handlePointerEnd = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    if (dragMovedRef.current) {
      applyTarget(targetRef.current, true);
    }
  }, [applyTarget]);

  const handleItemClick = useCallback((index) => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    applyTarget(index, true);
  }, [applyTarget]);

  const handleKeyDown = useCallback((event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown" &&
        event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }
    event.preventDefault();
    applyTarget(
      Math.round(targetRef.current) +
        (event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1),
      true
    );
  }, [applyTarget]);

  useEffect(() => {
    const safeIndex = Math.min(
      Math.max(defaultSelected, 0),
      Math.max(items.length - 1, 0)
    );
    positionRef.current = safeIndex;
    targetRef.current = safeIndex;
    selectedRef.current = safeIndex;
    setSelectedIndex(safeIndex);
    applyTarget(safeIndex, false);
  }, [itemKey, defaultSelected, applyTarget]);

  useEffect(() => () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }
    if (wheelTimerRef.current) {
      clearTimeout(wheelTimerRef.current);
    }
  }, []);

  return (
    <div
      ref={rootRef}
      role="listbox"
      tabIndex={0}
      aria-label="Sidebar navigation"
      className={`option-wheel${side === "right" ? " option-wheel--right" : ""}${isDragging ? " option-wheel--dragging" : ""}${className ? ` ${className}` : ""}`}
      style={{
        "--option-wheel-text": textColor,
        "--option-wheel-active": activeColor,
        "--option-wheel-size": `${fontSize}rem`,
        "--option-wheel-inset": `${inset}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
    >
      {items.map((label, index) => (
        <div
          key={`${label}-${index}`}
          ref={(element) => {
            itemRefs.current[index] = element;
          }}
          role="option"
          aria-selected={selectedIndex === index}
          className={`option-wheel__item${selectedIndex === index ? " option-wheel__item--selected" : ""}`}
          onClick={() => handleItemClick(index)}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
